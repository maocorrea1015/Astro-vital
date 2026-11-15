"""
Módulo de Ingesta y Procesamiento de Telemetría para ASTRA HEALTH Backend.

Propósito:
    Provee el endpoint de alta frecuencia 'POST /api/readings' encargado de recibir
    lotes de telemetría biomédica y ambiental desde el ESP32 o simulador del traje.
    Garantiza ingesta idempotente, tolerancia a fallos parciales, disparo de alertas
    médicas y actualización estadística de la línea base del astronauta.

Autor: Equipo de Ingeniería de ASTRA HEALTH
Versión: 1.0.0
Dependencias: time, flask, database, security, validators, rules
Advertencias de seguridad:
    - Este endpoint está protegido por autenticación obligatoria y limitación de tasa.
    - Se verifica que el tamaño del lote no exceda las 500 muestras para mitigar DoS.
"""

import time
from typing import Any, Dict, List
from flask import Blueprint, request, jsonify, Response
from database import get_db
from security import require_api_key, rate_limit
from validators import validate_readings_batch
from rules import evaluate_reading_alert, recalculate_baseline

readings_bp = Blueprint("readings", __name__, url_prefix="/api")


@readings_bp.route("/readings", methods=["POST"])
@require_api_key
@rate_limit(max_requests=100, window_seconds=60)
def ingest_readings() -> Response:
    """Recibe, valida e ingesta un lote de lecturas de sensores telemétricos.

    Procesa las muestras válidas, ignora duplicados mediante la restricción UNIQUE,
    evalúa reglas médicas clínicas y recalcula las métricas de línea base de las
    variables afectadas de forma atómica.

    Headers:
        X-API-Key (str): Clave de autorización del cliente (ESP32 o app).
        Content-Type (str): application/json

    Request Body:
        {
            "astronaut_id": "astro-01",
            "readings": [
                {"ts": 1712345678, "variable": "heart_rate", "value": 72, "quality": "ok"},
                {"ts": 1712345678, "variable": "spo2", "value": 98, "quality": "ok"}
            ]
        }

    Returns:
        Response: JSON con resumen del lote procesado (código HTTP 200):
            {
                "recibidas": 2,
                "duplicadas": 0,
                "invalidas": 0,
                "alertas_generadas": 0,
                "status": "ok"
            }

    Errors:
        400 Bad Request: Si la estructura global del payload es inválida o supera 500 registros.
        401 Unauthorized: Si falta la API key o es rechazada.
        429 Too Many Requests: Si se supera el límite de tasa permitido.
        500 Internal Server Error: Si ocurre un fallo crítico de almacenamiento transaccional.

    Security Note:
        Todas las operaciones de inserción y actualización se realizan en una única transacción
        atómica con parámetros vinculados, impidiendo corrupción por lotes a medio escribir.
    """
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "Cuerpo de solicitud inválido o no es JSON"}), 400

    # Validación estructural y tipado del lote completo
    is_valid, error_msg, astronaut_id, valid_readings, invalid_count = validate_readings_batch(payload)
    if not is_valid:
        return jsonify({"error": error_msg}), 400

    total_recibidas = len(valid_readings) + invalid_count
    inserted_count = 0
    alertas_generadas = 0
    now_ts = int(time.time())
    max_reading_ts = 0
    affected_variables = set()

    with get_db() as db:
        # 1. Asegurar la existencia del astronauta en la tabla nodos (auto-creación de seguridad)
        db.execute(
            """
            INSERT OR IGNORE INTO nodos (astronaut_id, nombre, estado_conexion, ultimo_contacto)
            VALUES (?, ?, 'online', ?)
            """,
            (astronaut_id, f"Astronauta {astronaut_id}", now_ts),
        )

        # 2. Cargar líneas base actuales del astronauta para evaluación eficiente en memoria
        cursor = db.execute(
            "SELECT variable, promedio, desviacion, muestras FROM linea_base WHERE astronaut_id = ?",
            (astronaut_id,),
        )
        baselines = {row["variable"]: dict(row) for row in cursor.fetchall()}

        # 3. Procesamiento de lecturas individuales válidas
        for reading in valid_readings:
            ts = reading["ts"]
            variable = reading["variable"]
            value = reading["value"]
            quality = reading["quality"]

            if ts > max_reading_ts:
                max_reading_ts = ts

            # Ingesta idempotente: INSERT OR IGNORE previene duplicados sin arrojar excepción
            cursor_insert = db.execute(
                """
                INSERT OR IGNORE INTO lecturas (astronaut_id, ts, variable, valor, calidad, creado_en)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (astronaut_id, ts, variable, value, quality, now_ts),
            )

            # Si rowcount > 0, la lectura es nueva y no estaba duplicada
            if cursor_insert.rowcount > 0:
                inserted_count += 1

                # 4. Evaluación de reglas clínicas si el transductor no reporta fallo de hardware
                if quality != "sensor_fault":
                    var_baseline = baselines.get(variable)
                    alert = evaluate_reading_alert(astronaut_id, reading, var_baseline)
                    if alert is not None:
                        db.execute(
                            """
                            INSERT INTO alertas (astronaut_id, ts, variable, valor, severidad, mensaje, guia, reconocida, creado_en)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
                            """,
                            (
                                alert["astronaut_id"],
                                alert["ts"],
                                alert["variable"],
                                alert["valor"],
                                alert["severidad"],
                                alert["mensaje"],
                                alert["guia"],
                                now_ts,
                            ),
                        )
                        alertas_generadas += 1

                    # Marcamos la variable para recalcular estadísticas tras persistir
                    affected_variables.add(variable)

        # 5. Recalcular línea base para las variables con nuevas muestras válidas
        for var_name in affected_variables:
            recalculate_baseline(db, astronaut_id, var_name)

        # 6. Actualizar latido de conectividad del nodo/traje
        contact_ts = max(now_ts, max_reading_ts) if max_reading_ts > 0 else now_ts
        db.execute(
            """
            UPDATE nodos 
            SET ultimo_contacto = ?, estado_conexion = 'online' 
            WHERE astronaut_id = ?
            """,
            (contact_ts, astronaut_id),
        )

    duplicadas = len(valid_readings) - inserted_count

    return jsonify({
        "recibidas": total_recibidas,
        "duplicadas": duplicadas,
        "invalidas": invalid_count,
        "alertas_generadas": alertas_generadas,
        "status": "ok",
    }), 200
