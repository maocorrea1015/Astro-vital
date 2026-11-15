# Referencia Completa de la API REST - ASTRA HEALTH

Esta documentación describe todos los endpoints provistos por el backend de ASTRA HEALTH.

---

## Índice de Endpoints

1. [GET /api/health](#1-get-apihealth) (Público)
2. [POST /api/readings](#2-post-apireadings) (Ingesta de Telemetría)
3. [GET /api/astronauts](#3-get-apiastronauts) (Listado de Tripulantes)
4. [GET /api/astronauts/{id}/status](#4-get-apiastronautsidstatus) (Estado Consolidado)
5. [GET /api/astronauts/{id}/readings](#5-get-apiastronautsidreadings) (Histórico de Lecturas)
6. [GET /api/astronauts/{id}/alerts](#6-get-apiastronautsidalerts) (Historial de Alertas)
7. [POST /api/alerts/{id}/acknowledge](#7-post-apialertsidacknowledge) (Reconocer Alerta)
8. [POST /api/astronauts/{id}/notes](#8-post-apiastronautsidnotes) (Registrar Nota)
9. [GET /api/astronauts/{id}/notes](#9-get-apiastronautsidnotes) (Listar Notas)

---

## Convenciones Globales

### Autenticación
Todos los endpoints operativos (excepto `/api/health`) requieren la cabecera:
```http
X-API-Key: <clave_secreta_del_cliente>
```
Si la clave es ausente o no coincide con ningún hash activo en el sistema, se retorna:
```json
HTTP/1.1 401 Unauthorized
{
  "error": "API key inválida o ausente"
}
```

### Rate Limiting
La API impone un límite en memoria de **100 peticiones por minuto por API key**. En caso de rebasar la tasa, la respuesta será:
```json
HTTP/1.1 429 Too Many Requests
Retry-After: 42
{
  "error": "Rate limit excedido",
  "retry_after": 42
}
```
*Acción del cliente*: Detener peticiones y reintentar transcurrido el número de segundos indicado en `Retry-After`.

---

## 1. GET /api/health

### Propósito
Comprobación de conectividad y estado operacional básico del servicio (Healthcheck). No requiere autenticación.

- **Método**: `GET`
- **URL**: `/api/health`
- **Headers requeridos**: Ninguno.

### Ejemplo de Request (cURL)
```bash
curl -X GET http://localhost:5000/api/health
```

### Respuesta Exitosa (200 OK)
```json
{
  "service": "astra-health-backend",
  "status": "ok"
}
```

---

## 2. POST /api/readings

### Propósito
Recibe un lote de lecturas de sensores telemétricos emitidos por el traje espacial o dispositivo del astronauta. Ingesta de forma idempotente, evalúa reglas clínicas y recalcula líneas base.

- **Método**: `POST`
- **URL**: `/api/readings`
- **Headers requeridos**:
  - `X-API-Key: <token>`
  - `Content-Type: application/json`

### Parámetros del Body (JSON)
| Campo | Tipo | Requerido | Descripción / Validación |
|-------|------|-----------|--------------------------|
| `astronaut_id` | String | Sí | Identificador seguro (`^[a-zA-Z0-9_-]{1,32}$`). |
| `readings` | Array[Object] | Sí | Lista de 1 a 500 lecturas. |
| `readings[].ts` | Integer | Sí | Marca de tiempo UNIX en segundos (máx +5 min respecto al servidor). |
| `readings[].variable` | String | Sí | Uno de: `heart_rate`, `spo2`, `temperature`, `radiation_cpm`, `activity`. |
| `readings[].value` | Number | Sí | Valor numérico dentro del rango físico biológico permitido. |
| `readings[].quality` | String | No | Calidad del transductor: `ok`, `degraded`, `sensor_fault`. (Default: `ok`). |

### Ejemplo de Request (cURL)
```bash
curl -X POST http://localhost:5000/api/readings \
  -H "X-API-Key: tu_api_key_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "astronaut_id": "astro-01",
    "readings": [
      {"ts": 1712345678, "variable": "heart_rate", "value": 72, "quality": "ok"},
      {"ts": 1712345678, "variable": "spo2", "value": 98, "quality": "ok"}
    ]
  }'
```

### Respuesta Exitosa (200 OK)
```json
{
  "recibidas": 2,
  "duplicadas": 0,
  "invalidas": 0,
  "alertas_generadas": 0,
  "status": "ok"
}
```

### Códigos de Error
- **400 Bad Request**: Estructura de lote inválida, lote mayor a 500 muestras o `astronaut_id` con caracteres ilegales.
- **401 Unauthorized**: Falta o invalidez de la clave `X-API-Key`.
- **429 Too Many Requests**: Tasa de peticiones excedida.
- **500 Internal Server Error**: Fallo inesperado en base de datos.

---

## 3. GET /api/astronauts

### Propósito
Retorna el catálogo de astronautas y trajes con su conectividad calculada (`online` u `offline` según timeout de 60s) y su estado clínico consolidado (`normal`, `warning`, `critical`).

- **Método**: `GET`
- **URL**: `/api/astronauts`
- **Headers requeridos**: `X-API-Key: <token>`

### Ejemplo de Request (cURL)
```bash
curl -X GET http://localhost:5000/api/astronauts \
  -H "X-API-Key: tu_api_key_aqui"
```

### Respuesta Exitosa (200 OK)
```json
[
  {
    "astronaut_id": "astro-01",
    "nombre": "Astronauta Demo",
    "estado_general": "warning",
    "estado_conexion": "online",
    "ultimo_contacto": 1712345700
  }
]
```

---

## 4. GET /api/astronauts/{id}/status

### Propósito
Endpoint principal de la interfaz de cabina en Raspberry Pi. Ofrece la vista consolidada de última lectura por variable, alertas activas sin reconocer, línea base estadística y la guía médica prioritaria.

- **Método**: `GET`
- **URL**: `/api/astronauts/{astronaut_id}/status`
- **Headers requeridos**: `X-API-Key: <token>`

### Parámetros de Ruta (Path)
- `astronaut_id` (String): Identificador del tripulante.

### Ejemplo de Request (cURL)
```bash
curl -X GET http://localhost:5000/api/astronauts/astro-01/status \
  -H "X-API-Key: tu_api_key_aqui"
```

### Respuesta Exitosa (200 OK)
```json
{
  "astronaut_id": "astro-01",
  "nombre": "Astronauta Demo",
  "estado_general": "warning",
  "estado_conexion": "online",
  "ultimo_contacto": 1712345700,
  "lecturas": [
    {
      "variable": "heart_rate",
      "valor": 108.0,
      "ts": 1712345695,
      "calidad": "ok"
    }
  ],
  "alertas_activas": [
    {
      "id": 12,
      "ts": 1712345695,
      "variable": "heart_rate",
      "valor": 108.0,
      "severidad": "warning",
      "mensaje": "Frecuencia cardíaca elevada",
      "guia": "Siéntate y descansa 5 minutos. Vuelve a medir. Si persiste, contacta al cirujano de vuelo."
    }
  ],
  "linea_base": [
    {
      "variable": "heart_rate",
      "promedio": 74.2,
      "desviacion": 5.1,
      "muestras": 80
    }
  ],
  "guia_actual": {
    "mensaje": "Frecuencia cardíaca elevada",
    "guia": "Siéntate y descansa 5 minutos. Vuelve a medir. Si persiste, contacta al cirujano de vuelo."
  }
}
```

### Códigos de Error
- **400 Bad Request**: Identificador de astronauta con formato malicioso.
- **404 Not Found**: Astronauta no registrado en el sistema.

---

## 5. GET /api/astronauts/{id}/readings

### Propósito
Consulta de series temporales históricas con filtros opcionales.

- **Método**: `GET`
- **URL**: `/api/astronauts/{astronaut_id}/readings`
- **Query Parameters**:
  - `variable` (String, opcional): Filtrar métrica específica (`heart_rate`, `spo2`, etc.).
  - `hours` (Float, opcional): Ventana temporal en horas hacia atrás (default: `24`, máx: `720`).
  - `limit` (Integer, opcional): Cantidad máxima de registros (default: `100`, máx: `1000`).

### Ejemplo de Request (cURL)
```bash
curl -X GET "http://localhost:5000/api/astronauts/astro-01/readings?variable=heart_rate&hours=6&limit=50" \
  -H "X-API-Key: tu_api_key_aqui"
```

### Respuesta Exitosa (200 OK)
```json
[
  {
    "id": 45,
    "astronaut_id": "astro-01",
    "ts": 1712345695,
    "variable": "heart_rate",
    "valor": 72.0,
    "calidad": "ok"
  }
]
```

---

## 6. GET /api/astronauts/{id}/alerts

### Propósito
Historial de contingencias y alertas clínicas asociadas al tripulante.

- **Método**: `GET`
- **URL**: `/api/astronauts/{astronaut_id}/alerts`
- **Query Parameters**:
  - `reconocida` (Integer, opcional): `0` para alertas pendientes, `1` para confirmadas.
  - `limit` (Integer, opcional): Límite de registros (default: `50`, máx: `500`).

### Ejemplo de Request (cURL)
```bash
curl -X GET "http://localhost:5000/api/astronauts/astro-01/alerts?reconocida=0" \
  -H "X-API-Key: tu_api_key_aqui"
```

### Respuesta Exitosa (200 OK)
```json
[
  {
    "id": 12,
    "astronaut_id": "astro-01",
    "ts": 1712345695,
    "variable": "heart_rate",
    "valor": 108.0,
    "severidad": "warning",
    "mensaje": "Frecuencia cardíaca elevada",
    "guia": "Siéntate y descansa 5 minutos. Vuelve a medir. Si persiste, contacta al cirujano de vuelo.",
    "reconocida": 0,
    "reconocida_en": null,
    "creado_en": 1712345700
  }
]
```

---

## 7. POST /api/alerts/{id}/acknowledge

### Propósito
Marca una alerta activa como atendida o reconocida por el astronauta o el médico.

- **Método**: `POST`
- **URL**: `/api/alerts/{alert_id}/acknowledge`
- **Headers requeridos**: `X-API-Key: <token>`

### Ejemplo de Request (cURL)
```bash
curl -X POST http://localhost:5000/api/alerts/12/acknowledge \
  -H "X-API-Key: tu_api_key_aqui"
```

### Respuesta Exitosa (200 OK)
```json
{
  "status": "ok"
}
```

### Códigos de Error
- **404 Not Found**: Identificador de alerta no encontrado.

---

## 8. POST /api/astronauts/{id}/notes

### Propósito
Permite registrar una observación cualitativa, síntoma subjetivo o reporte de bitácora. El texto es saneado automáticamente contra XSS.

- **Método**: `POST`
- **URL**: `/api/astronauts/{astronaut_id}/notes`
- **Headers requeridos**:
  - `X-API-Key: <token>`
  - `Content-Type: application/json`

### Body (JSON)
```json
{
  "texto": "Siento ligera cefalea tras la presurización del módulo.",
  "ts": 1712345695 // Opcional
}
```

### Ejemplo de Request (cURL)
```bash
curl -X POST http://localhost:5000/api/astronauts/astro-01/notes \
  -H "X-API-Key: tu_api_key_aqui" \
  -H "Content-Type: application/json" \
  -d '{"texto": "Siento ligera cefalea tras la presurización del módulo."}'
```

### Respuesta Exitosa (201 Created)
```json
{
  "nota_id": 1
}
```

---

## 9. GET /api/astronauts/{id}/notes

### Propósito
Recupera la lista de notas de bitácora registradas para el astronauta en orden cronológico descendente.

- **Método**: `GET`
- **URL**: `/api/astronauts/{astronaut_id}/notes`
- **Headers requeridos**: `X-API-Key: <token>`

### Ejemplo de Request (cURL)
```bash
curl -X GET http://localhost:5000/api/astronauts/astro-01/notes \
  -H "X-API-Key: tu_api_key_aqui"
```

### Respuesta Exitosa (200 OK)
```json
[
  {
    "id": 1,
    "astronaut_id": "astro-01",
    "ts": 1712345695,
    "texto": "Siento ligera cefalea tras la presurización del módulo.",
    "creado_en": 1712345700
  }
]
```
