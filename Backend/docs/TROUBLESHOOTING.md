# Guía de Resolución de Problemas (Troubleshooting) - ASTRA HEALTH

Esta guía cubre los 12 incidentes operacionales más frecuentes en el backend de ASTRA HEALTH y sus soluciones paso a paso.

---

## 1. Puerto 5000 Ocupado (`OSError: [Errno 98] Address already in use`)

- **Causa**: Otro proceso (otra instancia del backend, AirPlay en macOS o un servicio local) está utilizando el puerto 5000.
- **Diagnóstico**:
  - En Windows: `netstat -ano | findstr :5000`
  - En Linux/macOS: `lsof -i :5000`
- **Solución**:
  1. Detener el proceso conflictivo:
     - En Windows: `taskkill /PID <PID> /F`
     - En Linux/macOS: `kill -9 <PID>`
  2. O cambiar el puerto en `.env` especificando `PORT=5001`.

---

## 2. Base de Datos Bloqueada (`sqlite3.OperationalError: database is locked`)

- **Causa**: Múltiples procesos intentando escribir en SQLite simultáneamente superando la ventana de reintento transaccional, o un proceso previo quedó bloqueado sin cerrar su transacción.
- **Diagnóstico**: Comprobar si existen archivos `-wal` o `-shm` huérfanos con procesos zombis accediendo a `data/astra_health.db`.
- **Solución**:
  1. El backend implementa reintentos exponenciales automáticos (50ms, 100ms, 200ms). Si el fallo persiste, verificar si otro software (ej. DB Browser for SQLite) tiene la base de datos abierta en modo exclusivo.
  2. Asegurar que las conexiones se abran siempre con el context manager `with get_db() as db:` para garantizar `commit()` o `rollback()` automáticos.
  3. Cerrar herramientas externas de inspección de bases de datos.

---

## 3. Error 401 Unauthorized (`"API key inválida o ausente"`)

- **Causa**: La cabecera `X-API-Key` no se envió, tiene espacios accidentales o la clave no está registrada/activa en la tabla `api_keys`.
- **Diagnóstico**: Verificar la presencia de la cabecera exacta `X-API-Key: <token>`.
- **Solución**:
  1. Generar una nueva clave con: `python generate_api_key.py --name "cliente-debug"`.
  2. Verificar en la base de datos que la clave esté habilitada (`activa = 1`):
     ```sql
     SELECT id, nombre_cliente, activa FROM api_keys;
     ```
  3. Asegurarse de enviar el valor devuelto por el generador sin comillas extra ni espacios.

---

## 4. Error 429 Too Many Requests (`"Rate limit excedido"`)

- **Causa**: El cliente ha emitido más de 100 peticiones en menos de 60 segundos con la misma API Key.
- **Diagnóstico**: Inspeccionar la cabecera `Retry-After` retornada en la respuesta HTTP.
- **Solución**:
  1. Ajustar el cliente emisor (ESP32 o App) para empaquetar lecturas en lotes en lugar de enviar una petición por cada muestra individual.
  2. Si es necesario en desarrollo, ampliar la cuota en `.env`:
     ```env
     RATE_LIMIT_MAX_REQUESTS=500
     RATE_LIMIT_WINDOW_SECONDS=60
     ```

---

## 5. Rechazo con 400 Bad Request por Lote Excedido

- **Causa**: Se envió un array `readings` con más de 500 elementos en una sola llamada a `POST /api/readings`.
- **Diagnóstico**: El mensaje de error indica: `"El lote excede el tamaño máximo permitido de 500 lecturas"`.
- **Solución**:
  1. Fragmentar el lote en bloques de 100 o 250 lecturas en el firmware del ESP32.
  2. Enviar los lotes de forma secuencial respetando el límite de tasa.

---

## 6. Lecturas Descartadas como Inválidas por Timestamp Futuro

- **Causa**: El reloj de tiempo real (RTC) del ESP32 está adelantado en más de 5 minutos respecto a la hora del servidor.
- **Diagnóstico**: La respuesta indica `"invalidas": N` y en los registros aparece: `"excede la tolerancia hacia el futuro (+5 minutos)"`.
- **Solución**:
  1. Sincronizar el reloj del ESP32 con la hora actual mediante protocolo NTP o actualizándolo al inicio de la sesión.
  2. Verificar que la hora del sistema operativo anfitrión sea la correcta.

---

## 7. Lecturas Descartadas por Rango Físico Fuera de Escala

- **Causa**: Ruido de sensor o cable suelto que provoca que un valor sea biológicamente imposible (ej. SpO2 > 100% o FC < 0).
- **Diagnóstico**: El campo `"invalidas"` en la respuesta de ingesta es mayor que 0.
- **Solución**:
  1. El backend descarta automáticamente lecturas fuera de rango biológico protegiendo la integridad de la base de datos.
  2. Si el sensor está fallando o desconectado, el firmware debe transmitir la lectura con `quality: "sensor_fault"`.

---

## 8. No se Disparan Alertas por Desviación de Línea Base

- **Causa**: La variable evaluada aún no ha acumulado 50 muestras válidas en la tabla `linea_base`.
- **Diagnóstico**: Consultar `GET /api/astronauts/<id>/status` y revisar el campo `muestras` para esa variable.
- **Solución**:
  - Es el comportamiento intencionado del sistema: se requieren al menos 50 muestras para que la media y la desviación tengan significancia estadística y evitar falsos positivos durante la calibración inicial.

---

## 9. Estado de Conexión del Astronauta Permanece en `offline`

- **Causa**: Han transcurrido más de 60 segundos desde la última lectura válida recibida, o la lectura enviada tenía un timestamp muy antiguo.
- **Diagnóstico**: Revisar el campo `ultimo_contacto` en la respuesta de `/api/astronauts`.
- **Solución**:
  1. Verificar que el ESP32 esté transmitiendo paquetes de telemetría de forma periódica (al menos cada 10 a 30 segundos).
  2. En caso de requerir un intervalo de inactividad mayor, ajustar en `.env`:
     ```env
     ASTRONAUT_TIMEOUT_SECONDS=120
     ```

---

## 10. Error de Permisos al Crear la Base de Datos (`PermissionError`)

- **Causa**: El usuario que ejecuta el servidor no tiene permisos de escritura en la carpeta `data/` o el disco está en modo solo lectura.
- **Diagnóstico**: Fallo al arrancar `python app.py` con `sqlite3.OperationalError: unable to open database file`.
- **Solución**:
  1. En Linux/macOS: `chmod -R 755 data/ logs/`
  2. Verificar que el proceso no esté corriendo bajo un usuario restringido sin acceso a la ruta de trabajo.

---

## 11. Etiquetas HTML Mostradas como Texto Escapado en la Bitácora

- **Causa**: Se visualiza `&lt;script&gt;` o `&lt;b&gt;` en las notas consultadas.
- **Diagnóstico**: Es una medida intencional de protección perimetral contra Cross-Site Scripting (XSS).
- **Solución**:
  - La interfaz de usuario debe renderizar el contenido como texto plano (`textContent` o equivalente) y nunca interpretarlo con `innerHTML` o `dangerouslySetInnerHTML`.

---

## 12. El Comando `pytest` No se Reconoce en la Terminal

- **Causa**: La carpeta de scripts de Python del usuario no está incluida en el `PATH` global del sistema.
- **Diagnóstico**: `El término 'pytest' no se reconoce como un comando ejecutable`.
- **Solución**:
  - Ejecutar pytest invocando directamente el módulo de Python:
    ```powershell
    python -m pytest -v
    ```
