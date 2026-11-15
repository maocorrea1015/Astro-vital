# Guía de Despliegue, Puesta en Marcha y Logging - ASTRA HEALTH Backend

Esta guía permite a un ingeniero sin contexto previo levantar el backend de ASTRA HEALTH en menos de 10 minutos en una estación de trabajo (Windows, Linux, macOS) o en una Raspberry Pi 4/5.

---

## 1. Requisitos Previos

- **Python**: Versión 3.11 o superior (comprobado compatible con Python 3.11 a 3.14).
- **SQLite**: Versión 3.35 o superior (incluido por defecto en la biblioteca estándar de Python).
- **Entorno aislado**: No requiere conexión a Internet una vez instaladas las dependencias.

---

## 2. Instalación Paso a Paso

### Paso 1: Clonar o Situarse en el Directorio del Proyecto
```bash
cd D:/proyectos/Astro-vital/Backend
```

### Paso 2: Crear y Activar un Entorno Virtual (Recomendado)
- En Linux / macOS / Raspberry Pi OS:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```
- En Windows (PowerShell):
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```

### Paso 3: Instalar Dependencias
```bash
pip install -r requirements.txt
```

### Paso 4: Configurar Variables de Entorno
Copiar el archivo de plantilla `.env.example` como `.env`:
- En Linux / macOS:
  ```bash
  cp .env.example .env
  ```
- En Windows:
  ```powershell
  Copy-Item .env.example .env
  ```

El archivo `.env` por defecto contiene valores funcionales para desarrollo y pruebas locales.

---

## 3. Generación de API Keys de Acceso

Antes de conectar el ESP32 o la aplicación táctil, genera las credenciales de autenticación:

```bash
# 1. Clave para el simulador / traje espacial ESP32
python generate_api_key.py --name "esp32-traje-01"

# 2. Clave para la interfaz de tripulación en Raspberry Pi
python generate_api_key.py --name "app-raspberry-pi"
```

El script imprimirá en pantalla la clave en texto plano **una sola vez**:
```
======================================================================
 ASTRO-HEALTH / CREDENCIAL DE SEGURIDAD EMITIDA EXITOSAMENTE
======================================================================
 Cliente / Dispositivo : esp32-traje-01
 Hash Almacenado (SHA256) : 6a5e687175e6bff12e74b054ed423941ec70d86d...
----------------------------------------------------------------------
 CLAVE EN TEXTO PLANO (COPIAR AHORA, NO SE VOLVERÁ A MOSTRAR):
 >> zCroxPryFzE1HRYWO5xfDdYht1-I7mx9SKEnIzUdO40 <<
======================================================================
```
*Copia esta clave inmediatamente y configúrala en el cliente correspondiente.*

---

## 4. Inicialización y Arranque del Servidor

Ejecuta el servidor Flask con:
```bash
python app.py
```

Salida esperada en consola:
```
[2026-11-14 19:15:00,123] [INFO] [astra_health] [app.py:52]: Base de datos inicializada en: data/astra_health.db
[2026-11-14 19:15:00,124] [INFO] [astra_health] [app.py:108]: Iniciando ASTRA HEALTH Backend en http://0.0.0.0:5000
 * Serving Flask app 'app'
 * Debug mode: off
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
```

---

## 5. Verificación de Funcionamiento

Verifica que el servicio esté respondiendo mediante el endpoint de comprobación de salud:

```bash
curl -X GET http://localhost:5000/api/health
```

Respuesta esperada:
```json
{
  "service": "astra-health-backend",
  "status": "ok"
}
```

Prueba la consulta autenticada usando la API key generada:
```bash
curl -X GET http://localhost:5000/api/astronauts \
  -H "X-API-Key: tu_api_key_aqui"
```

---

## 6. Política de Registro (Logging)

El sistema emplea una estrategia de logging dual estructurada:

### 6.1 Qué se Registra y Qué NO se Registra (y Por Qué)

| Elemento | Se Registra | Justificación de Seguridad y Privacidad |
|----------|-------------|------------------------------------------|
| Método HTTP y Ruta de endpoint | **SÍ** | Permite auditoría de peticiones operacionales. |
| Dirección IP de origen | **SÍ** | Detección de orígenes anómalos o intentos DoS. |
| Nombre del cliente autenticado | **SÍ** (solo nombre) | Trazabilidad del dispositivo (ej. 'esp32-demo'). |
| **Claves de API en texto plano** | **NUNCA** | Evita la exposición de credenciales secretas en logs. |
| **Valores biomédicos crudos de lotes** | **NUNCA** | Protege la privacidad médica (PHI) del tripulante. |
| **Contenido textual de notas clínicas**| **NUNCA** | Garantiza la confidencialidad de la bitácora médica. |
| Stack trace de errores no controlados | **SÍ** (solo en archivo) | Diagnóstico técnico de fallos en desarrollo y mantenimiento. |

### 6.2 Ubicación y Rotación de Logs
- **Ubicación**: `logs/backend.log` (se crea automáticamente si no existe).
- **Mecanismo de Rotación**: `RotatingFileHandler` de la librería estándar de Python.
  - Tamaño máximo por archivo: **10 MB**.
  - Cantidad de archivos de respaldo retenidos: **5 archivos**.
  - Cuando `backend.log` alcanza 10 MB, pasa a ser `backend.log.1`, manteniendo hasta `backend.log.5`.

### 6.3 Interpretación de Niveles de Log
- `INFO` (Consola): Eventos operativos normales (arranque del servidor, inicialización de BD, peticiones atendidas y códigos de estado retornados).
- `WARNING` (Consola y Archivo): Eventos potencialmente anómalos, como desconexión de un nodo o alertas médicas emitidas.
- `ERROR` (Consola y Archivo): Fallos transaccionales de base de datos, excepciones no controladas o contenciones de cerrojo superadas.

### 6.4 Ejemplos de Entradas de Log

**Petición entrante y respuesta exitosa:**
```
[2026-11-14 19:20:01,452] [INFO] [astra_health] [logging_config.py:72]: Solicitud entrante: POST /api/readings | Cliente: esp32-demo | Origen IP: 192.168.1.45
[2026-11-14 19:20:01,489] [INFO] [astra_health] [logging_config.py:82]: Respuesta enviada: POST /api/readings | Status: 200 | Cliente: esp32-demo
```

**Alerta médica detonada:**
```
[2026-11-14 19:21:15,012] [WARNING] [astra_health] [rules.py:95]: ALERTA MÉDICA DISPARADA | Astronauta: astro-01 | Severidad: critical | Métrica: heart_rate | Valor: 142.0 BPM
```

**Excepción capturada con stack trace seguro:**
```
[2026-11-14 19:22:30,891] [ERROR] [astra_health] [app.py:95]: Error interno no controlado: database is locked
Traceback (most recent call last):
  File "D:\proyectos\Astro-vital\Backend\database.py", line 85, in get_db
    conn.execute("BEGIN IMMEDIATE")
sqlite3.OperationalError: database is locked
```
