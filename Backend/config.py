"""
Módulo de Configuración Centralizada para ASTRA HEALTH Backend.

Propósito:
    Gestiona la carga de variables de entorno y proporciona configuraciones
    seguras para los entornos de desarrollo, pruebas y producción.
    Garantiza que ningún secreto quede codificado en el código fuente.

Autor: Equipo de Ingeniería de ASTRA HEALTH
Versión: 1.0.0
Dependencias: os, pathlib, dotenv
Advertencias de seguridad:
    - Nunca almacenar claves en texto plano en este archivo.
    - Asegurarse de que el archivo .env no se incluya en el control de versiones.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Carga de variables de entorno desde el archivo .env si existe en el directorio raíz
# Seguridad: Se busca de forma relativa al directorio base del proyecto
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)


class Config:
    """Configuración base con parámetros por defecto para ASTRA HEALTH.

    Attributes:
        SECRET_KEY (str): Clave secreta para la aplicación Flask.
        DATABASE_PATH (str): Ruta al archivo de base de datos SQLite.
        HOST (str): Host en el que escuchará el servidor.
        PORT (int): Puerto de enlace del servidor web.
        RATE_LIMIT_MAX_REQUESTS (int): Peticiones máximas permitidas por ventana.
        RATE_LIMIT_WINDOW_SECONDS (int): Duración de la ventana de limitación en segundos.
        ASTRONAUT_TIMEOUT_SECONDS (int): Tiempo en segundos para clasificar nodo como offline.
        LOG_LEVEL_CONSOLE (str): Nivel de registro para la consola estándar.
        LOG_LEVEL_FILE (str): Nivel de registro para el archivo rotativo de logs.
        LOG_FILE_PATH (str): Ruta al archivo rotativo de logs del backend.
        ENABLE_HSTS (bool): Indicador para habilitar la cabecera Strict-Transport-Security.
        TESTING (bool): Indica si la aplicación corre en modo de pruebas automatizadas.
    """

    SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback-insecure-secret-key-astra")
    # Base de datos SQLite local dentro de data/
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", str(BASE_DIR / "data" / "astra_health.db"))
    
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "5000"))

    # Configuración de seguridad para el limitador de tasa (Rate Limiter en memoria)
    # Seguridad: Mitiga ataques de denegación de servicio (DoS) y fuerza bruta en API Keys
    RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "100"))
    RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

    # Umbral de latencia/latido: Si no hay lecturas tras 60s, el astronauta se declara 'offline'
    ASTRONAUT_TIMEOUT_SECONDS: int = int(os.getenv("ASTRONAUT_TIMEOUT_SECONDS", "60"))

    # Configuración de registros (Logging)
    LOG_LEVEL_CONSOLE: str = os.getenv("LOG_LEVEL_CONSOLE", "INFO")
    LOG_LEVEL_FILE: str = os.getenv("LOG_LEVEL_FILE", "WARNING")
    LOG_FILE_PATH: str = str(BASE_DIR / "logs" / "backend.log")

    # Cabeceras de seguridad
    ENABLE_HSTS: bool = os.getenv("ENABLE_HSTS", "false").lower() in ("true", "1", "yes")
    # Habilitar consultas GET públicas para integración con frontend React en navegador/demo
    ALLOW_ANONYMOUS_READ: bool = os.getenv("ALLOW_ANONYMOUS_READ", "true").lower() in ("true", "1", "yes")
    TESTING: bool = False


class DevelopmentConfig(Config):
    """Configuración específica para el entorno de desarrollo local."""

    DEBUG: bool = True
    ALLOW_ANONYMOUS_READ: bool = True


class TestingConfig(Config):
    """Configuración para ejecución de pruebas automatizadas con pytest.

    Utiliza base de datos en memoria para aislamiento e inicializa parámetros rápidos.
    """

    TESTING: bool = True
    DEBUG: bool = False
    DATABASE_PATH: str = ":memory:"
    # Tasa relajada para evitar colisiones accidentales en suites de prueba concurrentes
    RATE_LIMIT_MAX_REQUESTS: int = 1000
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    ALLOW_ANONYMOUS_READ: bool = False


class ProductionConfig(Config):
    """Configuración para despliegue en entornos de producción (laptop de misión o Raspberry Pi)."""

    DEBUG: bool = False


def get_config(env_name: str | None = None) -> type[Config]:
    """Obtiene la clase de configuración apropiada según el entorno actual.

    Args:
        env_name (str | None): Nombre del entorno ('development', 'testing', 'production').
            Si es None, se lee la variable de entorno FLASK_ENV.

    Returns:
        type[Config]: Clase de configuración que hereda de Config.

    Example:
        >>> config_class = get_config("development")
        >>> app.config.from_object(config_class)

    Security Note:
        En producción, valida que la clave secreta no coincida con el valor por defecto
        inseguro para evitar brechas de seguridad criptográfica.
    """
    if env_name is None:
        env_name = os.getenv("FLASK_ENV", "development").lower()

    configs = {
        "development": DevelopmentConfig,
        "testing": TestingConfig,
        "production": ProductionConfig,
    }

    selected_config = configs.get(env_name, DevelopmentConfig)

    # Verificación de seguridad en modo de producción
    if selected_config is ProductionConfig:
        if selected_config.SECRET_KEY == "fallback-insecure-secret-key-astra":
            raise ValueError(
                "CRITICAL SECURITY ALERT: Se ha detectado la SECRET_KEY por defecto "
                "en un entorno de producción. Debe definir SECRET_KEY en las variables de entorno."
            )

    return selected_config
