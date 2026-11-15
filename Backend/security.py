"""
Módulo de Seguridad, Autenticación y Rate Limiting para ASTRA HEALTH Backend.

Propósito:
    Implementa controles de seguridad perimetral para la API REST:
    - Autenticación criptográfica con API Keys hasheadas con SHA-256.
    - Limitador de tasa (Rate Limiting) en memoria con ventana deslizante thread-safe.
    - Inyección de cabeceras de endurecimiento HTTP (Security Headers).
    - Protección contra fuerza bruta, DoS y fugas de información sensible.

Autor: Equipo de Ingeniería de ASTRA HEALTH
Versión: 1.0.0
Dependencias: hashlib, time, functools, threading, flask
Advertencias de seguridad:
    - Las API Keys NUNCA deben almacenarse en texto plano.
    - El limitador en memoria protege la disponibilidad de la CPU en la Raspberry Pi.
"""

import hashlib
import time
import threading
from functools import wraps
from typing import Callable, Any, Dict, List
from flask import request, jsonify, g, current_app, Response
from database import get_db

# Estructura en memoria para rate limiting: {identificador: [marcas_de_tiempo]}
_rate_limit_store: Dict[str, List[float]] = {}
_rate_limit_lock = threading.Lock()


def hash_api_key(api_key: str) -> str:
    """Calcula el resumen criptográfico SHA-256 de una API Key en texto plano.

    Args:
        api_key (str): Clave enviada por el cliente.

    Returns:
        str: Cadena hexadecimal de 64 caracteres representativa del hash SHA-256.

    Example:
        >>> h = hash_api_key("test_key_123")
        >>> len(h)
        64

    Security Note:
        El almacenamiento exclusivo del hash previene que una eventual filtración
        o volcado de la base de datos comprometa las credenciales activas del sistema.
    """
    return hashlib.sha256(api_key.encode("utf-8")).hexdigest()


def require_api_key(f: Callable[..., Any]) -> Callable[..., Any]:
    """Decorador que exige una API Key válida enviada en la cabecera 'X-API-Key'.

    Verifica la existencia y vigencia de la clave en la tabla 'api_keys'.
    Actualiza la marca temporal 'ultimo_uso' si es válida y expone el nombre del cliente en g.

    Args:
        f (Callable): Vista de endpoint a proteger.

    Returns:
        Callable: Función envuelta con verificación de autorización.

    Raises:
        Retorna 401 Unauthorized si la clave es nula, vacía o inexistente en la base de datos.

    Security Note:
        Protege todos los endpoints operativos para garantizar que sólo hardware autorizado
        (ESP32 con firmware firmado o App de Raspberry Pi) interactúe con el backend.
    """
    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        # Extracción de la clave desde la cabecera estándar
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return jsonify({"error": "API key inválida o ausente"}), 401

        key_hash = hash_api_key(api_key.strip())

        # Consulta parametrizada segura contra inyección SQL
        with get_db() as db:
            row = db.execute(
                "SELECT id, nombre_cliente, activa FROM api_keys WHERE key_hash = ?",
                (key_hash,),
            ).fetchone()

            if row is None or row["activa"] != 1:
                return jsonify({"error": "API key inválida o ausente"}), 401

            # Actualiza el registro de último uso de manera asíncrona dentro de la transacción
            db.execute(
                "UPDATE api_keys SET ultimo_uso = ? WHERE id = ?",
                (int(time.time()), row["id"]),
            )

            # Inyecta los metadatos del cliente en el contexto de la petición actual
            g.client_name = row["nombre_cliente"]
            g.api_key_hash = key_hash

        return f(*args, **kwargs)

    return decorated_function


def rate_limit(
    max_requests: int | None = None,
    window_seconds: int | None = None,
) -> Callable[..., Any]:
    """Decorador de limitación de tasa basado en una ventana deslizante en memoria.

    Lleva la cuenta de solicitudes por API key (o dirección IP si la petición no está autenticada)
    dentro de un intervalo temporal deslizante para prevenir saturación y ataques de denegación de servicio.

    Args:
        max_requests (int | None): Número máximo de solicitudes toleradas en la ventana.
        window_seconds (int | None): Duración en segundos de la ventana de evaluación.

    Returns:
        Callable: Decorador aplicable a controladores Flask.

    Security Note:
        La operación se realiza bajo un candado (threading.Lock) para garantizar la
        consistencia atómica ante accesos concurrentes de múltiples hilos de servidor.
    """
    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            limit = max_requests
            window = window_seconds

            if limit is None:
                limit = current_app.config.get("RATE_LIMIT_MAX_REQUESTS", 100)
            if window is None:
                window = current_app.config.get("RATE_LIMIT_WINDOW_SECONDS", 60)

            # Se toma como identificador de cliente el hash de la clave o la IP de origen
            client_id = getattr(g, "api_key_hash", None)
            if not client_id:
                client_id = request.headers.get("X-API-Key")
                if client_id:
                    client_id = hash_api_key(client_id.strip())
                else:
                    client_id = request.remote_addr or "anonymous"

            now = time.time()
            cutoff = now - window

            with _rate_limit_lock:
                timestamps = _rate_limit_store.setdefault(client_id, [])
                # Purga de marcas de tiempo fuera de la ventana activa
                timestamps = [t for t in timestamps if t > cutoff]
                _rate_limit_store[client_id] = timestamps

                if len(timestamps) >= limit:
                    oldest = timestamps[0]
                    retry_after = max(1, int(oldest + window - now))
                    response = jsonify({
                        "error": "Rate limit excedido",
                        "retry_after": retry_after,
                    })
                    response.status_code = 429
                    response.headers["Retry-After"] = str(retry_after)
                    return response

                # Registro de la petición actual
                timestamps.append(now)

            return f(*args, **kwargs)

        return wrapped

    return decorator


def register_security_headers(app: Any) -> None:
    """Registra manejadores de cabeceras de endurecimiento HTTP en la aplicación Flask.

    Inyecta directivas de protección contra Clickjacking, MIME sniffing, XSS y fijación de caché.

    Args:
        app: Instancia de la aplicación Flask.

    Security Note:
        - X-Content-Type-Options: nosniff previene ataques basados en confusión de tipos MIME.
        - X-Frame-Options: DENY impide que la app sea embebida en iframes hostiles (Clickjacking).
        - Content-Security-Policy: default-src 'none' restringe cualquier inyección de scripts externos.
        - Cache-Control: no-store protege datos médicos confidenciales en memorias intermedias.
    """
    @app.after_request
    def apply_security_headers(response: Response) -> Response:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "default-src 'none'"

        # La cabecera HSTS se aplica opcionalmente según configuración para despliegues con TLS
        if app.config.get("ENABLE_HSTS", False):
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # Endpoints con datos fisiológicos sensibles no deben almacenarse en cachés locales o intermedias
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"

        return response
