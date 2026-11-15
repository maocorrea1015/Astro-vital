"""Laboratorio L10-B. Ejecutar con Flask, flask-cors, python-dotenv y requests."""
import argparse
import hashlib
import json
import logging
import os
from pathlib import Path
import secrets
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
from types import SimpleNamespace

import requests
from werkzeug.serving import make_server


def emit(data):
    print(json.dumps(data, ensure_ascii=True), flush=True)


def run_lab(repo, bundle):
    host = "127.0.0.1"
    base = f"http://{host}:5000"
    with tempfile.TemporaryDirectory(prefix="astro-l10b-flask-") as directory:
        isolated = Path(directory).resolve(strict=True)
        tracked = subprocess.check_output(
            ["git", "ls-files", "-z", "--", "Backend"], cwd=repo
        ).decode("utf-8").split("\0")
        for name in tracked:
            if not name.endswith((".py", ".sql")):
                continue
            destination = isolated / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(repo / name, destination)

        simulator_path = isolated / "script" / "simulator.py"
        simulator_path.parent.mkdir()
        shutil.copyfile(repo / "script" / "simulator.py", simulator_path)
        db_path = (isolated / "l10b.sqlite").resolve()
        if db_path.parent != isolated or db_path.is_relative_to(repo) or db_path.exists():
            raise RuntimeError("Ruta SQLite fuera del laboratorio o ya existente")
        os.environ["DATABASE_PATH"] = str(db_path)
        sys.dont_write_bytecode = True
        sys.path[:0] = [str(isolated / "Backend"), str(simulator_path.parent)]

        from app import create_app
        from config import DevelopmentConfig, ProductionConfig
        from routes import readings
        import simulator

        if Path(DevelopmentConfig.DATABASE_PATH).resolve() != db_path or ProductionConfig.ALLOW_ANONYMOUS_READ:
            raise RuntimeError("Configuración inesperada")

        app = create_app("development", {"LOG_FILE_PATH": str(isolated / "flask.log")})
        if Path(app.config["DATABASE_PATH"]).resolve(strict=True) != db_path or not app.config["ALLOW_ANONYMOUS_READ"]:
            raise RuntimeError("La configuración efectiva no corresponde al laboratorio")
        logging.getLogger("werkzeug").setLevel(logging.ERROR)
        token = secrets.token_urlsafe(32)
        rules = []
        original_rule = readings.evaluate_reading_alert

        def observe_rule(*args):
            alert = original_rule(*args)
            rules.append(alert["severidad"] if alert else None)
            return alert

        readings.evaluate_reading_alert = observe_rule
        posts = []

        def send(url, *, json, headers, timeout):
            if url != base + "/api/readings" or headers.get("X-API-Key") != token:
                raise RuntimeError("Destino o autorización del simulador fuera del laboratorio")
            response = requests.post(url, json=json, headers=headers, timeout=timeout)
            payload = response.json()
            posts.append({
                "status": response.status_code,
                "reply": {name: payload.get(name) for name in (
                    "recibidas", "insertadas", "duplicadas", "invalidas", "alertas_generadas",
                )},
                "sample": json["readings"],
            })
            return response

        simulator.requests = SimpleNamespace(
            get=requests.get, post=send, exceptions=requests.exceptions
        )
        simulator.print = lambda *args, **kwargs: None
        server = None
        thread = None
        port_confirmed = False

        def start():
            nonlocal server, thread
            server = make_server(host, 5000, app, threaded=True)
            if server.socket.getsockname()[:2] != (host, 5000):
                server.server_close()
                raise RuntimeError("Socket no limitado a loopback")
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            health = requests.get(base + "/api/health", timeout=3)
            if health.status_code != 200 or health.json().get("status") != "ok":
                raise RuntimeError("Health inesperado")
            return health.status_code

        def stop():
            nonlocal server, thread
            if server is not None:
                server.shutdown()
                server.server_close()
                thread.join()
                server = None

        # El secreto se crea y registra únicamente en SQLite temporal.
        # El argv de Python se reemplaza en memoria, sin poner el secreto en el comando del proceso.
        try:
            health = start()
            port_confirmed = True
            with sqlite3.connect(db_path) as db:
                db.execute(
                    "INSERT INTO api_keys(key_hash,nombre_cliente) VALUES (?,?)",
                    (hashlib.sha256(token.encode()).hexdigest(), "l10b-simulator"),
                )
            refusal = requests.post(base + "/api/readings", json={}, timeout=3)
            if refusal.status_code != 401:
                raise RuntimeError("La ingesta sin credencial no fue rechazada")
            emit({
                "ready": True, "bind": base, "sqlite": db_path.name, "temporal": True,
                "health": health, "post_sin_clave": refusal.status_code,
                "produccion_lectura_anonima": ProductionConfig.ALLOW_ANONYMOUS_READ,
            })
            for line in sys.stdin:
                action = line.strip()
                if action == "quit":
                    break
                if action == "stop":
                    stop()
                    emit({"stopped": True})
                    continue
                if action == "start":
                    emit({"health": start() if server is None else 200})
                    continue
                if action == "bundle":
                    assets = [p for directory in bundle for p in directory.rglob("*")
                              if p.is_file() and p.suffix in (".js", ".css", ".html")]
                    if not assets:
                        raise RuntimeError("Build ausente para la comprobación del bundle")
                    emit({"archivos_bundle": len(assets),
                          "clave_efimera_en_bundle": any(token.encode() in p.read_bytes() for p in assets)})
                    continue
                if action not in ("normal", "tachycardia", "sensor_fault") or not port_confirmed or server is None:
                    raise RuntimeError("Escenario no admitido o Flask detenido")
                posts.clear()
                rules.clear()
                time.sleep(1.05)
                old_argv = sys.argv
                sys.argv = ["simulator.py", "--host", base, "--api-key", token,
                            "--astronaut-id", "astro-01", "--mode", action,
                            "--interval", "2", "--count", "2" if action == "normal" else "1"]
                try:
                    simulator.main()
                finally:
                    sys.argv = old_argv
                status = requests.get(base + "/api/astronauts/astro-01/status", timeout=3)
                history = requests.get(base + "/api/astronauts/astro-01/readings", timeout=3)
                if status.status_code != 200 or history.status_code != 200:
                    raise RuntimeError("No se pudo verificar la persistencia por REST")
                with sqlite3.connect(db_path) as db:
                    rows = db.execute("SELECT COUNT(*) FROM lecturas WHERE astronaut_id='astro-01'").fetchone()[0]
                emit({
                    "mode": action, "posts": posts, "rules_evaluated": len(rules),
                    "rule_alerts": [severity for severity in rules if severity is not None],
                    "status": status.status_code, "history": history.status_code, "sqlite_rows": rows,
                    "alerts": [{key: alert[key] for key in ("id", "ts", "variable", "valor", "severidad")}
                               for alert in status.json()["alertas_activas"]],
                    "heart_rate": [r for r in history.json() if r["variable"] == "heart_rate"],
                })
        finally:
            stop()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("repo", type=Path)
    parser.add_argument("--bundle", action="append", type=Path, default=[])
    args = parser.parse_args()
    run_lab(args.repo.resolve(strict=True), args.bundle)
