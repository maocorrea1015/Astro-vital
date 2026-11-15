"""
Módulo de Validación de Entrada y Sanitización para ASTRA HEALTH Backend.

Propósito:
    Provee funciones de validación semántica, tipado estricto y sanitización de datos
    para todas las cargas útiles (payloads) entrantes sin dependencias externas.
    Previene inyecciones SQL, ataques XSS, datos fuera de rango fisiológico y abusos DoS.

Autor: Equipo de Ingeniería de ASTRA HEALTH
Versión: 1.0.0
Dependencias: re, time, html
Advertencias de seguridad:
    - Todos los datos provenientes de clientes deben ser considerados hostiles y no confiables.
    - Se aplica validación estricta por lista blanca (allow-list) en identificadores y variables.
"""

import re
import time
import html
from typing import Any, Tuple, List, Dict

# Lista blanca de variables fisiológicas y ambientales permitidas
ALLOWED_VARIABLES = {
    "heart_rate",
    "spo2",
    "temperature",
    "radiation_cpm",
    "activity",
}

# Lista blanca de estados cualitativos de los sensores
ALLOWED_QUALITIES = {"ok", "degraded", "sensor_fault"}

# Rangos de validez física y biológica plausible
# Cualquier valor fuera de estos rangos se considera anomalía de transmisión o hardware
PHYSICAL_RANGES = {
    "heart_rate": (0.0, 300.0),       # Latidos por minuto (BPM)
    "spo2": (0.0, 100.0),             # Saturación de oxígeno en sangre (%)
    "temperature": (25.0, 45.0),      # Grados Celsius
    "radiation_cpm": (0.0, 10000.0),  # Cuentas por minuto de radiación ionizante
    "activity": (0.0, 1000.0),        # Índice de movimiento o aceleración integrada
}

# Expresión regular para identificadores seguros: alfanuméricos, guiones y guiones bajos (1 a 32 caracteres)
# Seguridad: Bloquea cualquier carácter de escape SQL o inyección de sintaxis (comillas, espacios, etc.)
ASTRONAUT_ID_REGEX = re.compile(r"^[a-zA-Z0-9_-]{1,32}$")


def validate_astronaut_id(astronaut_id: Any) -> Tuple[bool, str]:
    """Valida que el identificador del astronauta cumpla con el estándar de seguridad.

    Args:
        astronaut_id (Any): Identificador proporcionado en la ruta o cuerpo de la petición.

    Returns:
        Tuple[bool, str]: Tupla con bandera de éxito y mensaje descriptivo de error en caso de fallo.

    Example:
        >>> ok, err = validate_astronaut_id("astro-01")
        >>> assert ok is True

    Security Note:
        El uso de ASTRONAUT_ID_REGEX previene que vectores de inyección como
        "astro-01' OR 1=1--" lleguen a los controladores o capas de consulta.
    """
    if not isinstance(astronaut_id, str):
        return False, "El astronaut_id debe ser una cadena de texto."
    if not ASTRONAUT_ID_REGEX.match(astronaut_id):
        return False, "Identificador de astronauta inválido. Debe tener entre 1 y 32 caracteres alfanuméricos, '_' o '-'."
    return True, ""


def sanitize_text(text: str, max_length: int = 500) -> str:
    """Sanitiza campos de texto libre eliminando caracteres de control y escapando entidades HTML.

    Args:
        text (str): Texto sin procesar enviado por el usuario.
        max_length (int): Longitud máxima admitida.

    Returns:
        str: Texto limpio, seguro y escapado contra inyecciones XSS.

    Example:
        >>> sanitize_text("<script>alert('xss')</script>")
        '&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;'

    Security Note:
        Aplica html.escape con quote=True para neutralizar etiquetas de marcado y scripts.
    """
    if not isinstance(text, str):
        return ""
    # Eliminación de caracteres de control no imprimibles excepto saltos de línea y retornos
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    truncated = cleaned[:max_length].strip()
    return html.escape(truncated, quote=True)


def validate_single_reading(reading: Any, now_ts: int | None = None) -> Tuple[bool, str, Dict[str, Any] | None]:
    """Valida un objeto individual de lectura de telemetría.

    Args:
        reading (Any): Diccionario que contiene ts, variable, value y quality.
        now_ts (int | None): Marca temporal de referencia. Si es None se usa time.time().

    Returns:
        Tuple[bool, str, Dict[str, Any] | None]:
            - Booleano indicando validez.
            - Mensaje de error si es inválido.
            - Diccionario normalizado con tipos correctos si es válido.

    Security Note:
        Se aplica tolerancia de reloj de máximo +300 segundos (+5 min) hacia el futuro
        para compensar ligeros desfasajes del reloj de tiempo real del ESP32.
    """
    if not isinstance(reading, dict):
        return False, "La lectura debe ser un objeto JSON (diccionario).", None

    # Verificación de claves requeridas
    # Permite 'value' o 'valor' para compatibilidad con el contrato
    val_key = "value" if "value" in reading else ("valor" if "valor" in reading else None)
    if "ts" not in reading or "variable" not in reading or val_key is None:
        return False, "La lectura requiere los campos 'ts', 'variable' y 'value'.", None

    ts_raw = reading.get("ts")
    variable_raw = reading.get("variable")
    value_raw = reading.get(val_key)
    quality_raw = reading.get("quality", reading.get("calidad", "ok"))

    # 1. Validación de Timestamp
    if not isinstance(ts_raw, (int, float)):
        return False, "El campo 'ts' debe ser un número entero UNIX.", None
    ts = int(ts_raw)
    if ts <= 0:
        return False, "El campo 'ts' debe ser un valor positivo válido.", None

    current_time = int(time.time()) if now_ts is None else now_ts
    if ts > current_time + 300:
        return False, f"El timestamp {ts} excede la tolerancia hacia el futuro (+5 minutos).", None

    # 2. Validación de Variable
    if not isinstance(variable_raw, str):
        return False, "El campo 'variable' debe ser una cadena de texto.", None
    variable = variable_raw.strip().lower()
    if variable not in ALLOWED_VARIABLES:
        return False, f"Variable '{variable}' no permitida. Permitidas: {sorted(ALLOWED_VARIABLES)}", None

    # 3. Validación de Calidad
    if not isinstance(quality_raw, str):
        return False, "El campo 'quality' debe ser una cadena de texto.", None
    quality = quality_raw.strip().lower()
    if quality not in ALLOWED_QUALITIES:
        return False, f"Calidad '{quality}' no permitida. Permitidas: {sorted(ALLOWED_QUALITIES)}", None

    # 4. Validación de Valor Numérico y Rangos Físicos
    if not isinstance(value_raw, (int, float)) or isinstance(value_raw, bool):
        return False, f"El valor para '{variable}' debe ser numérico.", None
    value = float(value_raw)

    min_val, max_val = PHYSICAL_RANGES[variable]
    if not (min_val <= value <= max_val):
        return False, f"El valor {value} para '{variable}' está fuera del rango físico ({min_val} - {max_val}).", None

    return True, "", {
        "ts": ts,
        "variable": variable,
        "value": value,
        "quality": quality,
    }


def validate_readings_batch(payload: Any) -> Tuple[bool, str, str, List[Dict[str, Any]], int]:
    """Valida un lote completo de lecturas para ingesta masiva (POST /api/readings).

    Separa las lecturas válidas de las inválidas para permitir tolerancia a fallos parciales
    según las directivas del sistema (procesar las válidas y reportar inválidas).

    Args:
        payload (Any): Cuerpo decodificado de la solicitud JSON.

    Returns:
        Tuple[bool, str, str, List[Dict[str, Any]], int]:
            - is_valid (bool): True si la estructura general del lote es aceptable.
            - error_message (str): Detalle de error si el lote global es rechazado.
            - astronaut_id (str): Identificador validado del astronauta.
            - valid_readings (List[Dict]): Lista de lecturas sanitizadas y válidas.
            - invalid_count (int): Número de lecturas descartadas por inconsistencia.

    Security Note:
        Rechaza lotes superiores a 500 registros para evitar el agotamiento de memoria
        y bloquear vectores de ataque de denegación de servicio.
    """
    if not isinstance(payload, dict):
        return False, "El payload debe ser un objeto JSON válido.", "", [], 0

    if "astronaut_id" not in payload or "readings" not in payload:
        return False, "El payload debe contener 'astronaut_id' y la lista 'readings'.", "", [], 0

    ast_id = payload.get("astronaut_id")
    ok_ast, ast_err = validate_astronaut_id(ast_id)
    if not ok_ast:
        return False, ast_err, "", [], 0

    readings = payload.get("readings")
    if not isinstance(readings, list):
        return False, "El campo 'readings' debe ser una lista de lecturas.", "", [], 0

    # Límite anti-abuso: máximo 500 lecturas por lote
    if len(readings) > 500:
        return False, f"El lote excede el tamaño máximo permitido de 500 lecturas (recibidas: {len(readings)}).", "", [], 0

    valid_readings: List[Dict[str, Any]] = []
    invalid_count = 0
    now_ts = int(time.time())

    for item in readings:
        ok_read, _, cleaned = validate_single_reading(item, now_ts)
        if ok_read and cleaned is not None:
            valid_readings.append(cleaned)
        else:
            invalid_count += 1

    return True, "", str(ast_id), valid_readings, invalid_count


def validate_note_payload(payload: Any) -> Tuple[bool, str, str, int]:
    """Valida el cuerpo de la petición para registrar una nota médica o de bitácora.

    Args:
        payload (Any): Cuerpo decodificado de la petición JSON.

    Returns:
        Tuple[bool, str, str, int]:
            - is_valid (bool): Bandera de validación.
            - error_message (str): Descripción del error en caso de rechazo.
            - clean_text (str): Texto saneado y escapado.
            - note_ts (int): Marca temporal asignada.

    Security Note:
        Limita estrictamente el tamaño de la nota a 500 caracteres para evitar saturación
        y neutraliza caracteres maliciosos mediante saneamiento anti-XSS.
    """
    if not isinstance(payload, dict):
        return False, "El payload debe ser un objeto JSON.", "", 0

    if "texto" not in payload and "text" not in payload:
        return False, "El cuerpo de la petición debe incluir el campo 'texto'.", "", 0

    raw_text = payload.get("texto", payload.get("text", ""))
    if not isinstance(raw_text, str) or not raw_text.strip():
        return False, "El texto de la nota no puede estar vacío ni contener solo espacios.", "", 0

    if len(raw_text) > 500:
        return False, "El texto de la nota excede la longitud máxima permitida de 500 caracteres.", "", 0

    sanitized = sanitize_text(raw_text, max_length=500)

    # Marca temporal opcional, si no se suministra se toma el tiempo actual del servidor
    now_ts = int(time.time())
    ts_val = payload.get("ts", now_ts)
    if not isinstance(ts_val, (int, float)) or int(ts_val) <= 0:
        ts_val = now_ts
    else:
        ts_val = int(ts_val)

    return True, "", sanitized, ts_val
