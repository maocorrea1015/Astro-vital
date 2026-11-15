"""
==============================================================================
ASTRA-VITAL — Simulador Telemétrico ESP32 para Pruebas de Integración
==============================================================================
Mini-aplicación en Python que emula el comportamiento físico del microcontrolador
ESP32 DevKit V1 (Módulos ASTRA-WBU-01 y ASTRA-EMU-01).

Genera series temporales biomédicas y ambientales continuas, sincroniza marcas de
tiempo UNIX y transmite lotes JSON autenticados hacia el backend Flask.
Permite verificar de extremo a extremo la visualización en el dashboard React/PWA.

Uso:
    python simulator.py
    python simulator.py --mode exercise --interval 2
    python simulator.py --mode tachycardia
    python simulator.py --mode interactive
==============================================================================
"""

import sys
import os
import time
import math
import random
import argparse
import hashlib
import sqlite3
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

try:
    import requests
except ImportError:
    print("[Error] Se requiere la librería 'requests'. Instálela con: pip install requests")
    sys.exit(1)

# Rutas del proyecto para detección automática de credenciales y base de datos
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
BACKEND_DIR = PROJECT_ROOT / "Backend"
DEFAULT_DB_PATH = BACKEND_DIR / "data" / "astra_health.db"

# Códigos de color ANSI para salida en consola
RESET   = "\033[0m"
BOLD    = "\033[1m"
RED     = "\033[91m"
GREEN   = "\033[92m"
YELLOW  = "\033[93m"
BLUE    = "\033[94m"
MAGENTA = "\033[95m"
CYAN    = "\033[96m"
WHITE   = "\033[97m"


def get_or_create_api_key(db_path: Path, client_name: str = "esp32-simulator") -> str:
    """Obtiene una clave de API activa de la base de datos o genera una nueva."""
    # 1. Comprobar variable de entorno
    env_key = os.getenv("ASTRA_API_KEY")
    if env_key:
        return env_key.strip()

    # 2. Intentar buscar en la base de datos existente o registrar una clave de simulador
    if db_path.exists():
        try:
            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            # Buscar una clave activa existente
            row = cursor.execute("SELECT id FROM api_keys WHERE activa = 1 LIMIT 1").fetchone()
            if row:
                # Si ya existen claves, generamos una clave conocida para el simulador y la guardamos
                import secrets
                raw_key = f"sim-{secrets.token_urlsafe(24)}"
                key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
                now_ts = int(time.time())
                cursor.execute(
                    "INSERT INTO api_keys (key_hash, nombre_cliente, activa, creada_en) VALUES (?, ?, 1, ?)",
                    (key_hash, client_name, now_ts),
                )
                conn.commit()
                conn.close()
                return raw_key
            conn.close()
        except Exception:
            pass

    # Fallback predeterminado si no se puede acceder a la base de datos
    return "esp32_simulator_demo_token_key_2026"


class AstronautTelemetryGenerator:
    """Generador fisiológico y ambiental con deriva temporal suave y perfiles clínicos."""

    def __init__(self, astronaut_id: str = "astro-01"):
        self.astronaut_id = astronaut_id
        self.step = 0
        self.mode = "normal"
        self.quality = "ok"

    def set_mode(self, mode: str):
        self.mode = mode.lower()

    def set_quality(self, quality: str):
        self.quality = quality.lower()

    def generate_sample(self) -> List[Dict[str, Any]]:
        self.step += 1
        current_ts = int(time.time())
        t = self.step * 0.1

        # Ondas base con pequeña variación aleatoria
        wobble = math.sin(t) * 1.5 + random.uniform(-0.8, 0.8)

        if self.mode == "normal":
            # Reposo saludable
            heart_rate = round(72.0 + wobble, 1)
            spo2 = round(min(100.0, 98.2 + math.cos(t * 0.5) * 0.8 + random.uniform(-0.3, 0.3)), 1)
            temperature = round(36.6 + math.sin(t * 0.05) * 0.2 + random.uniform(-0.05, 0.05), 1)
            radiation_cpm = round(max(0.0, 14.0 + math.sin(t * 0.2) * 3.0 + random.uniform(-1.0, 1.0)), 1)
            activity = round(max(0.0, 12.0 + math.cos(t) * 6.0 + random.uniform(-2.0, 2.0)), 1)
            quality = self.quality

        elif self.mode == "exercise":
            # Rutina física en cicloergómetro
            heart_rate = round(112.0 + wobble * 2.0, 1)  # Elevada (Warning si > 100)
            spo2 = round(min(100.0, 97.5 + random.uniform(-0.5, 0.5)), 1)
            temperature = round(37.2 + math.sin(t * 0.1) * 0.3, 1)
            radiation_cpm = round(16.0 + random.uniform(-1.5, 1.5), 1)
            activity = round(65.0 + wobble * 8.0, 1)
            quality = self.quality

        elif self.mode == "tachycardia":
            # Taquicardia crítica (NASA Critical > 130 BPM)
            heart_rate = round(138.0 + random.uniform(-3.0, 6.0), 1)
            spo2 = round(94.0 + random.uniform(-1.0, 1.0), 1)
            temperature = round(37.4 + random.uniform(-0.1, 0.1), 1)
            radiation_cpm = round(15.0 + random.uniform(-1.0, 1.0), 1)
            activity = round(10.0 + random.uniform(-2.0, 2.0), 1)
            quality = self.quality

        elif self.mode == "hypoxia":
            # Hipoxia crítica por fuga o mascarilla (NASA Critical < 90% SpO2)
            heart_rate = round(108.0 + random.uniform(-2.0, 4.0), 1)
            spo2 = round(86.5 + random.uniform(-2.0, 2.0), 1)
            temperature = round(36.5 + random.uniform(-0.1, 0.1), 1)
            radiation_cpm = round(14.0 + random.uniform(-1.0, 1.0), 1)
            activity = round(5.0 + random.uniform(-1.0, 1.0), 1)
            quality = self.quality

        elif self.mode == "hyperthermia":
            # Golpe de calor o fallo de refrigeración LCG (> 38.5 °C)
            heart_rate = round(118.0 + random.uniform(-2.0, 4.0), 1)
            spo2 = round(95.0 + random.uniform(-1.0, 1.0), 1)
            temperature = round(39.1 + random.uniform(-0.2, 0.3), 1)
            radiation_cpm = round(15.0 + random.uniform(-1.0, 1.0), 1)
            activity = round(8.0 + random.uniform(-1.0, 1.0), 1)
            quality = self.quality

        elif self.mode == "radiation":
            # Tormenta solar de partículas SPE (> 100 CPM)
            heart_rate = round(88.0 + wobble, 1)
            spo2 = round(98.0 + random.uniform(-0.5, 0.5), 1)
            temperature = round(36.7 + random.uniform(-0.1, 0.1), 1)
            radiation_cpm = round(135.0 + random.uniform(-8.0, 15.0), 1)
            activity = round(20.0 + random.uniform(-3.0, 3.0), 1)
            quality = self.quality

        elif self.mode == "sensor_fault":
            # Transductor óptico o sensor desconectado
            heart_rate = round(0.0, 1)
            spo2 = round(0.0, 1)
            temperature = round(36.6 + wobble * 0.1, 1)
            radiation_cpm = round(15.0 + random.uniform(-1.0, 1.0), 1)
            activity = round(12.0 + random.uniform(-2.0, 2.0), 1)
            quality = "sensor_fault"

        else:
            heart_rate = 75.0
            spo2 = 98.0
            temperature = 36.6
            radiation_cpm = 15.0
            activity = 10.0
            quality = "ok"

        return [
            {"ts": current_ts, "variable": "heart_rate", "value": heart_rate, "quality": quality},
            {"ts": current_ts, "variable": "spo2", "value": spo2, "quality": quality},
            {"ts": current_ts, "variable": "temperature", "value": temperature, "quality": quality},
            {"ts": current_ts, "variable": "radiation_cpm", "value": radiation_cpm, "quality": quality},
            {"ts": current_ts, "variable": "activity", "value": activity, "quality": quality},
        ]


def print_banner():
    print(f"{CYAN}{BOLD}")
    print("==============================================================================")
    print("         ASTRA-VITAL — SIMULADOR TELEMÉTRICO ESP32 (HARDWARE VIRTUAL)         ")
    print("              NASA Space Apps Challenge 2026 — Equipo Ada Lovelace            ")
    print("==============================================================================")
    print(f"{RESET}")


def main():
    parser = argparse.ArgumentParser(
        description="Simulador de telemetría ESP32 para ASTRA HEALTH Backend.",
    )
    parser.add_argument("--host", default="http://localhost:5000", help="URL base del servidor Flask (default: http://localhost:5000)")
    parser.add_argument("--api-key", default=None, help="Clave X-API-Key manual (si se omite, se detecta de la BD local)")
    parser.add_argument("--astronaut-id", default="astro-01", help="Identificador del astronauta (default: astro-01)")
    parser.add_argument("--interval", type=float, default=3.0, help="Intervalo en segundos entre transmisiones (default: 3.0)")
    parser.add_argument(
        "--mode",
        choices=["normal", "exercise", "tachycardia", "hypoxia", "hyperthermia", "radiation", "sensor_fault", "interactive"],
        default="normal",
        help="Perfil inicial de simulación fisiológica",
    )
    parser.add_argument("--count", type=int, default=0, help="Número de paquetes a enviar (0 = infinito)")
    args = parser.parse_args()

    print_banner()

    # 1. Resolver API Key
    api_key = args.api_key
    if not api_key:
        api_key = get_or_create_api_key(DEFAULT_DB_PATH)

    backend_url = f"{args.host.rstrip('/')}/api/readings"
    health_url  = f"{args.host.rstrip('/')}/api/health"

    print(f"{BOLD}Configuración de Enlace:{RESET}")
    print(f"  • Servidor Destino : {GREEN}{backend_url}{RESET}")
    print(f"  • Astronaut ID     : {YELLOW}{args.astronaut_id}{RESET}")
    print(f"  • Intervalo Envío  : {WHITE}{args.interval} segundos{RESET}")
    print(f"  • Perfil Inicial   : {MAGENTA}{args.mode.upper()}{RESET}")
    print(f"  • API Key Token    : {CYAN}{api_key[:8]}...{api_key[-6:] if len(api_key) > 14 else ''}{RESET}")
    print("------------------------------------------------------------------------------")

    # 2. Comprobar salud del backend
    try:
        print(f"[*] Comprobando disponibilidad del backend en {health_url}...")
        res_health = requests.get(health_url, timeout=3.0)
        if res_health.status_code == 200:
            print(f"{GREEN}[✓] Backend conectado exitosamente: {res_health.json()}{RESET}\n")
        else:
            print(f"{YELLOW}[!] El backend respondió con código {res_health.status_code}{RESET}\n")
    except requests.exceptions.RequestException as exc:
        print(f"{RED}[!] No se pudo conectar con el backend en {health_url}{RESET}")
        print(f"    Detalle: {exc}")
        print(f"{YELLOW}[i] Asegúrese de haber iniciado Flask ejecutando 'python app.py' en la carpeta Backend.{RESET}\n")

    generator = AstronautTelemetryGenerator(astronaut_id=args.astronaut_id)
    if args.mode != "interactive":
        generator.set_mode(args.mode)

    headers = {
        "Content-Type": "application/json",
        "X-API-Key": api_key,
    }

    print(f"{BOLD}Iniciando transmisión de telemetría continua (Presione Ctrl+C para detener)...{RESET}")
    if args.mode == "interactive":
        print(f"{CYAN}Modo interactivo disponible. Teclas directas al presionar Enter:{RESET}")
        print("  [n] Normal  [e] Ejercicio  [t] Taquicardia  [h] Hipoxia  [f] Fiebre  [r] Radiación  [x] Sensor Fault\n")

    sent_count = 0

    try:
        while True:
            sent_count += 1
            readings = generator.generate_sample()
            payload = {
                "astronaut_id": args.astronaut_id,
                "readings": readings,
            }

            # Extraer variables para vista previa en terminal
            bpm  = next((r["value"] for r in readings if r["variable"] == "heart_rate"), 0)
            spo2 = next((r["value"] for r in readings if r["variable"] == "spo2"), 0)
            temp = next((r["value"] for r in readings if r["variable"] == "temperature"), 0)
            rad  = next((r["value"] for r in readings if r["variable"] == "radiation_cpm"), 0)
            act  = next((r["value"] for r in readings if r["variable"] == "activity"), 0)
            qual = readings[0]["quality"]

            ts_str = time.strftime("%H:%M:%S", time.localtime(readings[0]["ts"]))

            start_t = time.time()
            try:
                response = requests.post(backend_url, json=payload, headers=headers, timeout=5.0)
                latency_ms = int((time.time() - start_t) * 1000)

                if response.status_code == 200:
                    resp_json = response.json()
                    alertas = resp_json.get("alertas_generadas", 0)
                    alerta_tag = f" | {RED}{BOLD}ALERTAS: {alertas}{RESET}" if alertas > 0 else ""

                    print(
                        f"[{ts_str}] Paquete #{sent_count:04d} | {GREEN}HTTP 200 ({latency_ms}ms){RESET} | "
                        f"FC: {BOLD}{bpm:>5.1f}{RESET} BPM | "
                        f"SpO2: {BOLD}{spo2:>5.1f}%{RESET} | "
                        f"Temp: {BOLD}{temp:>4.1f}°C{RESET} | "
                        f"Rad: {BOLD}{rad:>5.1f}{RESET} CPM | "
                        f"Act: {act:>4.1f} | "
                        f"Cal: {qual}{alerta_tag}"
                    )
                elif response.status_code == 401:
                    print(f"[{ts_str}] Paquete #{sent_count:04d} | {RED}HTTP 401 Unauthorized{RESET}: API Key rechazada.")
                elif response.status_code == 429:
                    print(f"[{ts_str}] Paquete #{sent_count:04d} | {YELLOW}HTTP 429 Rate Limit{RESET}: Espere antes de reintentar.")
                else:
                    print(f"[{ts_str}] Paquete #{sent_count:04d} | {RED}HTTP {response.status_code}{RESET}: {response.text}")

            except requests.exceptions.RequestException as err:
                print(f"[{ts_str}] Paquete #{sent_count:04d} | {RED}Fallo de red{RESET}: {err}")

            if args.count > 0 and sent_count >= args.count:
                print(f"\n[✓] Transmisión finalizada tras {sent_count} paquetes.")
                break

            time.sleep(args.interval)

    except KeyboardInterrupt:
        print(f"\n{YELLOW}[*] Simulación detenida por el operador.{RESET}")
        print(f"    Total de paquetes transmitidos: {sent_count}")


if __name__ == "__main__":
    main()
