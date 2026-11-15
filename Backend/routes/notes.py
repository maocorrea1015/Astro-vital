"""
Módulo de Gestión de Bitácora y Notas del Astronauta para ASTRA HEALTH.

Propósito:
    Provee endpoints para el registro y consulta de observaciones cualitativas,
    síntomas subjetivos y notas de bitácora ingresadas por los tripulantes:
    - POST /api/astronauts/<id>/notes: Creación de notas saneadas con protección XSS.
    - GET /api/astronauts/<id>/notes: Listado cronológico de las notas del astronauta.

Autor: Equipo de Ingeniería de ASTRA HEALTH
Versión: 1.0.0
Dependencias: time, flask, database, security, validators
Advertencias de seguridad:
    - Todo texto ingresado es estrictamente saneado y escapado con html.escape.
    - La longitud máxima está acotada a 500 caracteres para evitar desbordes de memoria.
"""

import time
from typing import Any, Dict
from flask import Blueprint, request, jsonify, Response
from database import get_db
from security import require_api_key, rate_limit
from validators import validate_astronaut_id, validate_note_payload

notes_bp = Blueprint("notes", __name__, url_prefix="/api")


@notes_bp.route("/astronauts/<string:astronaut_id>/notes", methods=["POST"])
@require_api_key
@rate_limit(max_requests=100, window_seconds=60)
def create_astronaut_note(astronaut_id: str) -> Response:
    """Crea una nueva anotación subjetiva o reporte de bitácora para un astronauta.

    Aplica sanitización estricta de caracteres HTML y control para neutralizar
    vectores de Cross-Site Scripting (XSS) y limita la longitud a 500 caracteres.

    Headers:
        X-API-Key (str): Clave de autorización del cliente.
        Content-Type (str): application/json

    Request Body:
        {
            "texto": "Siento leve fatiga muscular tras 2 horas de rutina física.",
            "ts": 1712345678  // Opcional, por defecto tiempo actual del servidor
        }

    Returns:
        Response: JSON con el identificador de la nota creada (código HTTP 201):
            {
                "nota_id": 1
            }

    Errors:
        400 Bad Request: Si el payload no es JSON válido, el texto está vacío o supera 500 caracteres.
        404 Not Found: Si el astronauta no existe en el catálogo de nodos.
    """
    ok_id, err_id = validate_astronaut_id(astronaut_id)
    if not ok_id:
        return jsonify({"error": err_id}), 400

    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "Cuerpo de solicitud inválido o no es JSON"}), 400

    is_valid, err_msg, clean_text, note_ts = validate_note_payload(payload)
    if not is_valid:
        return jsonify({"error": err_msg}), 400

    now_ts = int(time.time())

    with get_db() as db:
        # Validación de existencia del astronauta
        node = db.execute(
            "SELECT astronaut_id FROM nodos WHERE astronaut_id = ?",
            (astronaut_id,),
        ).fetchone()

        if node is None:
            return jsonify({"error": "Astronauta no encontrado"}), 404

        # Inserción parametrizada de la nota saneada
        cursor = db.execute(
            """
            INSERT INTO notas (astronaut_id, ts, texto, creado_en)
            VALUES (?, ?, ?, ?)
            """,
            (astronaut_id, note_ts, clean_text, now_ts),
        )
        nota_id = cursor.lastrowid

    return jsonify({"nota_id": nota_id}), 201


@notes_bp.route("/astronauts/<string:astronaut_id>/notes", methods=["GET"])
@require_api_key
@rate_limit(max_requests=100, window_seconds=60)
def list_astronaut_notes(astronaut_id: str) -> Response:
    """Recupera la lista de notas clínicas y bitácoras asociadas a un astronauta.

    Returns:
        Response: Array JSON de notas ordenadas cronológicamente de forma descendente (código 200).

    Errors:
        400 Bad Request: Si el identificador no cumple las restricciones de seguridad.
        404 Not Found: Si el astronauta no se encuentra en el sistema.
    """
    ok_id, err_id = validate_astronaut_id(astronaut_id)
    if not ok_id:
        return jsonify({"error": err_id}), 400

    with get_db() as db:
        # Validación de existencia del astronauta
        node = db.execute(
            "SELECT astronaut_id FROM nodos WHERE astronaut_id = ?",
            (astronaut_id,),
        ).fetchone()

        if node is None:
            return jsonify({"error": "Astronauta no encontrado"}), 404

        # Consulta de notas del astronauta
        cursor = db.execute(
            """
            SELECT id, astronaut_id, ts, texto, creado_en
            FROM notas
            WHERE astronaut_id = ?
            ORDER BY ts DESC
            """,
            (astronaut_id,),
        )
        notes = [dict(row) for row in cursor.fetchall()]

    return jsonify(notes), 200
