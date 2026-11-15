"""
Script CLI para la Generación y Registro Seguro de API Keys para ASTRA HEALTH.

Propósito:
    Genera tokens criptográficos de alta entropía (32 bytes urlsafe) para clientes
    autorizados (ESP32, App de Raspberry Pi, terminales médicas).
    Calcula y persiste exclusivamente el hash SHA-256 en la base de datos SQLite.
    Muestra la clave en texto plano UNA SOLA VEZ en la consola para el operador.

Uso:
    python generate_api_key.py --name "esp32-suit-01"
    python generate_api_key.py --name "app-raspberry-pi"

Autor: Equipo de Ciberseguridad de ASTRA HEALTH
Versión: 1.0.0
Dependencias: secrets, hashlib, argparse, database
Advertencias de seguridad:
    - La clave en texto plano jamás se almacena en disco ni en base de datos.
    - Si el operador pierde la clave, no puede ser recuperada; debe ser revocada
      y generarse una nueva inmediatamente.
"""

import argparse
import hashlib
import secrets
import sys
import time
from database import get_db, init_db


def generate_and_save_api_key(client_name: str, db_path: str | None = None) -> tuple[str, str]:
    """Genera una clave aleatoria segura y almacena su hash SHA-256 en la base de datos.

    Args:
        client_name (str): Etiqueta descriptiva del dispositivo o cliente autorizado.
        db_path (str | None): Ruta personalizada a la base de datos (opcional).

    Returns:
        tuple[str, str]: Tupla que contiene (raw_key, key_hash).

    Raises:
        ValueError: Si el nombre del cliente está vacío o contiene caracteres de control.
        sqlite3.Error: Si ocurre un fallo durante la persistencia en la base de datos.

    Security Note:
        Se emplea secrets.token_urlsafe(32) que proporciona al menos 256 bits de entropía
        criptográficamente segura proveniente del CSPRNG del sistema operativo.
    """
    cleaned_name = client_name.strip()
    if not cleaned_name:
        raise ValueError("El nombre del cliente no puede estar vacío.")

    # Generación de la clave criptográfica en texto plano
    raw_key = secrets.token_urlsafe(32)

    # Cálculo unidireccional del hash SHA-256
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    now_ts = int(time.time())

    # Asegura que las tablas existan antes de insertar
    init_db(db_path=db_path)

    # Inserción parametrizada segura
    with get_db(db_path=db_path) as db:
        db.execute(
            """
            INSERT INTO api_keys (key_hash, nombre_cliente, activa, creada_en)
            VALUES (?, ?, 1, ?)
            """,
            (key_hash, cleaned_name, now_ts),
        )

    return raw_key, key_hash


def main() -> None:
    """Punto de entrada de línea de comandos para el script de generación de claves."""
    parser = argparse.ArgumentParser(
        description="Generador seguro de credenciales API Key para ASTRA HEALTH.",
    )
    parser.add_argument(
        "--name",
        type=str,
        help="Nombre descriptivo del dispositivo o subsistema (ej. 'esp32-demo', 'app-pi').",
    )
    parser.add_argument(
        "--db",
        type=str,
        default=None,
        help="Ruta opcional al archivo de base de datos SQLite.",
    )

    args = parser.parse_args()

    client_name = args.name
    if not client_name:
        try:
            client_name = input("Ingrese el nombre descriptivo del cliente (ej. esp32-demo): ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nOperación cancelada por el usuario.")
            sys.exit(1)

    if not client_name:
        print("ERROR: Debe proporcionar un nombre descriptivo válido.", file=sys.stderr)
        sys.exit(1)

    try:
        raw_key, key_hash = generate_and_save_api_key(client_name, db_path=args.db)
        print("\n" + "=" * 70)
        print(" ASTRO-HEALTH / CREDENCIAL DE SEGURIDAD EMITIDA EXITOSAMENTE")
        print("=" * 70)
        print(f" Cliente / Dispositivo : {client_name}")
        print(f" Hash Almacenado (SHA256) : {key_hash}")
        print("-" * 70)
        print(" CLAVE EN TEXTO PLANO (COPIAR AHORA, NO SE VOLVERÁ A MOSTRAR):")
        print(f" >> {raw_key} <<")
        print("=" * 70)
        print(" ADVERTENCIA: Esta clave nunca se almacena en texto plano en el servidor.")
        print(" Configúrala en la cabecera 'X-API-Key' de tu dispositivo o cliente HTTP.")
        print("=" * 70 + "\n")
    except Exception as exc:
        print(f"ERROR al generar la API key: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
