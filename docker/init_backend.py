"""Initialize the backend schema and register environment-provided API key hashes."""

import hashlib
import os
import sqlite3
import time

database_path = os.environ["DATABASE_PATH"]
keys = (
    (os.environ["ASTRA_API_KEY"], "esp32-simulator"),
    (os.environ["FRONTEND_API_KEY"], "frontend-readonly"),
)

connection = sqlite3.connect(database_path)
try:
    # Initialize the schema before registering credentials and starting the API.
    backend_schema = "/app/schema.sql"
    with open(backend_schema, encoding="utf-8") as schema_file:
        connection.executescript(schema_file.read())
    now = int(time.time())
    for raw_key, client_name in keys:
        key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
        connection.execute(
            "INSERT OR IGNORE INTO api_keys (key_hash, nombre_cliente, activa, creada_en) VALUES (?, ?, 1, ?)",
            (key_hash, client_name, now),
        )
    connection.commit()
finally:
    connection.close()
