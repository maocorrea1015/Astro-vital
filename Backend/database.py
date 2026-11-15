"""
Módulo de Gestión y Conexión de Base de Datos SQLite para ASTRA HEALTH.

Propósito:
    Proporciona utilidades para la conexión, transaccionalidad, manejo de concurrencia
    con reintentos exponenciales y ejecución del esquema relacional en SQLite.
    Garantiza aislamiento de datos y persistencia robusta en entornos fuera de línea.

Autor: Equipo de Ingeniería de ASTRA HEALTH
Versión: 1.0.0
Dependencias: sqlite3, time, pathlib, contextlib, flask
Advertencias de seguridad:
    - Todas las interacciones con la base de datos deben utilizar sentencias
      parametrizadas (signos de interrogación '?') para prevenir inyecciones SQL.
    - Jamás concatenar cadenas de texto o f-strings para construir consultas dinámicas.
"""

import sqlite3
import time
from pathlib import Path
from contextlib import contextmanager
from typing import Generator, Any
from flask import g, current_app, has_app_context

# Rutas predeterminadas
BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB_PATH = BASE_DIR / "data" / "astra_health.db"
DEFAULT_SCHEMA_PATH = BASE_DIR / "schema.sql"


def connect_database(db_path: str | Path, timeout: float = 10.0) -> sqlite3.Connection:
    """Establece una conexión directa a SQLite con pragmas de seguridad y rendimiento.

    Args:
        db_path (str | Path): Ruta al archivo de base de datos o ':memory:'.
        timeout (float): Tiempo máximo de espera en segundos ante bloqueos de escritura.

    Returns:
        sqlite3.Connection: Objeto de conexión configurado con PRAGMA WAL y Foreign Keys.

    Raises:
        sqlite3.Error: Si ocurre un error irrecuperable al abrir o configurar el archivo.

    Example:
        >>> conn = connect_database(":memory:")
        >>> conn.execute("SELECT 1").fetchone()[0]
        1

    Security Note:
        Se fuerza 'PRAGMA foreign_keys = ON' en cada conexión para evitar inconsistencias
        y 'PRAGMA journal_mode = WAL' para mitigar contenciones en escrituras concurrentes.
    """
    path_str = str(db_path)
    if path_str != ":memory:":
        db_file = Path(path_str)
        db_file.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(
        path_str,
        timeout=timeout,
        detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES,
    )
    # Configuración de fila tipo diccionario para acceso por nombre de columna
    conn.row_factory = sqlite3.Row

    # Activación de políticas de integridad y concurrencia
    conn.execute("PRAGMA foreign_keys = ON;")
    if path_str != ":memory:":
        # El modo WAL no aplica ni es necesario para bases de datos transitorias en RAM
        conn.execute("PRAGMA journal_mode = WAL;")

    return conn


@contextmanager
def get_db(db_path: str | Path | None = None) -> Generator[sqlite3.Connection, None, None]:
    """Generador contextual para operaciones transaccionales seguras con SQLite.

    Implementa política de reintentos exponenciales (50ms, 100ms, 200ms) en caso
    de bloqueos transitorios por concurrencia entre escritores.
    Garantiza commit automático al finalizar con éxito y rollback ante excepciones.

    Args:
        db_path (str | Path | None): Ruta de la base de datos. Si es None, busca en el
            contexto activo de Flask (current_app.config['DATABASE_PATH']) o usa DEFAULT_DB_PATH.

    Yields:
        sqlite3.Connection: Conexión activa a la base de datos.

    Raises:
        sqlite3.OperationalError: Si la base de datos permanece bloqueada tras 3 reintentos.
        Exception: Cualquier excepción originada durante la transacción previa al rollback.

    Example:
        >>> with get_db() as db:
        ...     db.execute("INSERT INTO nodos (astronaut_id, nombre) VALUES (?, ?)", ("astro-02", "Jane"))

    Security Note:
        La transacción atómica impide que fallos parciales durante la ingesta de lotes
        dejen lecturas huérfanas o líneas base inconsistentes.
    """
    if db_path is None:
        if has_app_context() and "DATABASE_PATH" in current_app.config:
            target_path = current_app.config["DATABASE_PATH"]
        else:
            target_path = DEFAULT_DB_PATH
    else:
        target_path = db_path

    # Gestión de reutilización de conexión durante el ciclo de vida de un request Flask
    should_close = True
    if has_app_context() and target_path == current_app.config.get("DATABASE_PATH"):
        if "db_conn" not in g:
            g.db_conn = connect_database(target_path)
        conn = g.db_conn
        should_close = False
    else:
        conn = connect_database(target_path)

    # Política de tolerancia a bloqueos: 3 reintentos con backoff exponencial (50ms, 100ms, 200ms)
    max_retries = 3
    delays = [0.05, 0.10, 0.20]

    for attempt in range(max_retries):
        try:
            # Inicio del bloque transaccional
            conn.execute("BEGIN IMMEDIATE")
            try:
                yield conn
                conn.commit()
                break
            except Exception:
                conn.rollback()
                raise
        except sqlite3.OperationalError as exc:
            # Si el error indica base de datos bloqueada o en contención
            if "locked" in str(exc).lower() or "busy" in str(exc).lower():
                if attempt < max_retries - 1:
                    time.sleep(delays[attempt])
                    continue
            raise
        finally:
            if should_close and attempt == max_retries - 1:
                conn.close()

    if should_close and conn:
        try:
            conn.close()
        except sqlite3.Error:
            pass


def close_db_connection(e: Any = None) -> None:
    """Cierra la conexión SQLite almacenada en el contexto global de Flask al terminar la petición.

    Args:
        e (Any): Error o excepción producida durante el ciclo de vida de la petición (si existe).
    """
    db_conn = g.pop("db_conn", None)
    if db_conn is not None:
        try:
            db_conn.close()
        except sqlite3.Error:
            pass


def init_db(db_path: str | Path | None = None, schema_path: str | Path | None = None) -> None:
    """Inicializa la estructura de la base de datos ejecutando el script schema.sql.

    Args:
        db_path (str | Path | None): Ruta de la base de datos a inicializar.
        schema_path (str | Path | None): Ruta al archivo schema.sql.

    Raises:
        FileNotFoundError: Si el archivo de esquema no existe.
        sqlite3.Error: Si ocurre un error de sintaxis o ejecución de las sentencias SQL.

    Example:
        >>> init_db(":memory:")
    """
    target_db = db_path if db_path is not None else DEFAULT_DB_PATH
    target_schema = schema_path if schema_path is not None else DEFAULT_SCHEMA_PATH

    schema_file = Path(target_schema)
    if not schema_file.exists():
        raise FileNotFoundError(f"No se encontró el archivo de esquema en: {schema_file}")

    with open(schema_file, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    # Se asegura la creación de tablas e inserción de datos iniciales
    with get_db(target_db) as conn:
        conn.executescript(schema_sql)
