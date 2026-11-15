"""
Módulo de Gestión de Estado y Telemetría de Astronautas para ASTRA HEALTH.

Propósito:
    Expone los endpoints de consulta de tripulantes:
    - GET /api/astronauts: Listado general con estado de conectividad e índice clínico.
    - GET /api/astronauts/<id>/status: Endpoint consolidado principal consumido por la app en Raspberry Pi.
    - GET /api/astronauts/<id>/readings: Historial telemétrico filtrable por variable, horas y límite.

Autor: Equipo de Ingeniería de ASTRA HEALTH
Versión: 1.0.0
Dependencias: time, flask, database, security, validators
Advertencias de seguridad:
    - Todas las consultas SQL emplean sentencias parametrizadas.
    - Se valida el formato de 'astronaut_id' contra expresiones regulares para neutralizar inyecciones.
"""

import time
from typing import Any, Dict, List
from flask import Blueprint, request, jsonify, current_app, Response
from database import get_db
from security import require_api_key, rate_limit
from validators import validate_astronaut_id, ALLOWED_VARIABLES

astronauts_bp = Blueprint("astronauts", __name__, url_prefix="/api")


def _calculate_node_status(last_contact: int, timeout_seconds: int) -> str:
    """Determina si un nodo de traje espacial se encuentra 'online' u 'offline'.

    Args:
        last_contact (int): Marca de tiempo UNIX del último paquete recibido.
        timeout_seconds (int): Tolerancia máxima en segundos antes de asumir desconexión.

    Returns:
        str: 'online' si la diferencia es menor o igual al umbral; 'offline' en caso contrario.
    """
    now = int(time.time())
    if last_contact > 0 and (now - last_contact) <= timeout_seconds:
        return "online"
    return "offline"


def _calculate_general_status(unacknowledged_alerts: List[Dict[str, Any]]) -> str:
    """Calcula el estado clínico general consolidado a partir de alertas no reconocidas.

    Reglas:
        - 'critical': Si existe al menos una alerta con severidad 'critical'.
        - 'warning': Si existe al menos una alerta con severidad 'warning' y ninguna critical.
        - 'normal': Si no existen alertas activas sin reconocer.

    Args:
        unacknowledged_alerts (List[Dict[str, Any]]): Alertas activas pendientes de atención.

    Returns:
        str: 'critical', 'warning' o 'normal'.
    """
    has_warning = False
    for alert in unacknowledged_alerts:
        sev = alert.get("severidad", "").lower()
        if sev == "critical":
            return "critical"
        elif sev == "warning":
            has_warning = True

    return "warning" if has_warning else "normal"


@astronauts_bp.route("/astronauts", methods=["GET"])
@require_api_key
@rate_limit(max_requests=100, window_seconds=60)
def list_astronauts() -> Response:
    """Lista todos los astronautas y nodos biomédicos registrados con estado en tiempo real.

    Calcula dinámicamente 'estado_conexion' en función del umbral de tiempo y
    'estado_general' de acuerdo a las alertas médicas pendientes.

    Returns:
        Response: Lista JSON de astronautas (código HTTP 200):
            [
                {
                    "astronaut_id": "astro-01",
                    "nombre": "Astronauta Demo",
                    "estado_general": "normal",
                    "estado_conexion": "offline",
                    "ultimo_contacto": 1712345700
                }
            ]
    """
    timeout = current_app.config.get("ASTRONAUT_TIMEOUT_SECONDS", 60)

    with get_db() as db:
        nodes = db.execute(
            "SELECT astronaut_id, nombre, ultimo_contacto FROM nodos ORDER BY astronaut_id ASC"
        ).fetchall()

        result = []
        for node in nodes:
            ast_id = node["astronaut_id"]
            # Consulta de alertas activas pendientes para calcular estado clínico general
            alerts_cursor = db.execute(
                "SELECT severidad FROM alertas WHERE astronaut_id = ? AND reconocida = 0",
                (ast_id,),
            )
            active_alerts = [dict(r) for r in alerts_cursor.fetchall()]

            estado_conexion = _calculate_node_status(node["ultimo_contacto"], timeout)
            estado_general = _calculate_general_status(active_alerts)

            result.append({
                "astronaut_id": ast_id,
                "nombre": node["nombre"],
                "estado_general": estado_general,
                "estado_conexion": estado_conexion,
                "ultimo_contacto": node["ultimo_contacto"],
            })

    return jsonify(result), 200


@astronauts_bp.route("/astronauts/<string:astronaut_id>/status", methods=["GET"])
@require_api_key
@rate_limit(max_requests=100, window_seconds=60)
def get_astronaut_status(astronaut_id: str) -> Response:
    """Endpoint principal de la aplicación en Raspberry Pi para desplegar el estado consolidado.

    Reúne la última lectura conocida de cada variable, las alertas activas pendientes,
    la línea base estadística y la guía médica prioritaria de actuación.

    Args:
        astronaut_id (str): Identificador seguro del astronauta.

    Returns:
        Response: JSON con el contrato consolidado exacto (código HTTP 200).

    Errors:
        400 Bad Request: Si el identificador no cumple con el formato alfanumérico seguro.
        404 Not Found: Si el astronauta no se encuentra en el catálogo de nodos.
    """
    ok_id, err_id = validate_astronaut_id(astronaut_id)
    if not ok_id:
        return jsonify({"error": err_id}), 400

    timeout = current_app.config.get("ASTRONAUT_TIMEOUT_SECONDS", 60)

    with get_db() as db:
        # 1. Verificación de existencia del tripulante
        node = db.execute(
            "SELECT astronaut_id, nombre, ultimo_contacto FROM nodos WHERE astronaut_id = ?",
            (astronaut_id,),
        ).fetchone()

        if node is None:
            return jsonify({"error": "Astronauta no encontrado"}), 404

        # 2. Obtención de la última lectura telemétrica para cada variable registrada
        # Subconsulta SQL parametrizada y optimizada mediante índice idx_lecturas_ast_var_ts
        readings_rows = db.execute(
            """
            SELECT l.variable, l.valor, l.ts, l.calidad
            FROM lecturas l
            INNER JOIN (
                SELECT variable, MAX(ts) as max_ts
                FROM lecturas
                WHERE astronaut_id = ?
                GROUP BY variable
            ) latest ON l.variable = latest.variable AND l.ts = latest.max_ts
            WHERE l.astronaut_id = ?
            ORDER BY l.variable ASC
            """,
            (astronaut_id, astronaut_id),
        ).fetchall()

        lecturas_list = [
            {
                "variable": r["variable"],
                "valor": r["valor"],
                "ts": r["ts"],
                "calidad": r["calidad"],
            }
            for r in readings_rows
        ]

        # 3. Obtención de alertas activas (sin reconocer)
        alerts_rows = db.execute(
            """
            SELECT id, ts, variable, valor, severidad, mensaje, guia
            FROM alertas
            WHERE astronaut_id = ? AND reconocida = 0
            ORDER BY ts DESC
            """,
            (astronaut_id,),
        ).fetchall()

        alertas_activas = [dict(r) for r in alerts_rows]

        # 4. Obtención de la línea base histórica del astronauta
        baseline_rows = db.execute(
            """
            SELECT variable, promedio, desviacion, muestras
            FROM linea_base
            WHERE astronaut_id = ?
            ORDER BY variable ASC
            """,
            (astronaut_id,),
        ).fetchall()

        linea_base_list = [
            {
                "variable": b["variable"],
                "promedio": b["promedio"],
                "desviacion": b["desviacion"],
                "muestras": b["muestras"],
            }
            for b in baseline_rows
        ]

        # 5. Cálculo de estados dinámicos
        estado_conexion = _calculate_node_status(node["ultimo_contacto"], timeout)
        estado_general = _calculate_general_status(alertas_activas)

        # 6. Determinación de la guía médica de actuación actual
        # Prioridad: critical > warning > info; ante igual severidad, la más reciente
        guia_actual = None
        if alertas_activas:
            # Orden de prioridad clínica para seleccionar la guía predominante
            priority_order = {"critical": 3, "warning": 2, "info": 1}
            sorted_alerts = sorted(
                alertas_activas,
                key=lambda a: (priority_order.get(a["severidad"], 0), a["ts"]),
                reverse=True,
            )
            top_alert = sorted_alerts[0]
            guia_actual = {
                "mensaje": top_alert["mensaje"],
                "guia": top_alert["guia"],
            }

        response_payload = {
            "astronaut_id": node["astronaut_id"],
            "nombre": node["nombre"],
            "estado_general": estado_general,
            "estado_conexion": estado_conexion,
            "ultimo_contacto": node["ultimo_contacto"],
            "lecturas": lecturas_list,
            "alertas_activas": alertas_activas,
            "linea_base": linea_base_list,
            "guia_actual": guia_actual,
        }

    return jsonify(response_payload), 200


@astronauts_bp.route("/astronauts/<string:astronaut_id>/readings", methods=["GET"])
@require_api_key
@rate_limit(max_requests=100, window_seconds=60)
def get_astronaut_readings(astronaut_id: str) -> Response:
    """Recupera el historial de lecturas de telemetría de un astronauta con filtros opcionales.

    Parámetros de consulta (Query Params):
        variable (str, opcional): Filtrar por variable (ej. 'heart_rate').
        hours (int/float, opcional): Horas hacia atrás a consultar (predeterminado: 24, máx: 720).
        limit (int, opcional): Cantidad máxima de registros (predeterminado: 100, máx: 1000).

    Returns:
        Response: Lista cronológica inversa de lecturas telemétricas (código HTTP 200).
    """
    ok_id, err_id = validate_astronaut_id(astronaut_id)
    if not ok_id:
        return jsonify({"error": err_id}), 400

    # Validación y saneamiento de parámetros de consulta
    var_filter = request.args.get("variable", type=str)
    if var_filter:
        var_filter = var_filter.strip().lower()
        if var_filter not in ALLOWED_VARIABLES:
            return jsonify({"error": f"Variable desconocida '{var_filter}'"}), 400

    hours = request.args.get("hours", default=24, type=float)
    if hours is None or hours <= 0:
        hours = 24.0
    if hours > 720.0:  # Límite de 30 días para evitar lecturas masivas de memoria
        hours = 720.0

    limit = request.args.get("limit", default=100, type=int)
    if limit is None or limit <= 0:
        limit = 100
    if limit > 1000:
        limit = 1000

    now_ts = int(time.time())
    since_ts = int(now_ts - (hours * 3600))

    with get_db() as db:
        # Validación de existencia del nodo
        node = db.execute(
            "SELECT astronaut_id FROM nodos WHERE astronaut_id = ?",
            (astronaut_id,),
        ).fetchone()
        if node is None:
            return jsonify({"error": "Astronauta no encontrado"}), 404

        # Construcción parametrizada segura de la consulta
        if var_filter:
            query = """
                SELECT id, astronaut_id, ts, variable, valor, calidad
                FROM lecturas
                WHERE astronaut_id = ? AND ts >= ? AND variable = ?
                ORDER BY ts DESC
                LIMIT ?
            """
            params = (astronaut_id, since_ts, var_filter, limit)
        else:
            query = """
                SELECT id, astronaut_id, ts, variable, valor, calidad
                FROM lecturas
                WHERE astronaut_id = ? AND ts >= ?
                ORDER BY ts DESC
                LIMIT ?
            """
            params = (astronaut_id, since_ts, limit)

        cursor = db.execute(query, params)
        rows = cursor.fetchall()
        readings = [dict(r) for r in rows]

    return jsonify(readings), 200
