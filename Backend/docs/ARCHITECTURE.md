# Arquitectura del Sistema ASTRA HEALTH Backend

## 1. Visión General del Sistema

**ASTRA HEALTH** es una plataforma telemétrica y clínica de soporte vital y monitoreo biomédico diseñada para misiones espaciales tripuladas en entornos aislados, confinados y extremos (ICE - *Isolated, Confined, and Extreme*).

El sistema opera completamente **fuera de línea (offline)**, sin ninguna dependencia de conectividad a Internet o servicios en la nube. Procesa telemetría fisiológica y ambiental transmitida por trajes espaciales y dispositivos de monitorización continua (simulados mediante un microcontrolador ESP32), almacena las series temporales de manera idempotente en una base de datos relacional SQLite embebida, ejecuta motores de inferencia clínica para la detección temprana de eventos adversos, y expone una API REST protegida para la interfaz de tripulación alojada en una microcomputadora Raspberry Pi.

```
+-----------------------------------------------------------------------------------+
|                              ESP32 / Traje Espacial                               |
|        [ Sensores: ECG / SpO2 / Temp / Rad / Actividad ]                          |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTP POST /api/readings
                                         | Header: X-API-Key
                                         v
+-----------------------------------------------------------------------------------+
|                        ASTRA HEALTH BACKEND (Flask 3.x)                           |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Capa Perimetral y Seguridad:                                                |  |
|  | - Validación de API Key (Hash SHA-256)                                       |  |
|  | - Limitador de Tasa en Memoria (Sliding Window Thread-Safe)                  |  |
|  | - Inyección de Cabeceras HTTP de Endurecimiento                             |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|  +-----------------------------------------------------------------------------+  |
|  | Capa de Validación y Sanitización (validators.py):                          |  |
|  | - Listas blancas de variables y calidades                                    |  |
|  | - Filtro de rangos físicos y tolerancia temporal                            |  |
|  | - Sanitización XSS en bitácoras subjetivas                                  |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|  +-----------------------------------------------------------------------------+  |
|  | Motor Clínico y de Reglas (rules.py):                                       |  |
|  | - Evaluación prioritaria de umbrales absolutos médicos                      |  |
|  | - Evaluación por desviación individual Z-Score (>= 50 muestras)              |  |
|  | - Recálculo dinámico de media y desviación poblacional                      |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|  +-----------------------------------------------------------------------------+  |
|  | Capa de Persistencia Relacional (database.py / schema.sql):                 |  |
|  | - SQLite 3 con Write-Ahead Logging (WAL)                                    |  |
|  | - Ingesta idempotente con restricción UNIQUE                                |  |
|  | - Manejo de contención con reintentos exponenciales                         |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                         ^
                                         | HTTP GET / POST (Endpoints de consulta)
                                         | Header: X-API-Key
                                         |
+-----------------------------------------------------------------------------------+
|                       App de Cabina / Raspberry Pi                                |
|        [ Panel de Control Táctil / Estado Consolidado / Bitácora ]                |
+-----------------------------------------------------------------------------------+
```

---

## 2. Flujo de Datos

### 2.1 Flujo de Ingesta de Telemetría (ESP32 -> Backend)

1. **Transmisión**: El ESP32 empaqueta un lote de hasta 500 lecturas y ejecuta `POST /api/readings` enviando su credencial en el header `X-API-Key`.
2. **Autenticación y Rate Limiting**: El middleware `require_api_key` verifica el hash SHA-256 contra la tabla `api_keys`. Si la clave es válida, el decorador `rate_limit` verifica que la tasa de solicitudes no sobrepase las 100 peticiones por minuto.
3. **Validación Sintáctica y Fisiológica**: `validators.py` analiza el lote:
   - Verifica el formato del identificador de astronauta.
   - Discrimina lecturas válidas de inválidas (descartando valores fuera de rangos biológicos plausibles o con marcas temporales futuras no permitidas).
4. **Persistencia Idempotente**:
   - Se inicia una transacción atómica `BEGIN IMMEDIATE`.
   - Se actualiza el nodo en la tabla `nodos` (auto-creándolo si es nuevo).
   - Se insertan las lecturas usando `INSERT OR IGNORE INTO lecturas (...)`. Si una lectura ya fue persistida (misma tupla `astronaut_id, ts, variable`), la base de datos la ignora sin fallar, contándola como duplicada.
5. **Evaluación de Alertas Médicas**:
   - Por cada lectura válida con `calidad != 'sensor_fault'`:
     - Se evalúan las **reglas absolutas** (prioritarias).
     - Si no hay alarma absoluta y existen al menos 50 muestras históricas para la variable, se evalúa el **Z-Score** respecto a la línea base individual.
     - Si se genera una alerta, se persiste en la tabla `alertas` con `reconocida = 0`.
6. **Recálculo Estadístico**:
   - Para cada variable con nuevas lecturas válidas, se recalculan la media aritmética y la desviación estándar poblacional en `linea_base`.
7. **Actualización de Presencia**:
   - Se actualiza `nodos.ultimo_contacto` y se marca como `'online'`.
8. **Respuesta**: Se devuelve un código HTTP 200 con el balance: recibidas, duplicadas, inválidas y alertas generadas.

### 2.2 Flujo de Consulta y Soporte a la Decisión (Raspberry Pi -> Backend)

1. **Consulta de Estado Consolidado**: La interfaz táctil de la tripulación sondea periódicamente `GET /api/astronauts/{id}/status`.
2. **Cálculo de Estado en Tiempo Real**:
   - Conexión: Si `now - ultimo_contacto <= 60s`, se reporta `online`; caso contrario, `offline`.
   - Estado general: Si existen alertas activas sin reconocer, se clasifica como `critical` (si hay al menos una crítica), `warning` (si hay advertencias) o `normal`.
   - Guía de actuación prioritaria: Se extrae la recomendación médica de la alerta activa más crítica y reciente.
3. **Reconocimiento Médico (Acknowledge)**:
   - Cuando el tripulante o el cirujano atienden una alarma, la aplicación despacha `POST /api/alerts/{id}/acknowledge`.
   - El sistema actualiza `reconocida = 1` y sella la marca de tiempo `reconocida_en`.
   - El estado general del astronauta se recalcula inmediatamente.

---

## 3. Decisiones de Diseño Justificadas

### 3.1 Patrón Application Factory (`create_app`)
- **Justificación**: Permite desacoplar la creación de la aplicación Flask del ciclo de vida del proceso. Facilita la inyección de configuraciones diferenciadas para entornos de pruebas automatizadas (con bases de datos en memoria o aisladas) sin contaminar el entorno de desarrollo o producción.

### 3.2 Almacenamiento Criptográfico de Credenciales (SHA-256)
- **Justificación**: Las claves de API nunca se guardan en claro. En caso de acceso no autorizado al archivo de base de datos o volcado forense, las credenciales maestras permanecen protegidas contra reutilización.

### 3.3 Motor SQLite en Modo WAL (*Write-Ahead Logging*)
- **Justificación**: A diferencia del modo de rollback journal tradicional, WAL permite que múltiples lectores concurrentes (como la interfaz de la Raspberry Pi consultando el estado) lean sin bloquear las escrituras de alta frecuencia del ESP32.

### 3.4 Separación entre Reglas Absolutas y de Desviación
- **Justificación**: Los límites absolutos abordan fallos críticos agudos (ej. hipoxia súbita en el traje). Las reglas estadísticas detectan derivas lentas e insidiosas personalizadas. Establecer precedencia absoluta previene saturación cognitiva del astronauta por alertas redundantes.
