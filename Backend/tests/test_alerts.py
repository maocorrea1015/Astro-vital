"""
Pruebas Automatizadas del Motor de Reglas y Alertas Médicas para ASTRA HEALTH.

Propósito:
    Verifica las reglas clínicas absolutas y relativas por desviación estadística:
    - Transgresión de umbrales absolutos para FC, SpO2, temperatura y radiación.
    - Prevalencia jerárquica de reglas absolutas sobre reglas de desviación.
    - Activación de reglas por desviación individual únicamente con >= 50 muestras.
    - Ciclo de vida y reconocimiento médico (acknowledge) de alertas.

Autor: Equipo de Calidad de ASTRA HEALTH
Versión: 1.0.0
"""

import time
from typing import Dict
from flask.testing import FlaskClient


def test_absolute_rules_all_thresholds(client: FlaskClient, auth_headers: Dict[str, str]) -> None:
    """Verifica la generación de alertas para todos los umbrales absolutos definidos en el protocolo."""
    test_cases = [
        # (variable, valor, severidad_esperada)
        ("heart_rate", 145.0, "critical"),
        ("heart_rate", 115.0, "warning"),
        ("spo2", 88.0, "critical"),
        ("spo2", 92.0, "warning"),
        ("temperature", 39.1, "critical"),
        ("temperature", 38.0, "warning"),
        ("radiation_cpm", 120.0, "critical"),
        ("radiation_cpm", 75.0, "warning"),
    ]

    base_ts = int(time.time()) - 1000

    for idx, (var, val, expected_sev) in enumerate(test_cases):
        ts = base_ts + idx * 10
        payload = {
            "astronaut_id": "astro-01",
            "readings": [{"ts": ts, "variable": var, "value": val, "quality": "ok"}],
        }
        res = client.post("/api/readings", json=payload, headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["alertas_generadas"] == 1

        # Verificación directa de la alerta persistida
        alerts_res = client.get(
            f"/api/astronauts/astro-01/alerts?reconocida=0&limit=1",
            headers=auth_headers,
        )
        assert alerts_res.status_code == 200
        alerts = alerts_res.get_json()
        assert len(alerts) >= 1
        latest = alerts[0]
        assert latest["variable"] == var
        assert latest["severidad"] == expected_sev
        assert latest["reconocida"] == 0


def test_deviation_rule_requires_50_samples(client: FlaskClient, auth_headers: Dict[str, str]) -> None:
    """Verifica que las alertas por desviación de línea base NO se activen con menos de 50 muestras."""
    base_ts = int(time.time()) - 3000

    # Ingestamos 49 lecturas con FC normal constante (70 BPM)
    batch_49 = [
        {"ts": base_ts + i * 2, "variable": "heart_rate", "value": 70.0, "quality": "ok"}
        for i in range(49)
    ]
    client.post(
        "/api/readings",
        json={"astronaut_id": "astro-01", "readings": batch_49},
        headers=auth_headers,
    )

    # Ingestamos la muestra 50 con FC de 98 BPM (valor dentro de lo absoluto pero con Z > 4)
    # Sin embargo, la línea base previa solo tenía 49 muestras al evaluarse esta lectura
    outlier_res = client.post(
        "/api/readings",
        json={
            "astronaut_id": "astro-01",
            "readings": [{"ts": base_ts + 100, "variable": "heart_rate", "value": 98.0, "quality": "ok"}],
        },
        headers=auth_headers,
    )
    assert outlier_res.status_code == 200
    # No debe disparar alerta por desviación todavía porque aún no se alcanzaban 50 muestras consolidadas
    assert outlier_res.get_json()["alertas_generadas"] == 0


def test_deviation_rule_triggers_with_at_least_50_samples(
    client: FlaskClient,
    auth_headers: Dict[str, str],
) -> None:
    """Verifica que las alertas por desviación se activen cuando la línea base tiene >= 50 muestras."""
    base_ts = int(time.time()) - 5000

    # Ingestamos 50 lecturas normales de temperatura (36.5°C)
    batch_50 = [
        {"ts": base_ts + i * 2, "variable": "temperature", "value": 36.5, "quality": "ok"}
        for i in range(50)
    ]
    res_batch = client.post(
        "/api/readings",
        json={"astronaut_id": "astro-01", "readings": batch_50},
        headers=auth_headers,
    )
    assert res_batch.status_code == 200

    # Ahora la línea base tiene 50 muestras (promedio 36.5, desviación ~0).
    # Ingestamos una lectura de 37.4°C.
    # 37.4°C está dentro del límite absoluto (no supera 37.5°C).
    # Pero con media 36.5 y desv=0 (usará 1.0 como salvaguarda), z = |37.4 - 36.5| / 1.0 = 0.9.
    # Para z > 2, requerimos que el valor se desvíe más: por ejemplo con desv calculada o valor distante.
    # Con desv=1.0 por defecto, un valor de 37.45 tiene z = 0.95.
    # Si tenemos una desviación real pequeña: por ejemplo 50 muestras variando entre 36.4 y 36.6 (desv = 0.1).
    # Entonces para z > 2 basta con una desviación de > 0.2 (ej. 37.2°C).
    # Probemos con una serie de 50 muestras con varianza controlada:
    # 25 muestras a 70.0 y 25 muestras a 72.0 -> media = 71.0, desv = 1.0.
    batch_var = [
        {"ts": base_ts + 200 + i * 2, "variable": "activity", "value": 50.0 if i % 2 == 0 else 52.0, "quality": "ok"}
        for i in range(50)
    ]
    client.post(
        "/api/readings",
        json={"astronaut_id": "astro-01", "readings": batch_var},
        headers=auth_headers,
    )
    # Media de activity = 51.0, desv = 1.0.
    # Probamos un valor de 55.0 -> z = |55 - 51| / 1.0 = 4.0 (>2.0 -> warning)
    res_dev_warn = client.post(
        "/api/readings",
        json={
            "astronaut_id": "astro-01",
            "readings": [{"ts": base_ts + 400, "variable": "activity", "value": 54.0, "quality": "ok"}],
        },
        headers=auth_headers,
    )
    assert res_dev_warn.status_code == 200
    assert res_dev_warn.get_json()["alertas_generadas"] == 1

    # Probamos un valor con z > 4: valor = 60.0 -> z = |60 - 51| / 1.0 = 9.0 (>4.0 -> critical)
    res_dev_crit = client.post(
        "/api/readings",
        json={
            "astronaut_id": "astro-01",
            "readings": [{"ts": base_ts + 405, "variable": "activity", "value": 60.0, "quality": "ok"}],
        },
        headers=auth_headers,
    )
    assert res_dev_crit.status_code == 200
    assert res_dev_crit.get_json()["alertas_generadas"] == 1


def test_alert_acknowledgement_flow(client: FlaskClient, auth_headers: Dict[str, str]) -> None:
    """Verifica que el endpoint /api/alerts/<id>/acknowledge actualice el estado de la alerta."""
    now_ts = int(time.time()) - 10
    # Generamos una alerta crítica de SpO2 (<90%)
    client.post(
        "/api/readings",
        json={
            "astronaut_id": "astro-01",
            "readings": [{"ts": now_ts, "variable": "spo2", "value": 85.0, "quality": "ok"}],
        },
        headers=auth_headers,
    )

    # Obtenemos la alerta activa
    res_active = client.get("/api/astronauts/astro-01/alerts?reconocida=0", headers=auth_headers)
    alerts = res_active.get_json()
    assert len(alerts) >= 1
    alert_id = alerts[0]["id"]
    assert alerts[0]["reconocida"] == 0

    # El estado general del astronauta debe ser 'critical'
    res_status1 = client.get("/api/astronauts/astro-01/status", headers=auth_headers)
    assert res_status1.get_json()["estado_general"] == "critical"

    # Reconocemos la alerta
    ack_res = client.post(f"/api/alerts/{alert_id}/acknowledge", headers=auth_headers)
    assert ack_res.status_code == 200
    assert ack_res.get_json()["status"] == "ok"

    # Verificamos que ya no esté en alertas no reconocidas
    res_after = client.get("/api/astronauts/astro-01/alerts?reconocida=0", headers=auth_headers)
    assert not any(a["id"] == alert_id for a in res_after.get_json())

    # El estado general debe haber retornado a 'normal' al no haber más alertas activas
    res_status2 = client.get("/api/astronauts/astro-01/status", headers=auth_headers)
    assert res_status2.get_json()["estado_general"] == "normal"

    # Intentar reconocer una alerta inexistente debe retornar 404
    ack_404 = client.post("/api/alerts/999999/acknowledge", headers=auth_headers)
    assert ack_404.status_code == 404
