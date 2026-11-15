# ASTRA HEALTH - Backend Telemétrico y Clínico

Sistema de monitoreo telemétrico biomédico y soporte vital para astronautas en hábitats y misiones espaciales en entornos aislados, confinados y extremos (ICE). Desarrollado con **Python 3.11+**, **Flask 3.x** y **SQLite 3**, diseñado para operar de forma 100% **fuera de línea (offline)** en hardware embebido (Raspberry Pi / Laptop de Misión).

---

## Características Principales

- **Ingesta Idempotente**: Protección contra duplicados en redes espaciales intermitentes mediante restricción `UNIQUE` en base de datos.
- **Motor de Reglas Clínicas**:
  - Umbrales absolutos médicos prioritarios para frecuencia cardíaca, SpO2, temperatura corporal y radiación ionizante (alineados al *NASA Human Research Program*).
  - Reglas personalizadas por desviación estadística (Z-Score individual) con mínimo de 50 muestras basales.
- **Seguridad Perimetral Robusta**:
  - Autenticación criptográfica con API Keys hasheadas con SHA-256 (nunca en texto plano).
  - Limitador de tasa en memoria (*Rate Limiting*) con ventana deslizante thread-safe (100 req/min).
  - Validación de esquemas y listas blancas estrictas sin dependencias externas.
  - Sanitización anti-XSS y prevención total de inyecciones SQL (parámetros vinculados `?`).
  - Cabeceras de seguridad HTTP (`nosniff`, `DENY`, `CSP`, `no-store`).
- **Persistencia Concurrente**: SQLite configurado con `PRAGMA journal_mode = WAL` y política de reintentos exponenciales ante contención.
- **Tolerancia a Fallos**: Procesamiento de lotes mixtos (ingesta de lecturas válidas y reporte de inválidas), y tratamiento de sensores con fallo de hardware (`sensor_fault`) sin disparar falsas alarmas.

---

## Estructura del Proyecto

```
Backend/
├── app.py                  # Punto de entrada y factoría de la aplicación Flask
├── config.py               # Configuración centralizada por entornos (.env)
├── database.py             # Conexión SQLite, contexto transaccional y reintentos
├── schema.sql              # Esquema relacional exhaustivamente documentado
├── rules.py                # Motor de reglas médicas y cálculo de línea base
├── security.py             # Autenticación API Key, rate limit y cabeceras
├── validators.py           # Esquemas de validación y sanitización anti-XSS
├── logging_config.py       # Registro dual (consola INFO / archivo WARNING rotativo)
├── generate_api_key.py     # Script CLI para emitir y registrar API Keys
├── routes/
│   ├── __init__.py
│   ├── readings.py         # POST /api/readings (ingesta masiva)
│   ├── astronauts.py       # GET /api/astronauts, status y lecturas
│   ├── alerts.py           # GET /api/astronauts/<id>/alerts, acknowledge
│   └── notes.py            # POST/GET /api/astronauts/<id>/notes
├── tests/
│   ├── conftest.py         # Fixtures de base de datos aislada y cliente HTTP
│   ├── test_readings.py    # Pruebas de ingesta, idempotencia y validación
│   ├── test_astronauts.py  # Pruebas de estado, conectividad y contrato
│   ├── test_alerts.py      # Pruebas de reglas absolutas, Z-Score y acknowledge
│   └── test_security.py    # Pruebas de auth, rate limit, headers y SQL injection
├── docs/
│   ├── ARCHITECTURE.md     # Arquitectura general y flujo de datos
│   ├── API.md              # Referencia exhaustiva de endpoints y contratos
│   ├── SECURITY.md         # Medidas de seguridad y ataques mitigados
│   ├── DATABASE.md         # Esquema, índices y diccionario de datos
│   ├── RULES.md            # Reglas clínicas y justificación médica NASA
│   ├── DEPLOYMENT.md       # Despliegue en < 10 minutos y política de logs
│   ├── TESTING.md          # Ejecución y diseño de pruebas automatizadas
│   ├── TROUBLESHOOTING.md  # 12 incidentes comunes y soluciones
│   └── decisions/          # Architecture Decision Records (ADRs)
│       ├── 001-usar-sqlite-en-lugar-de-postgresql.md
│       ├── 002-api-keys-en-lugar-de-jwt.md
│       ├── 003-rate-limiting-en-memoria.md
│       ├── 004-reglas-absolutas-prioritarias-sobre-desviacion.md
│       ├── 005-linea-base-requiere-50-muestras.md
│       └── 006-ingesta-idempotente-con-unique-constraint.md
├── logs/                   # Logs rotativos del sistema (backend.log)
├── data/                   # Archivo de base de datos SQLite (astra_health.db)
├── requirements.txt        # Dependencias fijadas
├── .env.example            # Plantilla de variables de entorno
├── .gitignore              # Exclusiones de control de versiones
└── README.md               # Documentación principal
```

---

## Inicio Rápido (< 5 minutos)

### 1. Clonar e Instalar Dependencias
```bash
# Crear y activar entorno virtual
python -m venv venv
# En Windows:
.\venv\Scripts\Activate.ps1
# En Linux/macOS:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 2. Configurar Variables de Entorno
```bash
# En Windows:
Copy-Item .env.example .env
# En Linux/macOS:
cp .env.example .env
```

### 3. Generar Claves de Acceso (API Keys)
```bash
# Generar clave para el traje espacial / ESP32
python generate_api_key.py --name "esp32-demo"

# Generar clave para la app en Raspberry Pi
python generate_api_key.py --name "app-pi"
```
*Guarda la clave en texto plano mostrada en la terminal (ejemplo: `zCroxPryFzE1HRYWO5xfDdYht1-I7mx9SKEnIzUdO40`).*

### 4. Arrancar el Servidor
```bash
python app.py
```
El servidor escuchará en `http://0.0.0.0:5000`.

---

## Ejecución de Pruebas Automatizadas

La suite incluye 18 pruebas completas que validan ingesta, reglas, contratos y defensas:

```bash
# Ejecutar con pytest
python -m pytest -v
```

Salida esperada:
```
tests/test_alerts.py::test_absolute_rules_all_thresholds PASSED
tests/test_alerts.py::test_deviation_rule_requires_50_samples PASSED
tests/test_alerts.py::test_deviation_rule_triggers_with_at_least_50_samples PASSED
tests/test_alerts.py::test_alert_acknowledgement_flow PASSED
tests/test_astronauts.py::test_list_astronauts_and_status_calculation PASSED
tests/test_astronauts.py::test_astronaut_status_contract PASSED
tests/test_astronauts.py::test_astronaut_readings_history_and_filters PASSED
tests/test_astronauts.py::test_astronaut_notes_flow_and_sanitization PASSED
tests/test_readings.py::test_ingestion_idempotence PASSED
tests/test_readings.py::test_ingestion_payload_validation_errors PASSED
tests/test_readings.py::test_mixed_batch_fault_tolerance PASSED
tests/test_readings.py::test_sensor_fault_handling PASSED
tests/test_security.py::test_authentication_enforcement PASSED
tests/test_security.py::test_revoked_api_key PASSED
tests/test_security.py::test_rate_limiting_enforcement PASSED
tests/test_security.py::test_security_headers_presence PASSED
tests/test_security.py::test_sql_injection_resistance PASSED
tests/test_security.py::test_api_keys_are_never_stored_in_plaintext PASSED

18 passed in 1.07s
```

---

## Ejemplos de Peticiones con cURL

Reemplaza `TU_API_KEY` por la clave generada en el paso anterior.

### 1. Comprobación de Salud (Público)
```bash
curl -X GET http://localhost:5000/api/health
```

### 2. Ingesta de Telemetría (ESP32)
```bash
curl -X POST http://localhost:5000/api/readings \
  -H "X-API-Key: TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "astronaut_id": "astro-01",
    "readings": [
      {"ts": 1712345678, "variable": "heart_rate", "value": 115, "quality": "ok"},
      {"ts": 1712345678, "variable": "spo2", "value": 98, "quality": "ok"}
    ]
  }'
```

### 3. Estado Consolidado de la Cabina (Raspberry Pi)
```bash
curl -X GET http://localhost:5000/api/astronauts/astro-01/status \
  -H "X-API-Key: TU_API_KEY"
```

### 4. Consultar Historial de Lecturas
```bash
curl -X GET "http://localhost:5000/api/astronauts/astro-01/readings?variable=heart_rate&hours=6&limit=20" \
  -H "X-API-Key: TU_API_KEY"
```

### 5. Consultar y Reconocer Alertas
```bash
# Listar alertas activas pendientes
curl -X GET "http://localhost:5000/api/astronauts/astro-01/alerts?reconocida=0" \
  -H "X-API-Key: TU_API_KEY"

# Reconocer alerta (ejemplo ID 1)
curl -X POST http://localhost:5000/api/alerts/1/acknowledge \
  -H "X-API-Key: TU_API_KEY"
```

### 6. Bitácora de Notas Clínicas
```bash
# Registrar nota
curl -X POST http://localhost:5000/api/astronauts/astro-01/notes \
  -H "X-API-Key: TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"texto": "Siento ligera fatiga tras la presurización."}'

# Consultar notas
curl -X GET http://localhost:5000/api/astronauts/astro-01/notes \
  -H "X-API-Key: TU_API_KEY"
```

---

## Enlaces a la Documentación Técnica Detallada

| Documento | Descripción |
|-----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagramas de arquitectura, flujo de datos y decisiones de diseño. |
| [API.md](docs/API.md) | Referencia completa de cada endpoint, parámetros y códigos de error. |
| [SECURITY.md](docs/SECURITY.md) | Cada medida de seguridad, mitigación de ataques y pruebas. |
| [DATABASE.md](docs/DATABASE.md) | Esquema relacional completo, índices, restricciones y justificación. |
| [RULES.md](docs/RULES.md) | Reglas médicas absolutas y Z-Score con referencia a riesgos NASA HRP. |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Guía de instalación, configuración, logging y rotación de registros. |
| [TESTING.md](docs/TESTING.md) | Cobertura de pruebas, plantilla de nuevos tests e interpretación de fallos. |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Solución a 12 incidentes operacionales comunes. |

### Registros de Decisiones de Arquitectura (ADR)
- [001: Usar SQLite en lugar de PostgreSQL](docs/decisions/001-usar-sqlite-en-lugar-de-postgresql.md)
- [002: API Keys en lugar de JWT](docs/decisions/002-api-keys-en-lugar-de-jwt.md)
- [003: Rate Limiting en memoria](docs/decisions/003-rate-limiting-en-memoria.md)
- [004: Prevalencia de reglas absolutas sobre desviación](docs/decisions/004-reglas-absolutas-prioritarias-sobre-desviacion.md)
- [005: Línea base requiere 50 muestras](docs/decisions/005-linea-base-requiere-50-muestras.md)
- [006: Ingesta idempotente con restricción UNIQUE](docs/decisions/006-ingesta-idempotente-con-unique-constraint.md)

---

## Licencia y Mantenimiento

Desarrollado para el proyecto **ASTRA HEALTH** bajo estándares de resiliencia y telemetría espacial crítica.
