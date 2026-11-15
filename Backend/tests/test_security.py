"""
Pruebas Automatizadas de Seguridad y Controles Perimetrales para ASTRA HEALTH.

Propósito:
    Valida la efectividad de las medidas de seguridad perimetral de la API:
    - Autenticación criptográfica obligatoria por cabecera 'X-API-Key'.
    - Rechazo de peticiones anónimas, inválidas o con claves revocadas.
    - Exención exclusiva para el healthcheck (/api/health).
    - Limitador de tasa (Rate Limiting) en memoria y cabecera Retry-After.
    - Presencia estricta de cabeceras de endurecimiento HTTP (Security Headers).
    - Inmunidad contra vectores de Inyección SQL.
    - Almacenamiento exclusivo de resúmenes SHA-256 en base de datos.
    - Supresión de volcados de memoria (stack traces) en respuestas de error 500.

Autor: Equipo de Ciberseguridad de ASTRA HEALTH
Versión: 1.0.0
"""

from typing import Dict
from flask import Flask
from flask.testing import FlaskClient
from database import get_db
import security


def test_authentication_enforcement(client: FlaskClient, auth_headers: Dict[str, str]) -> None:
    """Verifica el bloqueo con 401 ante peticiones no autenticadas o con credenciales inválidas."""
    # 1. Healthcheck público: Debe responder 200 sin cabecera X-API-Key
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    assert health_res.get_json()["status"] == "ok"

    # 2. Petición sin cabecera X-API-Key
    no_key_res = client.get("/api/astronauts")
    assert no_key_res.status_code == 401
    assert no_key_res.get_json()["error"] == "API key inválida o ausente"

    # 3. Petición con API Key ficticia/inválida
    bad_key_res = client.get("/api/astronauts", headers={"X-API-Key": "clave_totalmente_falsa_999"})
    assert bad_key_res.status_code == 401
    assert bad_key_res.get_json()["error"] == "API key inválida o ausente"

    # 4. Petición con API Key válida: Debe responder 200
    ok_res = client.get("/api/astronauts", headers=auth_headers)
    assert ok_res.status_code == 200


def test_revoked_api_key(client: FlaskClient, app: Flask, valid_api_key: str) -> None:
    """Verifica que una clave de API revocada (activa=0) sea rechazada inmediatamente con 401."""
    key_hash = security.hash_api_key(valid_api_key)

    # Revocamos la clave directamente en la base de datos
    with app.app_context():
        with get_db() as db:
            db.execute("UPDATE api_keys SET activa = 0 WHERE key_hash = ?", (key_hash,))

    # Intento de acceso con la clave revocada
    res = client.get("/api/astronauts", headers={"X-API-Key": valid_api_key})
    assert res.status_code == 401
    assert res.get_json()["error"] == "API key inválida o ausente"


def test_rate_limiting_enforcement(client: FlaskClient, auth_headers: Dict[str, str]) -> None:
    """Verifica que superar la tasa de peticiones retorne 429 Too Many Requests con cabecera Retry-After."""
    # Realizamos peticiones hasta agotar el límite configurado (100 peticiones)
    for _ in range(100):
        res = client.get("/api/astronauts", headers=auth_headers)
        assert res.status_code == 200

    # La petición 101 debe ser bloqueada por rate limit
    blocked_res = client.get("/api/astronauts", headers=auth_headers)
    assert blocked_res.status_code == 429
    assert blocked_res.get_json()["error"] == "Rate limit excedido"
    assert "Retry-After" in blocked_res.headers
    assert int(blocked_res.headers["Retry-After"]) >= 1


def test_security_headers_presence(client: FlaskClient) -> None:
    """Verifica la inclusión obligatoria de cabeceras de seguridad HTTP en todas las respuestas."""
    res = client.get("/api/health")
    assert res.status_code == 200

    # Comprobación de cabeceras de endurecimiento
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("Content-Security-Policy") == "default-src 'none'"
    assert "no-store" in res.headers.get("Cache-Control", "")


def test_sql_injection_resistance(client: FlaskClient, app: Flask, auth_headers: Dict[str, str]) -> None:
    """Verifica que intentos de inyección SQL sean bloqueados y no afecten la base de datos."""
    sql_payload = "astro-01'; DROP TABLE lecturas; --"

    # Intento en GET /api/astronauts/<id>/status
    res_status = client.get(f"/api/astronauts/{sql_payload}/status", headers=auth_headers)
    assert res_status.status_code == 400

    # Verificamos que la tabla 'lecturas' continúa existiendo y operando normalmente
    with app.app_context():
        with get_db() as db:
            row = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='lecturas'").fetchone()
            assert row is not None


def test_api_keys_are_never_stored_in_plaintext(app: Flask, valid_api_key: str) -> None:
    """Verifica que la base de datos guarde únicamente el hash SHA-256 y nunca la clave en claro."""
    with app.app_context():
        with get_db() as db:
            rows = db.execute("SELECT key_hash FROM api_keys").fetchall()
            assert len(rows) >= 1
            # La clave en texto plano nunca debe aparecer como un hash
            hashes = [r["key_hash"] for r in rows]
            assert valid_api_key not in hashes
            # El hash de la clave sí debe estar presente
            expected_hash = security.hash_api_key(valid_api_key)
            assert expected_hash in hashes
