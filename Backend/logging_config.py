"""
Módulo de Configuración de Logging para ASTRA HEALTH Backend.

Propósito:
    Establece un esquema de registro dual (consola para eventos operativos en nivel INFO,
    y archivo rotativo para advertencias y errores críticos en nivel WARNING).
    Garantiza la trazabilidad de peticiones y auditoría clínica sin exponer datos sensibles.

Autor: Equipo de Ingeniería de ASTRA HEALTH
Versión: 1.0.0
Dependencias: logging, logging.handlers, pathlib, flask
Advertencias de seguridad:
    - NUNCA registrar claves de API en texto plano o valores biomédicos detallados
      ni contenidos íntegros de notas privadas de astronautas en los registros.
    - Únicamente registrar identificadores de cliente anonimizados y resúmenes de estado.
"""

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from flask import Flask, request, g

# Directorio de logs predeterminado
BASE_DIR = Path(__file__).resolve().parent
LOGS_DIR = BASE_DIR / "logs"


def setup_logging(app: Flask) -> logging.Logger:
    """Configura los controladores de registros para la aplicación Flask.

    Establece un manejador hacia consola (nivel INFO) y un manejador rotativo en disco
    (nivel WARNING, máximo 10MB con 5 archivos de respaldo).

    Args:
        app (Flask): Instancia principal de la aplicación Flask.

    Returns:
        logging.Logger: Registrador configurado para el backend.

    Example:
        >>> app = Flask(__name__)
        >>> logger = setup_logging(app)
        >>> logger.info("Sistema inicializado.")

    Security Note:
        El formato de log incluye marcas temporales ISO y omite cualquier cuerpo (body)
        de petición o cabecera que contenga información secreta o personal (PII/PHI).
    """
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    log_file_path = LOGS_DIR / "backend.log"

    logger = logging.getLogger("astra_health")
    logger.setLevel(logging.DEBUG)

    # Evita duplicidad de handlers si la función se invoca múltiples veces
    if logger.hasHandlers():
        logger.handlers.clear()

    # Formato común para registros estructurados
    log_formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(name)s] [%(filename)s:%(lineno)d]: %(message)s"
    )

    # 1. Handler para Consola (Salida estándar)
    console_handler = logging.StreamHandler()
    console_level_name = app.config.get("LOG_LEVEL_CONSOLE", "INFO").upper()
    console_handler.setLevel(getattr(logging, console_level_name, logging.INFO))
    console_handler.setFormatter(log_formatter)
    logger.addHandler(console_handler)

    # 2. Handler de Archivo Rotativo (Máximo 10MB por archivo, conserva 5 rotaciones)
    file_handler = RotatingFileHandler(
        str(log_file_path),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_level_name = app.config.get("LOG_LEVEL_FILE", "WARNING").upper()
    file_handler.setLevel(getattr(logging, file_level_name, logging.WARNING))
    file_handler.setFormatter(log_formatter)
    logger.addHandler(file_handler)

    # Sincroniza con el logger interno de Flask
    app.logger.handlers = logger.handlers
    app.logger.setLevel(logger.level)

    # Hooks de ciclo de vida para auditoría segura de peticiones HTTP
    @app.before_request
    def log_request_info() -> None:
        """Registra metadatos de la petición entrante sin exponer secretos."""
        # Se omite el healthcheck de los logs para no saturar los registros en alta frecuencia
        if request.path == "/api/health":
            return

        client_name = getattr(g, "client_name", "anónimo")
        client_ip = request.remote_addr or "desconocido"
        logger.info(
            f"Solicitud entrante: {request.method} {request.path} | "
            f"Cliente: {client_name} | Origen IP: {client_ip}"
        )

    @app.after_request
    def log_response_info(response):
        """Registra el código de estado retornado por la petición procesada."""
        if request.path == "/api/health":
            return response

        client_name = getattr(g, "client_name", "anónimo")
        logger.info(
            f"Respuesta enviada: {request.method} {request.path} | "
            f"Status: {response.status_code} | Cliente: {client_name}"
        )
        return response

    return logger
