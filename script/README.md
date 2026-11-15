# ASTRA-VITAL — Mini-App Simulador ESP32

[![NASA Space Apps Challenge](https://img.shields.io/badge/NASA_Space_Apps-Challenge_2026-blue.svg)](https://www.spaceappschallenge.org/)
[![Language](https://img.shields.io/badge/Language-Python_3.10%2B-3776AB.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](../LICENSE)

Esta mini-aplicación emula el comportamiento físico del microcontrolador **ESP32 DevKit V1** y los sensores de los módulos **`ASTRA-WBU-01`** (Wearable biomédico) y **`ASTRA-EMU-01`** (Monitor ambiental).

Permite alimentar continuamente al backend Flask con telemetría en tiempo real para verificar de extremo a extremo que los datos aparezcan en la consola React (**Tripulación**, **Detalle** y **Monitoreo**).

---

## Características

- **Autenticación:** Lee `ASTRA_API_KEY` del entorno o acepta `--api-key`. No consulta la base de datos del backend ni usa una clave por defecto.
- **5 Variables Oficiales:** Frecuencia cardíaca (`heart_rate`), saturación de oxígeno (`spo2`), temperatura corporal (`temperature`), radiación ionizante (`radiation_cpm`) y aceleración/actividad (`activity`).
- **Idempotencia y Sincronía NTP:** Emite marcas de tiempo UNIX estrictas en segundos (`ts = int(time.time())`).
- **Simulación de Contingencias Médicas y Ambientales:**
  - `normal`: Constantes fisiológicas saludables en reposo.
  - `exercise`: Actividad física moderada (FC 105-125 BPM).
  - `tachycardia`: Disparo de alarma crítica por taquicardia (>130 BPM).
  - `hypoxia`: Disparo de alarma crítica por saturación baja (<90% SpO2).
  - `hyperthermia`: Disparo de alarma por estrés térmico / fiebre (>38.5 °C).
  - `radiation`: Pico de radiación por evento de partículas solares (>100 CPM).
  - `sensor_fault`: Telemetría con `quality: "sensor_fault"` para probar la visualización de sensor degradado sin falsas alarmas médicas.

---

## Cómo Ejecutar

### 1. Requisitos
Tener instalado Python 3.10+ y la librería `requests`:
```bash
pip install requests
```

### 2. Ejecución Básica
Con el backend Flask corriendo (`python app.py` en `Backend/`), ejecuta:
```bash
python script/simulator.py
```
*El script comenzará a transmitir un paquete cada 5 segundos hacia `http://localhost:5000/api/readings`.*

### 3. Modos Avanzados de Simulación

```bash
# Probar rutina de ejercicio físico
python script/simulator.py --mode exercise

# Forzar una alerta crítica de frecuencia cardíaca (>130 BPM)
python script/simulator.py --mode tachycardia

# Forzar una alerta crítica de hipoxia (<90% SpO2)
python script/simulator.py --mode hypoxia

# Forzar una alerta de radiación ionizante (>100 CPM)
python script/simulator.py --mode radiation

# Simular desconexión de sensor óptico (sensor_fault)
python script/simulator.py --mode sensor_fault

# Cambiar el intervalo de envío (ej. cada 1 segundo)
python script/simulator.py --interval 1.0

# Enviar solo 10 paquetes de prueba
python script/simulator.py --count 10
```

---

## Parámetros CLI

| Parámetro | Valor por Defecto | Descripción |
| :--- | :--- | :--- |
| `--host` | `http://localhost:5000` | URL del servidor Flask destino. |
| `--astronaut-id` | `astro-01` | Identificador del tripulante. |
| `--interval` | `5.0` | Segundos entre cada transmisión. |
| `--mode` | `normal` | Perfil clínico a simular. |
| `--count` | `0` (infinito) | Límite de paquetes a despachar. |
| `--api-key` | `ASTRA_API_KEY` | Clave `X-API-Key`; requerida y sin fallback por defecto. |
