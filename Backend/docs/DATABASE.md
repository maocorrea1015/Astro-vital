# Arquitectura y Esquema de Base de Datos - ASTRA HEALTH

Este documento describe la base de datos relacional SQLite utilizada por el backend de ASTRA HEALTH.

---

## 1. Justificación del Motor de Datos (SQLite)

- **Entorno Embebido y Fuera de Línea**: El sistema está concebido para desplegarse en estaciones locales, módulos de aterrizaje y computadoras compactas como la Raspberry Pi. SQLite no requiere un proceso demonio en segundo plano, puertos de red ni administración de usuarios del sistema operativo.
- **Tolerancia a Cortes de Energía y Fallas**: Mediante el modo **WAL (Write-Ahead Logging)**, las escrituras son atómicas y duraderas, garantizando que un corte de energía intempestivo en el hábitat espacial no corrompa el archivo de base de datos.
- **Rendimiento y Cero Latencia de Red**: Al ejecutarse en el mismo proceso del backend Flask, el acceso a datos se realiza a través de llamadas a la biblioteca C interna de SQLite, eliminando la sobrecarga de sockets TCP/IP de bases de datos cliente-servidor tradicionales.

---

## 2. Directivas Globales del Motor (PRAGMAs)

En cada apertura de conexión se aplican las siguientes directivas:
1. `PRAGMA foreign_keys = ON;`
   - **Justificación**: Por defecto, SQLite tiene deshabilitada la comprobación de integridad referencial. Esta directiva garantiza que ninguna lectura, alerta o nota pueda existir sin estar vinculada a un astronauta válido en la tabla `nodos`, y activa las eliminaciones en cascada (`ON DELETE CASCADE`).
2. `PRAGMA journal_mode = WAL;`
   - **Justificación**: Write-Ahead Logging permite que múltiples lectores concurrentes (como la interfaz táctil del astronauta) puedan consultar series de tiempo sin bloquear ni ser bloqueados por el hilo que ingesta telemetría continua desde el ESP32.

---

## 3. Diccionario de Datos y Tablas

### 3.1 Tabla: `nodos`
Almacena la identidad y el estado de conectividad de cada traje espacial o dispositivo biomédico.

| Columna | Tipo | Restricción | Propósito / Justificación |
|---------|------|-------------|---------------------------|
| `astronaut_id` | TEXT | PRIMARY KEY | Identificador alfanumérico seguro único del tripulante (ej. 'astro-01'). |
| `nombre` | TEXT | NOT NULL | Nombre de misión o denominación de cabina del tripulante. |
| `estado_conexion` | TEXT | CHECK IN ('online', 'offline') | Estado nominal o desconectado; la restricción CHECK previene valores corruptos. |
| `ultimo_contacto` | INTEGER | NOT NULL DEFAULT 0 | Marca de tiempo UNIX del último latido o paquete de telemetría recibido. |
| `creado_en` | INTEGER | NOT NULL DEFAULT now | Marca de tiempo UNIX de alta en el sistema. |

---

### 3.2 Tabla: `lecturas`
Almacena series temporales de mediciones físicas registradas por los sensores telemétricos.

| Columna | Tipo | Restricción | Propósito / Justificación |
|---------|------|-------------|---------------------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador numérico secuencial del registro. |
| `astronaut_id` | TEXT | FOREIGN KEY -> nodos(astronaut_id) | Vinculación estricta con el tripulante emisor; limpia telemetría en cascada. |
| `ts` | INTEGER | NOT NULL | Marca de tiempo UNIX registrada por el reloj RTC del sensor en el traje. |
| `variable` | TEXT | CHECK IN (...) | Métrica reportada: `heart_rate`, `spo2`, `temperature`, `radiation_cpm`, `activity`. |
| `valor` | REAL | NOT NULL | Magnitud cuantitativa en coma flotante. |
| `calidad` | TEXT | CHECK IN ('ok', 'degraded', 'sensor_fault') | Estado operativo del sensor para filtrar falsas alarmas de hardware. |
| `creado_en` | INTEGER | NOT NULL DEFAULT now | Marca de tiempo de persistencia en disco del backend. |

#### Restricciones de Integridad:
- **`CONSTRAINT uq_lectura_idempotente UNIQUE(astronaut_id, ts, variable)`**:
  - *Justificación*: Garantiza ingesta **idempotente**. Si el ESP32 o la red inalámbrica reenvían el mismo paquete ante una pérdida momentánea de acuse de recibo, la instrucción `INSERT OR IGNORE` descarta la tupla duplicada sin generar errores ni falsear promedios estadísticos.

#### Índices:
- **`idx_lecturas_ast_var_ts` ON `(astronaut_id, variable, ts DESC)`**:
  - *Justificación*: Acelera drásticamente las consultas históricas filtradas (ej. `GET /api/astronauts/{id}/readings?variable=heart_rate&hours=24`) y la búsqueda de la última lectura en el cálculo de `/status`.
- **`idx_lecturas_ts` ON `(ts DESC)`**:
  - *Justificación*: Optimiza consultas globales cronológicas y procesos de depuración o auditoría temporal.

---

### 3.3 Tabla: `alertas`
Registra eventos anómalos o de emergencia médica y ambiental disparados por las reglas.

| Columna | Tipo | Restricción | Propósito / Justificación |
|---------|------|-------------|---------------------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único de la contingencia. |
| `astronaut_id` | TEXT | FOREIGN KEY -> nodos | Astronauta afectado. |
| `ts` | INTEGER | NOT NULL | Momento en el que se produjo la anomalía fisiológica. |
| `variable` | TEXT | NOT NULL | Variable que detonó la regla. |
| `valor` | REAL | NOT NULL | Valor registrado al momento del disparo. |
| `severidad` | TEXT | CHECK IN ('info', 'warning', 'critical') | Clasificación estricta de gravedad clínica. |
| `mensaje` | TEXT | NOT NULL | Diagnóstico textual conciso para visualización rápida. |
| `guia` | TEXT | NOT NULL | Instrucciones de contingencia médica inmediata estandarizadas. |
| `reconocida` | INTEGER | CHECK IN (0, 1) DEFAULT 0 | 0 = Activa/Pendiente de atención; 1 = Confirmada por la tripulación. |
| `reconocida_en` | INTEGER | NULL | Marca temporal UNIX del momento exacto del acuse de recibo. |
| `creado_en` | INTEGER | NOT NULL DEFAULT now | Timestamp de inserción. |

#### Índices:
- **`idx_alertas_ast_reconocida_ts` ON `(astronaut_id, reconocida, ts DESC)`**:
  - *Justificación*: Optimiza la recuperación instantánea de alertas activas (`reconocida = 0`) para el cálculo del estado general consolidado en `/status`.
- **`idx_alertas_ts` ON `(ts DESC)`**:
  - *Justificación*: Facilita auditorías cronológicas para el soporte de misión en Tierra.

---

### 3.4 Tabla: `notas`
Bitácora de observaciones subjetivas ingresadas por el astronauta.

| Columna | Tipo | Restricción | Propósito / Justificación |
|---------|------|-------------|---------------------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador de la nota. |
| `astronaut_id` | TEXT | FOREIGN KEY -> nodos | Autor de la nota. |
| `ts` | INTEGER | NOT NULL | Marca temporal del evento descrito. |
| `texto` | TEXT | NOT NULL | Contenido saneado (máx. 500 caracteres, libre de inyecciones XSS). |
| `creado_en` | INTEGER | NOT NULL DEFAULT now | Registro de inserción en el sistema. |

#### Índices:
- **`idx_notas_ast_ts` ON `(astronaut_id, ts DESC)`**:
  - *Justificación*: Optimiza la consulta cronológica inversa de la bitácora del tripulante.

---

### 3.5 Tabla: `linea_base`
Estadísticas históricas adaptativas (media y desviación estándar) por astronauta y variable.

| Columna | Tipo | Restricción | Propósito / Justificación |
|---------|------|-------------|---------------------------|
| `astronaut_id` | TEXT | PRIMARY KEY (Compuesta) | Identificador del tripulante. |
| `variable` | TEXT | PRIMARY KEY (Compuesta) | Variable biológica o ambiental. |
| `promedio` | REAL | NOT NULL DEFAULT 0.0 | Media aritmética acumulada basada en lecturas válidas. |
| `desviacion` | REAL | NOT NULL DEFAULT 0.0 | Desviación estándar poblacional. |
| `muestras` | INTEGER | NOT NULL DEFAULT 0 | Conteo de muestras integradas (mínimo 50 para activar Z-Score). |
| `actualizado_en` | INTEGER | NOT NULL DEFAULT now | Marca temporal de última sincronización estadística. |

---

### 3.6 Tabla: `api_keys`
Almacén criptográfico de credenciales para dispositivos y clientes autorizados.

| Columna | Tipo | Restricción | Propósito / Justificación |
|---------|------|-------------|---------------------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador de la clave. |
| `key_hash` | TEXT | NOT NULL UNIQUE | Resumen SHA-256 de 64 caracteres; nunca se almacena la clave en claro. |
| `nombre_cliente` | TEXT | NOT NULL | Etiqueta del dispositivo o subsistema (ej. 'esp32-demo', 'app-pi'). |
| `activa` | INTEGER | CHECK IN (0, 1) DEFAULT 1 | 1 = Vigente; 0 = Revocada inmediatamente. |
| `creada_en` | INTEGER | NOT NULL DEFAULT now | Momento de emisión. |
| `ultimo_uso` | INTEGER | NULL | Marca temporal del último acceso autenticado satisfactorio. |

#### Índices:
- **`idx_api_keys_hash` ON `(key_hash)`**:
  - *Justificación*: Búsqueda directa O(1) en cada verificación de autenticación perimetral.

---

## 4. Semilla de Datos Inicial (Seed Data)

El script `schema.sql` ejecuta automáticamente la inserción del astronauta demo para permitir la inicialización sin intervención:
```sql
INSERT OR IGNORE INTO nodos (astronaut_id, nombre, estado_conexion, ultimo_contacto)
VALUES ('astro-01', 'Astronauta Demo', 'offline', 0);
```
