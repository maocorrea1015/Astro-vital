"""
Pruebas Automatizadas de Ingesta de Telemetría para ASTRA HEALTH.

Propósito:
    Verifica los requisitos funcionales del endpoint POST /api/readings:
    - Ingesta idempotente con protección contra lecturas duplicadas.
    - Validación rigurosa de tipos, límites físicos y variables permitidas.
    - Rechazo de marcas temporales futuras no toleradas.
    - Tolerancia a fallos: ingesta de lecturas válidas ante lotes con datos corruptos.
    - Tratamiento de sensores averiados ('sensor_fault') sin disparar alertas erróneas.

Autor: Equipo de Calidad de ASTRA HEALTH
Versión: 1.0.0
"""

import time
from typing import Dict
from flask.testing import FlaskClient


def test_ingestion_idempotence(client: FlaskClient, auth_headers: Dict[str, str]) -> None:
    """Verifica que el reenvío idéntico de un lote no genere duplicados en la base de datos."""
    now_ts = int(time.time()) - 10
    payload = {
        "astronaut_id": "astro-01",
        "readings": [
            {"ts": now_ts, "variable": "heart_rate", "value": 75, "quality": "ok"},
            {"ts": now_ts, "variable": "spo2", "value": 98, "quality": "ok"},
        ],
    }

    # Primer envío: ambas lecturas deben insertarse
    res1 = client.post("/api/readings", json=payload, headers=auth_headers)
    assert res1.status_code == 200
    data1 = res1.get_json()
    assert data1["recibidas"] == 2
    assert data1["duplicadas"] == 0
    assert data1["invalidas"] == 0
    assert data1["status"] == "ok"

    # Segundo envío (idéntico): deben detectarse como duplicadas (0 insertadas)
    res2 = client.post("/api/readings", json=payload, headers=auth_headers)
    assert res2.status_code == 200
    data2 = res2.get_json()
    assert data2["recibidas"] == 2
    assert data2["duplicadas"] == 2
    assert data2["status"] == "ok"


def test_ingestion_payload_validation_errors(client: FlaskClient, auth_headers: Dict[str, str]) -> None:
    """Verifica el rechazo con 400 Bad Request ante cargas útiles estructuralmente malformadas."""
    # 1. Payload vacío o no JSON
    res_empty = client.post("/api/readings", data="no_json", headers={"X-API-Key": auth_headers["X-API-Key"]})
    assert res_empty.status_code == 400

    # 2. Falta astronaut_id
    res_no_ast = client.post("/api/readings", json={"readings": []}, headers=auth_headers)
    assert res_no_ast.status_code == 400

    # 3. astronaut_id con caracteres ilegales (inyección SQL)
    res_bad_ast = client.post(
        "/api/readings",
        json={"astronaut_id": "astro-01'; DROP TABLE lecturas; --", "readings": []},
        headers=auth_headers,
    )
    assert res_bad_ast.status_code == 400

    # 4. Lote que supera el límite de 500 muestras
    large_batch = [
        {"ts": 1700000000 + i, "variable": "heart_rate", "value": 70, "quality": "ok"}
        for i in range(501)
    ]
    res_large = client.post(
        "/api/readings",
        json={"astronaut_id": "astro-01", "readings": large_batch},
        headers=auth_headers,
    )
    assert res_large.status_code == 400
    assert "excede el tamaño máximo" in res_large.get_json()["error"]


def test_mixed_batch_fault_tolerance(client: FlaskClient, auth_headers: Dict[str, str]) -> None:
    """Verifica que lecturas válidas sean procesadas aun cuando se reciban mezcladas con inválidas."""
    now_ts = int(time.time()) - 20
    future_ts = now_ts + 3600  # +1 hora en el futuro (excede +5 minutos permitidos)

    payload = {
        "astronaut_id": "astro-01",
        "readings": [
            # Válida 1
            {"ts": now_ts, "variable": "heart_rate", "value": 72, "quality": "ok"},
            # Inválida 1: variable no permitida
            {"ts": now_ts, "variable": "brain_activity", "value": 50, "quality": "ok"},
            # Inválida 2: valor fuera de rango físico (spo2 > 100)
            {"ts": now_ts, "variable": "spo2", "value": 150, "quality": "ok"},
            # Inválida 3: timestamp en el futuro
            {"ts": future_ts, "variable": "temperature", "value": 36.6, "quality": "ok"},
            # Válida 2
            {"ts": now_ts, "variable": "temperature", "value": 36.8, "quality": "ok"},
        ],
    }

    res = client.post("/api/readings", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["recibidas"] == 5
    assert data["invalidas"] == 3
    assert data["duplicadas"] == 0
    assert data["status"] == "ok"


def test_sensor_fault_handling(client: FlaskClient, auth_headers: Dict[str, str]) -> None:
    """Verifica que una lectura de un sensor con 'sensor_fault' se registre pero NO dispare alertas."""
    now_ts = int(time.time()) - 5
    # Valor que normalmente sería crítico (>130 BPM), pero el sensor reporta avería
    payload = {
        "astronaut_id": "astro-01",
        "readings": [
            {"ts": now_ts, "variable": "heart_rate", "value": 180, "quality": "sensor_fault"},
        ],
    }

    res = client.post("/api/readings", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["recibidas"] == 1
    assert data["alertas_generadas"] == 0

    # Comprobación de que no se crearon alertas en el endpoint de alertas
    alerts_res = client.get("/api/astronauts/astro-01/alerts", headers=auth_headers)
    assert alerts_res.status_code == 200
    assert len(alerts_res.get_json()) == 0
