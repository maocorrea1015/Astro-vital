"""
Fixtures y Configuración Compartida de Pruebas Automatizadas con Pytest.

Propósito:
    Provee fixtures reutilizables para pruebas de integración y seguridad:
    - Instancia de aplicación Flask en entorno de pruebas ('testing').
    - Base de datos temporal aislada por función de prueba con esquema completo.
    - Generación y emisión automática de API Keys de prueba autorizadas.
    - Cliente de pruebas HTTP (test_client).

Autor: Equipo de Calidad y Pruebas de ASTRA HEALTH
Versión: 1.0.0
"""

import os
import tempfile
from pathlib import Path
from typing import Generator, Dict, Any
import pytest
from flask import Flask
from flask.testing import FlaskClient

from app import create_app
from database import init_db
from generate_api_key import generate_and_save_api_key
import security


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Limpia el almacenamiento en memoria del rate limiter antes de cada test."""
    with security._rate_limit_lock:
        security._rate_limit_store.clear()
    yield
    with security._rate_limit_lock:
        security._rate_limit_store.clear()


@pytest.fixture
def test_db_path() -> Generator[str, None, None]:
    """Crea un archivo temporal de base de datos SQLite aislado para la prueba.

    Garantiza que las transacciones y el modo WAL operen de forma idéntica
    al entorno de producción, eliminando el archivo al concluir el test.
    """
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    try:
        init_db(db_path=path)
        yield path
    finally:
        for ext in ["", "-wal", "-shm"]:
            p = Path(path + ext)
            if p.exists():
                try:
                    p.unlink()
                except OSError:
                    pass


@pytest.fixture
def app(test_db_path: str) -> Flask:
    """Instancia la aplicación Flask configurada con la base de datos temporal."""
    app_instance = create_app(
        config_name="testing",
        config_override={
            "DATABASE_PATH": test_db_path,
            "RATE_LIMIT_MAX_REQUESTS": 100,
            "RATE_LIMIT_WINDOW_SECONDS": 60,
            "ASTRONAUT_TIMEOUT_SECONDS": 60,
        },
    )
    return app_instance


@pytest.fixture
def client(app: Flask) -> FlaskClient:
    """Provee el cliente de pruebas HTTP de Flask."""
    return app.test_client()


@pytest.fixture
def valid_api_key(test_db_path: str) -> str:
    """Genera y persiste una API Key válida para el cliente de prueba."""
    raw_key, _ = generate_and_save_api_key("test-suite-runner", db_path=test_db_path)
    return raw_key


@pytest.fixture
def auth_headers(valid_api_key: str) -> Dict[str, str]:
    """Cabeceras HTTP con la clave de autorización requerida."""
    return {
        "X-API-Key": valid_api_key,
        "Content-Type": "application/json",
    }
