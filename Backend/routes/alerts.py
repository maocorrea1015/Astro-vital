"""
Módulo de Gestión y Reconocimiento de Alertas Médicas para ASTRA HEALTH.

Propósito:
    Gestiona el ciclo de vida de las alertas clínicas y de soporte vital:
    - GET /api/astronauts/<id>/alerts: Histórico de alertas médicas y contingencias.
    - POST /api/alerts/<id>/acknowledge: Marcado de alerta como atendida/reconocida
      por parte del astronauta o del equipo de control de vuelo.

Autor: Equipo de Ingeniería de ASTRA HEALTH
Versión: 1.0.0
Dependencias: time, flask, database, security, validators
Advertencias de seguridad:
    - Todas las transacciones SQL están debidamente parametrizadas.
    - El marcado de reconocimientos audita la marca de tiempo exacta del acuse de recibo.
"""

import time
from typing import Any, Dict
from flask import Blueprint, request, jsonify, Response
from database import get_db
from security import require_api_key, rate_limit
from validators import validate_astronaut_id

alerts_bp = Blueprint("alerts", __name__, url_prefix="/api")


@alerts_bp.route("/astronauts/<string:astronaut_id>/alerts", methods=["GET"])
@require_api_key
@rate_limit(max_requests=100, window_seconds=60)
def get_astronaut_alerts(astronaut_id: str) -> Response:
    """Obtiene el historial de alertas emitidas para un astronauta determinado.

    Parámetros de consulta (Query Params):
        reconocida (int, opcional): Filtrar por 0 (activas/pendientes) o 1 (reconocidas).
        limit (int, opcional): Límite de resultados (predeterminado: 50, máx: 500).

    Returns:
        Response: Array JSON de alertas ordenadas cronológicamente de forma descendente (código 200).

    Errors:
        400 Bad Request: Si el identificador del astronauta no cumple el patrón de seguridad.
        404 Not Found: Si el astronauta no existe en la base de datos.
    """
    ok_id, err_id = validate_astronaut_id(astronaut_id)
    if not ok_id:
        return jsonify({"error": err_id}), 400

    reconocida = request.args.get("reconocida", type=int)
    limit = request.args.get("limit", default=50, type=int)
    if limit is None or limit <= 0:
        limit = 50
    if limit > 500:
        limit = 500

    with get_db() as db:
        # Validación de existencia del tripulante
        node = db.execute(
            "SELECT astronaut_id FROM nodos WHERE astronaut_id = ?",
            (astronaut_id,),
        ).fetchone()
        if node is None:
            return jsonify({"error": "Astronauta no encontrado"}), 404

        # Construcción segura de la consulta SQL
        if reconocida in (0, 1):
            query = """
                SELECT id, astronaut_id, ts, variable, valor, severidad, mensaje, guia, reconocida, reconocida_en, creado_en
                FROM alertas
                WHERE astronaut_id = ? AND reconocida = ?
                ORDER BY ts DESC
                LIMIT ?
            """
            params = (astronaut_id, reconocida, limit)
        else:
            query = """
                SELECT id, astronaut_id, ts, variable, valor, severidad, mensaje, guia, reconocida, reconocida_en, creado_en
                FROM alertas
                WHERE astronaut_id = ?
                ORDER BY ts DESC
                LIMIT ?
            """
            params = (astronaut_id, limit)

        cursor = db.execute(query, params)
        alerts = [dict(row) for row in cursor.fetchall()]

    return jsonify(alerts), 200


@alerts_bp.route("/alerts/<int:alert_id>/acknowledge", methods=["POST"])
@require_api_key
@rate_limit(max_requests=100, window_seconds=60)
def acknowledge_alert(alert_id: int) -> Response:
    """Marca una alerta activa como atendida o reconocida por el usuario o personal médico.

    Actualiza el campo 'reconocida' a 1 y registra la marca temporal UNIX del reconocimiento.

    Args:
        alert_id (int): Identificador numérico único de la alerta.

    Returns:
        Response: JSON con confirmación {"status": "ok"} (código HTTP 200).

    Errors:
        404 Not Found: Si la alerta especificada no existe en el sistema.
    """
    now_ts = int(time.time())

    with get_db() as db:
        # Verificación de existencia previa de la alerta
        row = db.execute(
            "SELECT id, reconocida FROM alertas WHERE id = ?",
            (alert_id,),
        ).fetchone()

        if row is None:
            return jsonify({"error": "Alerta no encontrada"}), 404

        # Actualización idempotente: si ya estaba reconocida, preserva integridad
        db.execute(
            """
            UPDATE alertas
            SET reconocida = 1,
                reconocida_en = COALESCE(reconocida_en, ?)
            WHERE id = ?
            """,
            (now_ts, alert_id),
        )

    return jsonify({"status": "ok"}), 200
