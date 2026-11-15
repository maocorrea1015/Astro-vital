-- ==============================================================================
-- SISTEMA ASTRA HEALTH - ESQUEMA DE BASE DE DATOS RELACIONAL (SQLite)
-- ==============================================================================
-- Archivo: schema.sql
-- Propósito: Definición exhaustiva de tablas, restricciones, índices y datos iniciales
--            para el backend de monitoreo fisiológico de astronautas en entornos aislados.
-- Autor: Equipo de Ingeniería de ASTRA HEALTH
-- Versión: 1.0.0
--
-- Directivas de configuración del motor SQLite:
-- PRAGMA foreign_keys = ON: Garantiza la integridad referencial en cascada y restringe
--                           registros huérfanos entre nodos, lecturas, alertas y notas.
-- PRAGMA journal_mode = WAL: Habilita Write-Ahead Logging para permitir lectores concurrentes
--                            sin bloquear escritores, vital para ingestión en tiempo real.
-- ==============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ------------------------------------------------------------------------------
-- TABLA: nodos
-- Propósito: Representa los trajes espaciales y nodos biomédicos asociados a cada astronauta.
--            Mantiene el registro de conectividad, latidos y metadatos de identidad.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nodos (
    -- astronaut_id: Identificador alfanumérico único del astronauta (ej. 'astro-01').
    -- Clave Primaria: Previene duplicación de registros de astronautas y sirve de anclaje relacional.
    astronaut_id TEXT PRIMARY KEY,

    -- nombre: Nombre completo o distintivo de misión asignado al tripulante.
    nombre TEXT NOT NULL,

    -- estado_conexion: Estado actual inferido ('online' u 'offline').
    -- CHECK: Previene inserción de estados no reconocidos por los clientes de telemetría.
    estado_conexion TEXT NOT NULL DEFAULT 'offline' CHECK(estado_conexion IN ('online', 'offline')),

    -- ultimo_contacto: Marca de tiempo UNIX (segundos) del último paquete recibido del traje.
    -- Utilizado para calcular la degradación de conectividad cuando supera el timeout configurado.
    ultimo_contacto INTEGER NOT NULL DEFAULT 0,

    -- creado_en: Marca de tiempo UNIX de registro del nodo en el sistema local.
    creado_en INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- ------------------------------------------------------------------------------
-- TABLA: lecturas
-- Propósito: Almacena series temporales de datos telemétricos provenientes de los sensores
--            biomédicos y ambientales (frecuencia cardíaca, SpO2, temperatura, radiación).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lecturas (
    -- id: Identificador secuencial autoincremental de la lectura física.
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- astronaut_id: Referencia foránea hacia el tripulante emisor.
    -- FOREIGN KEY: Asegura que ninguna lectura se asocie a un astronauta inexistente.
    -- ON DELETE CASCADE: Limpia telemetría asociada si se retira un nodo del sistema.
    astronaut_id TEXT NOT NULL,

    -- ts: Marca de tiempo UNIX (segundos) registrada en la captura del sensor en el traje.
    ts INTEGER NOT NULL,

    -- variable: Nombre de la métrica fisiológica o ambiental reportada.
    -- CHECK: Lista blanca estricta para mitigar inyecciones semánticas o variables corruptas.
    variable TEXT NOT NULL CHECK(variable IN ('heart_rate', 'spo2', 'temperature', 'radiation_cpm', 'activity')),

    -- valor: Magnitud numérica flotante registrada por el transductor.
    valor REAL NOT NULL,

    -- calidad: Estado cualitativo del transductor ('ok', 'degraded', 'sensor_fault').
    -- Permite discriminar fallos de hardware de emergencias fisiológicas reales.
    calidad TEXT NOT NULL DEFAULT 'ok' CHECK(calidad IN ('ok', 'degraded', 'sensor_fault')),

    -- creado_en: Marca de tiempo UNIX de persistencia efectiva en la base de datos local.
    creado_en INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (astronaut_id) REFERENCES nodos(astronaut_id) ON DELETE CASCADE,

    -- RESTRICCIÓN DE IDEMPOTENCIA:
    -- Previene duplicados exactos si el ESP32 o la red reenvía paquetes ante cortes temporales.
    -- Permite operaciones 'INSERT OR IGNORE' seguras sin generar anomalías en promedios.
    CONSTRAINT uq_lectura_idempotente UNIQUE(astronaut_id, ts, variable)
);

-- ÍNDICES DE LA TABLA: lecturas
-- Justificación: Acelera consultas de histórico temporal filtradas por astronauta y variable específica
-- (ej. GET /api/astronauts/{id}/readings?variable=heart_rate&hours=24).
CREATE INDEX IF NOT EXISTS idx_lecturas_ast_var_ts 
    ON lecturas(astronaut_id, variable, ts DESC);

-- Justificación: Optimiza limpiezas temporales, agregaciones cronológicas globales y auditorías.
CREATE INDEX IF NOT EXISTS idx_lecturas_ts 
    ON lecturas(ts DESC);


-- ------------------------------------------------------------------------------
-- TABLA: alertas
-- Propósito: Registro histórico y estado de atención de contingencias biomédicas generadas
--            por transgresión de umbrales absolutos o desviaciones anómalas de línea base.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alertas (
    -- id: Identificador único autoincremental de la alerta generada.
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- astronaut_id: Identificador del astronauta afectado por el evento adverso.
    astronaut_id TEXT NOT NULL,

    -- ts: Marca de tiempo UNIX en la que ocurrió la lectura causante de la alerta.
    ts INTEGER NOT NULL,

    -- variable: Parámetro que detonó la alarma médica o ambiental.
    variable TEXT NOT NULL,

    -- valor: Valor cuantitativo registrado al momento del disparo.
    valor REAL NOT NULL,

    -- severidad: Clasificación de criticidad según el protocolo de contingencias espaciales.
    -- CHECK: Restringe a niveles estrictos ('info', 'warning', 'critical') para guiar la UI.
    severidad TEXT NOT NULL CHECK(severidad IN ('info', 'warning', 'critical')),

    -- mensaje: Descripción corta y legible del diagnóstico o anomalía detectada.
    mensaje TEXT NOT NULL,

    -- guia: Instrucciones clínicas estandarizadas de actuación inmediata para el astronauta.
    guia TEXT NOT NULL,

    -- reconocida: Bandera booleana (0 = activa/pendiente, 1 = confirmada por el usuario).
    -- CHECK: Garantiza únicamente valores binarios (0 o 1).
    reconocida INTEGER NOT NULL DEFAULT 0 CHECK(reconocida IN (0, 1)),

    -- reconocida_en: Marca de tiempo UNIX de la confirmación por el tripulante o soporte médico.
    reconocida_en INTEGER,

    -- creado_en: Registro de persistencia de la alerta en el nodo central.
    creado_en INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (astronaut_id) REFERENCES nodos(astronaut_id) ON DELETE CASCADE
);

-- ÍNDICES DE LA TABLA: alertas
-- Justificación: Acelera drásticamente la obtención de alertas activas no reconocidas en el endpoint
-- principal de estatus consolidado (GET /api/astronauts/{id}/status).
CREATE INDEX IF NOT EXISTS idx_alertas_ast_reconocida_ts 
    ON alertas(astronaut_id, reconocida, ts DESC);

-- Justificación: Acelera reportes cronológicos globales para auditorías médicas de la misión.
CREATE INDEX IF NOT EXISTS idx_alertas_ts 
    ON alertas(ts DESC);


-- ------------------------------------------------------------------------------
-- TABLA: notas
-- Propósito: Bitácora de anotaciones clínicas, síntomas subjetivos y comentarios operativos
--            ingresados por los astronautas desde la interfaz táctil de la Raspberry Pi.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notas (
    -- id: Identificador único correlativo de la nota registrada.
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- astronaut_id: Tripulante que redactó el reporte subjetivo.
    astronaut_id TEXT NOT NULL,

    -- ts: Marca temporal declarada del evento o del ingreso de la observación.
    ts INTEGER NOT NULL,

    -- texto: Contenido textual descriptivo saneado (máx. 500 caracteres, libre de inyecciones XSS).
    texto TEXT NOT NULL,

    -- creado_en: Registro cronológico de inserción en el sistema.
    creado_en INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (astronaut_id) REFERENCES nodos(astronaut_id) ON DELETE CASCADE
);

-- ÍNDICES DE LA TABLA: notas
-- Justificación: Optimiza la recuperación cronológica paginada de la bitácora clínica del tripulante.
CREATE INDEX IF NOT EXISTS idx_notas_ast_ts 
    ON notas(astronaut_id, ts DESC);


-- ------------------------------------------------------------------------------
-- TABLA: linea_base
-- Propósito: Parámetros estadísticos históricos individuales (media y desviación estándar)
--            por variable para evaluar anomalías adaptativas a la microgravedad.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS linea_base (
    -- astronaut_id: Identificador del astronauta evaluado.
    astronaut_id TEXT NOT NULL,

    -- variable: Métrica biométrica o física monitoreada.
    variable TEXT NOT NULL,

    -- promedio: Media aritmética acumulada basada en las lecturas válidas procesadas.
    promedio REAL NOT NULL DEFAULT 0.0,

    -- desviacion: Desviación estándar poblacional para cálculo del Z-Score.
    desviacion REAL NOT NULL DEFAULT 0.0,

    -- muestras: Contador de muestras válidas integradas en el cálculo (mínimo 50 para reglas).
    muestras INTEGER NOT NULL DEFAULT 0,

    -- actualizado_en: Marca de tiempo UNIX de la última actualización estadística.
    actualizado_en INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    -- Clave Primaria Compuesta: Garantiza una única tupla de línea base por variable y astronauta.
    PRIMARY KEY (astronaut_id, variable),
    FOREIGN KEY (astronaut_id) REFERENCES nodos(astronaut_id) ON DELETE CASCADE
);


-- ------------------------------------------------------------------------------
-- TABLA: api_keys
-- Propósito: Almacenamiento seguro de credenciales de autenticación para componentes
--            del sistema (ESP32, App de Raspberry Pi, terminal médica).
-- Medida de Seguridad: Únicamente almacena el hash criptográfico SHA-256 de la clave.
--                      Nunca se almacena la clave en texto plano.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
    -- id: Identificador único autoincremental de la clave registrada.
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- key_hash: Resumen SHA-256 en formato hexadecimal (64 caracteres) de la clave secreta.
    -- UNIQUE: Impide colisiones o registros redundantes de credenciales criptográficas.
    key_hash TEXT NOT NULL UNIQUE,

    -- nombre_cliente: Etiqueta semántica para identificar al titular (ej. 'esp32-demo', 'app-pi').
    nombre_cliente TEXT NOT NULL,

    -- activa: Estado de vigencia de la clave (1 = habilitada, 0 = revocada inmediatamente).
    -- CHECK: Impide estados inválidos no binarios.
    activa INTEGER NOT NULL DEFAULT 1 CHECK(activa IN (0, 1)),

    -- creada_en: Marca de tiempo UNIX de emisión de la credencial.
    creada_en INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    -- ultimo_uso: Registro temporal del último acceso autenticado satisfactorio.
    ultimo_uso INTEGER
);

-- ÍNDICES DE LA TABLA: api_keys
-- Justificación: Acelera la verificación de autenticidad en cada solicitud entrante mediante búsqueda O(1).
CREATE INDEX IF NOT EXISTS idx_api_keys_hash 
    ON api_keys(key_hash);


-- ------------------------------------------------------------------------------
-- DATOS INICIALES (SEED DATA)
-- Propósito: Garantizar la presencia del tripulante principal de demostración 'astro-01'
--            para permitir la operatividad inmediata sin intervención manual.
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO nodos (astronaut_id, nombre, estado_conexion, ultimo_contacto)
VALUES ('astro-01', 'Astronauta Demo', 'offline', 0);
