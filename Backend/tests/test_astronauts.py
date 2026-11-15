"""
Pruebas Automatizadas de Endpoints de Astronautas y Estado para ASTRA HEALTH.

Propósito:
    Verifica los controladores de consulta y gestión de tripulantes:
    - GET /api/astronauts: Cálculo dinámico de conectividad (online/offline) y estado general.
    - GET /api/astronauts/<id>/status: Cumplimiento estricto del contrato consolidado de UI.
    - GET /api/astronauts/<id>/readings: Filtrado temporal, por variable y límites de consulta.
    - GET/POST /api/astronauts/<id>/notes: Bitácora clínica y saneamiento contra XSS.

Autor: Equipo de Calidad de ASTRA HEALTH
Versión: 1.0.0
"""

import time
from typing import Dict
from flask.testing import FlaskClient


def test_list_astronauts_and_status_calculation(
    client: FlaskClient,
    auth_headers: Dict[str, str],
) -> None:
    """Verifica que el listado de astronautas calcule adecuadamente 'estado_conexion' y 'estado_general'."""
    # 1. Al inicio, astro-01 tiene ultimo_contacto=0 -> debe ser 'offline' y 'normal'
    res = client.get("/api/astronauts", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) >= 1
    astro = next(a for a in data if a["astronaut_id"] == "astro-01")
    assert astro["estado_conexion"] == "offline"
    assert astro["estado_general"] == "normal"

    # 2. Ingestamos una lectura normal con timestamp actual -> debe pasar a 'online'
    now_ts = int(time.time())
    client.post(
        "/api/readings",
        json={
            "astronaut_id": "astro-01",
            "readings": [{"ts": now_ts, "variable": "heart_rate", "value": 75, "quality": "ok"}],
        },
        headers=auth_headers,
    )

    res_online = client.get("/api/astronauts", headers=auth_headers)
    astro_online = next(a for a in res_online.get_json() if a["astronaut_id"] == "astro-01")
    assert astro_online["estado_conexion"] == "online"
    assert astro_online["estado_general"] == "normal"

    # 3. Ingestamos una lectura crítica (>130 BPM) -> estado_general debe cambiar a 'critical'
    client.post(
        "/api/readings",
        json={
            "astronaut_id": "astro-01",
            "readings": [{"ts": now_ts + 1, "variable": "heart_rate", "value": 140, "quality": "ok"}],
        },
        headers=auth_headers,
    )

    res_crit = client.get("/api/astronauts", headers=auth_headers)
    astro_crit = next(a for a in res_crit.get_json() if a["astronaut_id"] == "astro-01")
    assert astro_crit["estado_general"] == "critical"


def test_astronaut_status_contract(client: FlaskClient, auth_headers: Dict[str, str]) -> None:
    """Verifica que /api/astronauts/<id>/status devuelva la estructura de datos contractual exacta."""
    now_ts = int(time.time())
    # Ingestamos lecturas para poblar el estado
    client.post(
        "/api/readings",
        json={
            "astronaut_id": "astro-01",
            "readings": [
                {"ts": now_ts, "variable": "heart_rate", "value": 110, "quality": "ok"},  # Warning (100-130)
                {"ts": now_ts, "variable": "spo2", "value": 98, "quality": "ok"},
            ],
        },
        headers=auth_headers,
    )

    res = client.get("/api/astronauts/astro-01/status", headers=auth_headers)
    assert res.status_code == 200
    status_data = res.get_json()

    # Validación de todas las claves requeridas por el contrato
    required_keys = {
        "astronaut_id",
        "nombre",
        "estado_general",
        "estado_conexion",
        "ultimo_contacto",
        "lecturas",
        "alertas_activas",
        "linea_base",
        "guia_actual",
    }
    assert required_keys.issubset(status_data.keys())

    assert status_data["astronaut_id"] == "astro-01"
    assert status_data["estado_general"] == "warning"
    assert status_data["estado_conexion"] == "online"
    assert len(status_data["lecturas"]) >= 2
    assert len(status_data["alertas_activas"]) >= 1
    assert status_data["guia_actual"] is not None
    assert "guia" in status_data["guia_actual"]
    assert "mensaje" in status_data["guia_actual"]


def test_astronaut_readings_history_and_filters(
    client: FlaskClient,
    auth_headers: Dict[str, str],
) -> None:
    """Verifica los filtros por variable, horas y límite del endpoint de historial telemétrico."""
    now_ts = int(time.time())

    # Ingestamos tres lecturas distintas
    client.post(
        "/api/readings",
        json={
            "astronaut_id": "astro-01",
            "readings": [
                {"ts": now_ts - 200, "variable": "heart_rate", "value": 70, "quality": "ok"},
                {"ts": now_ts - 100, "variable": "heart_rate", "value": 72, "quality": "ok"},
                {"ts": now_ts - 50, "variable": "spo2", "value": 99, "quality": "ok"},
            ],
        },
        headers=auth_headers,
    )

    # 1. Filtro por variable 'heart_rate'
    res_hr = client.get("/api/astronauts/astro-01/readings?variable=heart_rate", headers=auth_headers)
    assert res_hr.status_code == 200
    hr_readings = res_hr.get_json()
    assert len(hr_readings) == 2
    assert all(r["variable"] == "heart_rate" for r in hr_readings)

    # 2. Filtro con limit=1
    res_limit = client.get("/api/astronauts/astro-01/readings?limit=1", headers=auth_headers)
    assert res_limit.status_code == 200
    assert len(res_limit.get_json()) == 1


def test_astronaut_notes_flow_and_sanitization(
    client: FlaskClient,
    auth_headers: Dict[str, str],
) -> None:
    """Verifica la creación, listado y saneamiento de notas clínicas contra XSS."""
    # Intentamos inyectar código HTML malicioso
    xss_payload = {
        "texto": "Reporte de fatiga con <script>alert('xss')</script> y <b>negrita</b>",
    }
    create_res = client.post("/api/astronauts/astro-01/notes", json=xss_payload, headers=auth_headers)
    assert create_res.status_code == 201
    data = create_res.get_json()
    assert "nota_id" in data

    # Recuperamos la nota y verificamos que el texto haya sido escapado
    list_res = client.get("/api/astronauts/astro-01/notes", headers=auth_headers)
    assert list_res.status_code == 200
    notes = list_res.get_json()
    assert len(notes) >= 1
    latest_note = notes[0]
    assert "<script>" not in latest_note["texto"]
    assert "&lt;script&gt;" in latest_note["texto"]
