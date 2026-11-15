# Prompt para IA: Desarrollo del Backend Flask + SQLite del Sistema ASTRA HEALTH

## Contexto y Rol

Actúa como un **ingeniero de software senior** con experiencia en:

- Desarrollo de APIs REST con **Flask** (Python 3.11+).
- Diseño de bases de datos relacionales con **SQLite**.
- **Seguridad de APIs**: autenticación, autorización, validación de entrada, rate limiting, protección contra inyección SQL y XSS.
- Sistemas de monitoreo en tiempo real con requisitos de **alta disponibilidad y tolerancia a fallos**.
- Buenas prácticas de código: modularidad, separación de responsabilidades, documentación y pruebas.

Tu tarea es implementar el **backend completo** de un sistema de monitoreo de salud para astronautas llamado **ASTRA HEALTH**. El backend recibe datos de sensores desde un ESP32 (simulado en la demo), los almacena en SQLite, genera alertas y guías basadas en reglas médicas, y expone una API segura que una app en Raspberry Pi consume para mostrar el estado del astronauta y guiarlo en la toma de decisiones.

**Restricciones del entorno:**

- Lenguaje: **Python 3.11+**.
- Framework: **Flask 3.x**.
- Base de datos: **SQLite** (sin servidor externo).
- Sin dependencias de servicios en la nube.
- El sistema debe funcionar **offline** (sin Internet).
- La demo se ejecuta en una laptop o Raspberry Pi; no hay infraestructura de producción.

---

## Documentación Obligatoria (Requisito Transversal)

**Toda la documentación debe ser detallada y exhaustiva.** Este es un requisito no negociable del proyecto. Cada archivo, cada función, cada decisión de diseño y cada medida de seguridad debe estar documentada de forma que un ingeniero externo pueda entender el sistema completo sin necesidad de preguntar al autor.

### Documentación en el Código

- **Docstrings obligatorios** en todas las funciones, clases y módulos. Formato Google Style o reStructuredText.
- Cada docstring debe incluir:
  - **Propósito** de la función (qué hace y por qué existe).
  - **Parámetros** con tipo y descripción.
  - **Valor de retorno** con tipo y descripción.
  - **Excepciones** que puede lanzar.
  - **Ejemplo de uso** cuando aplique.
  - **Notas de seguridad** si la función maneja datos sensibles.
- **Comentarios inline** en cada bloque de lógica no trivial. Explicar el **por qué**, no el **qué** (el qué ya lo dice el código).
- **Comentarios de seguridad** en cada punto crítico: autenticación, validación, consultas SQL, manejo de errores.
- **Cabecera de archivo** en cada `.py` con: propósito del módulo, autor, versión, dependencias y advertencias si aplica.

### Documentación Externa

Además del `README.md`, genera los siguientes documentos en la carpeta `docs/`:

| Documento | Contenido |
|-----------|-----------|
| `docs/ARCHITECTURE.md` | Diagrama de arquitectura, flujo de datos, decisiones de diseño justificadas |
| `docs/API.md` | Referencia completa de cada endpoint: método, URL, headers, body, respuesta, códigos de error, ejemplos de curl |
| `docs/SECURITY.md` | Cada medida de seguridad implementada, por qué se eligió, cómo se prueba, y qué ataque mitiga |
| `docs/DATABASE.md` | Esquema completo de cada tabla, índices, restricciones, y justificación de cada decisión |
| `docs/RULES.md` | Todas las reglas de alertas y guías, con justificación médica y referencia a riesgos de NASA |
| `docs/DEPLOYMENT.md` | Cómo instalar, configurar, generar API keys, arrancar el servidor, y verificar que funciona |
| `docs/TESTING.md` | Cómo ejecutar las pruebas, qué cubre cada una, y cómo interpretar los resultados |
| `docs/TROUBLESHOOTING.md` | Problemas comunes y soluciones (puerto ocupado, base de datos bloqueada, API key inválida, etc.) |

### Documentación de Decisiones (ADR)

Crea `docs/decisions/` con un archivo por cada decisión arquitectónica importante, siguiendo el formato **ADR (Architecture Decision Record)**:

```
docs/decisions/
├── 001-usar-sqlite-en-lugar-de-postgresql.md
├── 002-api-keys-en-lugar-de-jwt.md
├── 003-rate-limiting-en-memoria.md
├── 004-reglas-absolutas-prioritarias-sobre-desviacion.md
├── 005-linea-base-requiere-50-muestras.md
└── 006-ingesta-idempotente-con-unique-constraint.md
```

Cada ADR debe incluir:

- **Título** y **fecha**.
- **Contexto**: qué situación motivó la decisión.
- **Decisión**: qué se eligió y por qué.
- **Alternativas consideradas**: qué otras opciones había y por qué se descartaron.
- **Consecuencias**: qué implica esta decisión (ventajas, desventajas, riesgos).
- **Referencias**: enlaces o documentos que respaldan la decisión.

---

## Objetivo del Backend

Construir una API REST segura, modular y **exhaustivamente documentada** que:

1. **Reciba** lotes de lecturas fisiológicas y ambientales desde el ESP32/traje.
2. **Almacene** los datos en SQLite con protección contra duplicados (ingesta idempotente).
3. **Genere alertas y guías** basadas en reglas absolutas y en la línea base individual del astronauta.
4. **Exponga** endpoints para que la app en Raspberry Pi consulte estado, historial, alertas y notas.
5. **Registre** notas del astronauta enviadas desde la app.
6. **Sea seguro** contra los ataques más comunes en APIs REST.
7. **Sea tolerante a fallos**: si un sensor falla o un dato es inválido, el sistema sigue operando.
8. **Esté documentado** de forma que cualquier ingeniero pueda entenderlo, mantenerlo y extenderlo.

---

## Arquitectura y Estructura del Proyecto

Genera la siguiente estructura de archivos y carpetas:

```
backend/
├── app.py                  # Punto de entrada Flask (factory pattern)
├── config.py               # Configuración centralizada (incluye secretos)
├── database.py             # Conexión SQLite y utilidades
├── schema.sql              # Esquema de la base de datos
├── rules.py                # Reglas de alertas y guías
├── security.py             # Autenticación, rate limiting, headers
├── validators.py           # Validación de payloads con esquemas
├── logging_config.py       # Configuración de logging
├── generate_api_key.py     # Script para generar claves
├── routes/
│   ├── __init__.py
│   ├── readings.py         # POST/GET de lecturas
│   ├── astronauts.py       # Estado y astronautas
│   ├── alerts.py           # Alertas y acknowledge
│   └── notes.py            # Notas del astronauta
├── tests/
│   ├── conftest.py         # Fixtures compartidos
│   ├── test_readings.py
│   ├── test_astronauts.py
│   ├── test_alerts.py
│   └── test_security.py
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SECURITY.md
│   ├── DATABASE.md
│   ├── RULES.md
│   ├── DEPLOYMENT.md
│   ├── TESTING.md
│   ├── TROUBLESHOOTING.md
│   └── decisions/
│       ├── 001-usar-sqlite-en-lugar-de-postgresql.md
│       ├── 002-api-keys-en-lugar-de-jwt.md
│       ├── 003-rate-limiting-en-memoria.md
│       ├── 004-reglas-absolutas-prioritarias-sobre-desviacion.md
│       ├── 005-linea-base-requiere-50-muestras.md
│       └── 006-ingesta-idempotente-con-unique-constraint.md
├── logs/                   # Se crea automáticamente
├── data/
│   └── astra_health.db     # Se crea automáticamente
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## Requisitos Funcionales Detallados

### 1. Base de Datos (SQLite)

Crea el archivo `schema.sql` con las siguientes tablas, **todas con índices apropiados**:

| Tabla | Propósito | Restricciones clave |
|-------|-----------|---------------------|
| `lecturas` | Lecturas de sensores | `UNIQUE(astronaut_id, ts, variable)` para idempotencia |
| `alertas` | Alertas generadas | Campo `severidad` limitado a `'info'`, `'warning'`, `'critical'` |
| `notas` | Notas del astronauta | — |
| `nodos` | Estado de cada traje | `astronaut_id` como PK |
| `linea_base` | Promedios históricos | `PK(astronaut_id, variable)` |
| `api_keys` | Claves de API hasheadas | Solo se guarda el hash, nunca la clave en texto plano |

**Requisitos de la base de datos:**

- Habilitar `PRAGMA foreign_keys = ON` y `PRAGMA journal_mode = WAL` para mejor concurrencia.
- Usar `INSERT OR IGNORE` para lecturas duplicadas.
- Incluir un script de inicialización (`init_db()`) que cree las tablas si no existen.
- Insertar datos de seed: un astronauta de demo (`astro-01`) en la tabla `nodos`.

**Documentación obligatoria de la base de datos:**

- Cada tabla debe tener un comentario SQL (`--`) explicando su propósito.
- Cada columna debe tener un comentario explicando qué representa y por qué existe.
- Cada índice debe tener un comentario justificando por qué se creó (qué consulta acelera).
- Cada restricción (`UNIQUE`, `FOREIGN KEY`, `CHECK`) debe tener un comentario explicando qué previene.

### 2. Recepción de lecturas (`POST /api/readings`)

**Contrato:**

```json
// Request
{
  "astronaut_id": "astro-01",
  "readings": [
    {"ts": 1712345678, "variable": "heart_rate", "value": 72, "quality": "ok"},
    {"ts": 1712345678, "variable": "spo2", "value": 98, "quality": "ok"}
  ]
}

// Response 200
{
  "recibidas": 2,
  "duplicadas": 0,
  "alertas_generadas": 0,
  "status": "ok"
}
```

**Reglas de negocio:**

- Validar que `astronaut_id` exista en `nodos` (o crearlo automáticamente si es el primero).
- Validar que `variable` esté en la lista permitida: `heart_rate`, `spo2`, `temperature`, `radiation_cpm`, `activity`.
- Validar que `value` sea numérico y esté en un rango físicamente posible (ej. `spo2` entre 0 y 100, `heart_rate` entre 0 y 300).
- Validar que `ts` no sea futuro (máximo +5 minutos de tolerancia por desfase de reloj).
- Rechazar lotes de más de 500 lecturas (protección contra abuso).
- Actualizar `nodos.ultimo_contacto` y `nodos.estado_conexion = 'online'`.
- Evaluar reglas y generar alertas (ver sección 3).
- Recalcular línea base de cada variable afectada.

### 3. Reglas de Alertas y Guías (`rules.py`)

Implementa dos tipos de reglas:

#### Reglas absolutas (no requieren historial)

| Variable | Condición | Severidad | Guía al astronauta |
|----------|-----------|-----------|-------------------|
| `heart_rate` | > 130 | critical | "Detén toda actividad. Siéntate. Contacta al equipo médico en Tierra inmediatamente." |
| `heart_rate` | 100 < v ≤ 130 | warning | "Siéntate y descansa 5 minutos. Vuelve a medir. Si persiste, contacta al cirujano de vuelo." |
| `spo2` | < 90 | critical | "Siéntate, respira profundo. Verifica el ajuste de la mascarilla. Contacta al equipo médico." |
| `spo2` | 90 ≤ v < 94 | warning | "Respira profundo, verifica mascarilla. Mide de nuevo en 5 minutos." |
| `temperature` | > 38.5 | critical | "Bebe agua, descansa. Contacta al equipo médico. No realices actividad física." |
| `temperature` | 37.5 < v ≤ 38.5 | warning | "Posible fiebre. Bebe agua, descansa, mide de nuevo en 30 minutos." |
| `radiation_cpm` | > 100 | critical | "Dirígete al módulo de mayor blindaje. Registra el evento. Contacta a Tierra." |
| `radiation_cpm` | 50 < v ≤ 100 | warning | "Limita el tiempo en zonas expuestas. Monitorea la dosis acumulada." |

#### Reglas por desviación de línea base

- Solo se aplican si la variable tiene al menos **50 muestras** en `linea_base`.
- Calcular `z = |valor - promedio| / desviacion` (usar `desviacion = 1.0` si es 0).
- Si `z > 4`: severidad `critical`, mensaje "variable muy fuera de tu línea base", guía de contactar al médico.
- Si `z > 2`: severidad `warning`, mensaje "variable fuera de tu línea base", guía de descansar y volver a medir.
- Si no se cumple nada: no generar alerta.

**Importante:** Las reglas absolutas tienen prioridad. Si una lectura dispara una regla absoluta, no se evalúa la desviación para evitar duplicar alertas.

**Documentación obligatoria de reglas:**

Cada regla debe estar documentada con:

- **Justificación médica**: por qué ese umbral (referencia a literatura o a riesgos de NASA).
- **Referencia al riesgo de NASA**: qué riesgo del Human Research Program aborda.
- **Consecuencia de no actuar**: qué podría pasar si el astronauta ignora la guía.
- **Limitaciones**: qué casos no cubre esta regla.

### 4. Endpoints de consulta

Implementa estos endpoints con los contratos exactos:

| Método | Endpoint | Descripción | Respuesta |
|--------|----------|-------------|-----------|
| `GET` | `/api/health` | Healthcheck | `{"status":"ok","service":"astra-health-backend"}` |
| `GET` | `/api/astronauts` | Lista astronautas con estado calculado según timeout | Array de astronautas |
| `GET` | `/api/astronauts/{id}/status` | **Endpoint principal de la app** | Estado consolidado con guía |
| `GET` | `/api/astronauts/{id}/readings` | Historial filtrable (`?variable&hours&limit`) | Array de lecturas |
| `GET` | `/api/astronauts/{id}/alerts` | Alertas del astronauta | Array de alertas |
| `POST` | `/api/alerts/{id}/acknowledge` | Marcar alerta como reconocida | `{"status":"ok"}` |
| `POST` | `/api/astronauts/{id}/notes` | Crear nota del astronauta | `{"nota_id": N}` |
| `GET` | `/api/astronauts/{id}/notes` | Listar notas | Array de notas |

**Respuesta de `/status` (contrato exacto):**

```json
{
  "astronaut_id": "astro-01",
  "nombre": "Astronauta Demo",
  "estado_general": "warning",
  "estado_conexion": "online",
  "ultimo_contacto": 1712345700,
  "lecturas": [
    {"variable": "heart_rate", "valor": 108, "ts": 1712345695, "calidad": "ok"}
  ],
  "alertas_activas": [
    {
      "id": 12,
      "ts": 1712345695,
      "variable": "heart_rate",
      "valor": 108,
      "severidad": "warning",
      "mensaje": "Frecuencia cardíaca elevada",
      "guia": "Siéntate y descansa 5 minutos..."
    }
  ],
  "linea_base": [
    {"variable": "heart_rate", "promedio": 74.2, "desviacion": 5.1, "muestras": 80}
  ],
  "guia_actual": {
    "mensaje": "Frecuencia cardíaca elevada",
    "guia": "Siéntate y descansa 5 minutos..."
  }
}
```

**Reglas para `estado_general`:**

- `critical` si hay al menos una alerta `critical` activa.
- `warning` si hay al menos una alerta `warning` activa (y ninguna critical).
- `normal` si no hay alertas activas.

**Reglas para `estado_conexion`:**

- `online` si `ultimo_contacto` está dentro del timeout (60 segundos por defecto).
- `offline` en caso contrario.

**Documentación obligatoria de endpoints:**

Cada endpoint debe tener en `docs/API.md`:

- Descripción del propósito.
- Método HTTP y URL completa.
- Headers requeridos (incluyendo `X-API-Key`).
- Parámetros de path, query y body con tipos y validaciones.
- Ejemplo de request con `curl`.
- Ejemplo de response exitosa.
- Todos los códigos de error posibles con su significado.
- Notas de seguridad específicas del endpoint.

### 5. Seguridad (Requisito Obligatorio)

Implementa las siguientes medidas en `security.py`:

#### 5.1 Autenticación con API Keys

- Cada cliente (ESP32 y app en Raspberry Pi) debe autenticarse con una **API key** enviada en el header `X-API-Key`.
- Las API keys se almacenan **hasheadas** en la tabla `api_keys` usando `hashlib.sha256` o `bcrypt`.
- Nunca se guarda la clave en texto plano.
- Crear un script de generación de claves (`generate_api_key.py`) que:
  - Genere una clave aleatoria con `secrets.token_urlsafe(32)`.
  - La guarde hasheada en la base de datos con un nombre descriptivo (ej. `"esp32-demo"`, `"app-pi"`).
  - Imprima la clave en texto plano **una sola vez** para que el usuario la copie.
- Implementar un decorador `@require_api_key` que valide el header antes de permitir el acceso.
- Endpoints protegidos: todos excepto `/api/health`.
- Si falta la clave o es inválida: retornar `401 Unauthorized` con `{"error": "API key inválida o ausente"}`.

#### 5.2 Rate Limiting

- Implementar rate limiting **en memoria** (sin dependencias externas como Redis) usando un diccionario que mapee `api_key` a un contador con ventana deslizante.
- Límite sugerido: **100 requests por minuto por API key**.
- Si se excede: retornar `429 Too Many Requests` con `{"error": "Rate limit excedido", "retry_after": N}`.
- Implementarlo como decorador `@rate_limit(max_requests=100, window_seconds=60)`.

#### 5.3 Validación de Entrada

- Usar **esquemas de validación** en `validators.py` sin depender de librerías externas (implementación manual con funciones).
- Validar:
  - Tipos de datos (`int`, `float`, `str`).
  - Rangos numéricos físicamente posibles.
  - Longitudes máximas de strings (ej. `texto` de nota máximo 500 caracteres).
  - Que `astronaut_id` coincida con un patrón seguro (`^[a-zA-Z0-9_-]{1,32}$`).
  - Que `variable` esté en la lista blanca.
- Rechazar payloads malformados con `400 Bad Request` y mensaje descriptivo.

#### 5.4 Protección contra Inyección SQL

- **Todas** las consultas deben usar **parámetros vinculados** (`?`), nunca concatenación de strings.
- Prohibido usar f-strings o `%` para construir SQL.
- Ejemplo correcto: `conn.execute("SELECT * FROM lecturas WHERE astronaut_id = ?", (astronaut_id,))`.

#### 5.5 Protección contra XSS

- Aunque la API devuelve JSON (no HTML), sanitizar los campos de texto libre (notas del astronauta) eliminando caracteres de control y limitando longitud.
- Escapar caracteres HTML en las notas antes de almacenarlas o al menos al devolverlas (usar `html.escape`).

#### 5.6 Headers de Seguridad

Añadir un `after_request` handler que incluya:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'none'`
- `Strict-Transport-Security` (solo si se usa HTTPS, comentado para demo local)
- `Cache-Control: no-store` en endpoints que devuelven datos sensibles.

#### 5.7 Manejo Seguro de Errores

- No exponer trazas de error al cliente. Usar `@app.errorhandler` para capturar excepciones y devolver mensajes genéricos.
- Registrar errores internamente con `logging` (nivel `ERROR`) sin incluir datos sensibles.
- Nunca devolver `str(exception)` al cliente en producción.

#### 5.8 Configuración Segura

- Usar variables de entorno (`.env`) para secretos, nunca hardcodearlos en `config.py`.
- Incluir `.env.example` con las variables necesarias y valores de ejemplo.
- Añadir `.gitignore` que excluya `.env` y `data/*.db`.

**Documentación obligatoria de seguridad:**

En `docs/SECURITY.md`, para **cada medida** implementada, documenta:

- **Qué hace** la medida (descripción técnica).
- **Qué ataque mitiga** (con nombre técnico: SQL injection, XSS, CSRF, brute force, etc.).
- **Cómo se implementó** (referencia al archivo y función).
- **Cómo se prueba** (comando o test específico).
- **Limitaciones** (qué no cubre esta medida).
- **Referencias** (OWASP, CWE, o documentación oficial).

### 6. Manejo de Errores y Tolerancia a Fallos

- Si un sensor falla (calidad `'sensor_fault'`), registrar la lectura pero **no evaluar reglas** para esa variable.
- Si el ESP32 envía un lote con lecturas inválidas mezcladas con válidas, procesar las válidas y reportar las inválidas en la respuesta:

```json
{
  "recibidas": 3,
  "duplicadas": 0,
  "invalidas": 1,
  "alertas_generadas": 1,
  "status": "ok"
}
```

- Si la base de datos está bloqueada, reintentar hasta 3 veces con backoff exponencial (50ms, 100ms, 200ms).
- Si el backend no puede procesar un lote completo, no debe dejar datos a medias: usar transacciones (`with get_db() as conn` ya lo hace).

**Documentación obligatoria de errores:**

En `docs/API.md`, documenta cada código de error posible (400, 401, 404, 429, 500) con:

- Cuándo ocurre.
- Qué mensaje devuelve.
- Qué debe hacer el cliente al recibirlo.
- Ejemplo de respuesta.

### 7. Logging

- Configurar `logging` con dos handlers: consola (nivel `INFO`) y archivo rotativo (`logs/backend.log`, nivel `WARNING`).
- Registrar:
  - Cada request recibido (método, endpoint, IP, API key usada — solo el nombre, no el valor).
  - Cada alerta generada.
  - Errores con stack trace completo en el archivo (no en la respuesta al cliente).
- **No registrar** datos sensibles: valores fisiológicos completos, API keys en texto plano, ni notas del astronauta.

**Documentación obligatoria de logging:**

En `docs/DEPLOYMENT.md`, documenta:

- Qué se registra y qué no (y por qué).
- Dónde están los logs.
- Cómo rotarlos.
- Cómo interpretar los niveles (`INFO`, `WARNING`, `ERROR`).
- Ejemplo de cada tipo de entrada de log.

### 8. Pruebas

Incluye pruebas con `pytest` en `tests/`:

| Archivo | Qué prueba |
|---------|-----------|
| `test_readings.py` | Ingesta idempotente, validación de payloads, rangos físicos |
| `test_astronauts.py` | Cálculo de estado general, estado de conexión, historial |
| `test_alerts.py` | Generación de alertas por reglas absolutas y por desviación, acknowledge |
| `test_security.py` | API key ausente/inválida, rate limiting, headers de seguridad, inyección SQL |

Cada test debe usar una base de datos temporal (`:memory:` o archivo temporal) y limpiar después.

**Documentación obligatoria de pruebas:**

En `docs/TESTING.md`, documenta:

- Cómo ejecutar las pruebas (`pytest -v`, `pytest --cov`).
- Qué cubre cada archivo de test (lista de casos).
- Qué **no** cubren las pruebas (limitaciones conocidas).
- Cómo agregar una nueva prueba (plantilla).
- Cómo interpretar fallos.

---

## Requisitos No Funcionales

| Aspecto | Requisito |
|---------|-----------|
| **Rendimiento** | Procesar un lote de 100 lecturas en < 500ms |
| **Concurrencia** | Soportar al menos 2 clientes (ESP32 + app) simultáneamente sin bloqueos |
| **Portabilidad** | Funcionar en Linux, macOS y Raspberry Pi OS |
| **Dependencias** | Mínimas: solo Flask, flask-cors, pytest. Nada más. |
| **Código** | PEP 8, docstrings en todas las funciones públicas, type hints en firmas |
| **Documentación** | Todos los documentos de `docs/` completos y actualizados |

---

## Entregables Esperados

1. **Código completo** de todos los archivos listados en la estructura, con docstrings y comentarios detallados.
2. **`schema.sql`** con el esquema completo, índices y comentarios justificativos.
3. **`README.md`** con:
   - Descripción general del proyecto.
   - Instalación paso a paso.
   - Cómo generar API keys.
   - Ejemplos de `curl` para cada endpoint.
   - Cómo ejecutar las pruebas.
   - Cómo arrancar el servidor.
   - Enlaces a los documentos de `docs/`.
4. **`requirements.txt`** con versiones fijas.
5. **`.env.example`** con todas las variables necesarias y comentarios explicativos.
6. **`.gitignore`** que excluya `.env`, `data/*.db`, `logs/`, `__pycache__/`, `.pytest_cache/`.
7. **Script `generate_api_key.py`** funcional y documentado.
8. **Pruebas** que cubran los casos listados y que pasen con `pytest`.
9. **Todos los documentos de `docs/`** completos: ARCHITECTURE, API, SECURITY, DATABASE, RULES, DEPLOYMENT, TESTING, TROUBLESHOOTING.
10. **Todos los ADRs** en `docs/decisions/` completos.
11. **Comentarios en el código** explicando las decisiones de seguridad en cada punto crítico.

---

## Criterios de Aceptación

El backend se considera completo cuando:

### Funcionalidad
- [ ] Todos los endpoints responden con los contratos exactos especificados.
- [ ] La ingesta es idempotente: enviar el mismo lote dos veces no genera duplicados.
- [ ] Las reglas absolutas generan alertas correctas para cada umbral.
- [ ] Las reglas por desviación solo se activan con ≥50 muestras.
- [ ] El servidor arranca sin errores y responde en `/api/health`.
- [ ] Las pruebas pasan con `pytest -v`.

### Seguridad
- [ ] Un request sin API key retorna `401`.
- [ ] Un request con API key inválida retorna `401`.
- [ ] Exceder el rate limit retorna `429`.
- [ ] Un payload con datos inválidos retorna `400` con mensaje claro.
- [ ] Un intento de inyección SQL (ej. `astronaut_id = "'; DROP TABLE lecturas; --"`) es rechazado por el validador y no afecta la base de datos.
- [ ] Los headers de seguridad están presentes en todas las respuestas.
- [ ] Las API keys se almacenan hasheadas, nunca en texto plano.
- [ ] Los errores internos no exponen stack traces al cliente.

### Documentación
- [ ] Cada función tiene docstring con propósito, parámetros, retorno, excepciones y notas de seguridad.
- [ ] Cada archivo `.py` tiene cabecera con propósito, autor, versión y dependencias.
- [ ] Cada tabla, columna, índice y restricción en `schema.sql` tiene comentario justificativo.
- [ ] `docs/ARCHITECTURE.md` explica el flujo de datos y las decisiones de diseño.
- [ ] `docs/API.md` documenta cada endpoint con ejemplos de curl y códigos de error.
- [ ] `docs/SECURITY.md` documenta cada medida con ataque mitigado, implementación, prueba y limitaciones.
- [ ] `docs/DATABASE.md` documenta el esquema completo con justificación.
- [ ] `docs/RULES.md` documenta cada regla con justificación médica y referencia a riesgos de NASA.
- [ ] `docs/DEPLOYMENT.md` permite a alguien sin contexto levantar el backend en < 10 minutos.
- [ ] `docs/TESTING.md` explica cómo ejecutar y agregar pruebas.
- [ ] `docs/TROUBLESHOOTING.md` cubre al menos 10 problemas comunes con solución.
- [ ] Cada ADR en `docs/decisions/` sigue el formato completo (contexto, decisión, alternativas, consecuencias).
- [ ] El `README.md` enlaza a todos los documentos y permite entender el proyecto en < 5 minutos.

---

## Notas Finales para la IA

- **La documentación es tan importante como el código.** Un endpoint sin documentación se considera incompleto.
- **Prioriza seguridad sobre elegancia.** Un endpoint que funciona pero es vulnerable es peor que uno simple y seguro.
- **No agregues funcionalidades no solicitadas.** Si algo no está en este prompt, no lo implementes.
- **Documenta cada decisión de seguridad** con un comentario breve en el código y en detalle en `docs/SECURITY.md`.
- **Maneja los errores con gracia.** El sistema debe seguir funcionando si un sensor falla, si un dato es inválido, o si un cliente envía basura.
- **Escribe código que otro ingeniero pueda entender en 5 minutos.** Nombres claros, funciones cortas, responsabilidades separadas.
- **Incluye un ejemplo de `.env` funcional** que permita arrancar el servidor sin configuración adicional (excepto generar la primera API key).
- **Cada ADR debe ser honesto:** si una decisión tiene desventajas, documéntalas. No vendas la decisión como perfecta.
- **Los documentos de `docs/` deben estar escritos para alguien que no conoce el proyecto.** No asumas contexto previo.

Genera el código completo y la documentación completa, archivo por archivo, listo para copiar y ejecutar.