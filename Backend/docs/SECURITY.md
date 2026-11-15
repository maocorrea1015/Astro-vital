# Manual de Seguridad y Defensa Perimetral - ASTRA HEALTH Backend

Este documento detalla todas las medidas de seguridad implementadas en el backend de ASTRA HEALTH, justificando los vectores de ataque mitigados, la implementación técnica, los métodos de verificación y sus limitaciones.

---

## 1. Autenticación Criptográfica mediante API Keys (SHA-256)

- **Descripción Técnica**:
  Cada cliente (ESP32, App de Raspberry Pi) debe enviar un token secreto en la cabecera HTTP `X-API-Key`. El servidor nunca almacena este secreto en texto plano; calcula su resumen unidireccional `SHA-256` y valida su existencia en la tabla `api_keys` con la bandera `activa = 1`.
- **Ataque Mitigado**:
  - *Acceso no autorizado* (CWE-285 / OWASP API1:2023 Broken Object Level Authorization).
  - *Filtración masiva de credenciales* ante volcado o copia del archivo de base de datos (CWE-312 Cleartext Storage of Sensitive Information).
- **Implementación**:
  - [security.py](file:///d:/proyectos/Astro-vital/Backend/security.py): Decorador `require_api_key` y función `hash_api_key`.
  - [generate_api_key.py](file:///d:/proyectos/Astro-vital/Backend/generate_api_key.py): Generador de claves de 256 bits de entropía con `secrets.token_urlsafe(32)`.
- **Cómo se Prueba**:
  - Test automatizado: `tests/test_security.py::test_authentication_enforcement` y `test_revoked_api_key`.
  - Comando: `python -m pytest tests/test_security.py -k test_authentication_enforcement`
- **Limitaciones**:
  - Si el medio de transmisión físico no utiliza cifrado de capa de enlace o TLS, un atacante con acceso al bus local podría interceptar la cabecera.
- **Referencias**:
  - OWASP API Security Top 10 - API2:2023 Broken Authentication.
  - NIST SP 800-63B Digital Identity Guidelines.

---

## 2. Limitador de Tasa en Memoria (*Rate Limiting*)

- **Descripción Técnica**:
  Implementa un algoritmo de ventana deslizante (*sliding window*) en memoria por API Key (o por IP para clientes no autenticados) protegido por un cerrojo de exclusión mutua (`threading.Lock`). Limita el tráfico a un máximo de 100 peticiones por minuto. Ante excesos, responde con HTTP 429 y cabecera `Retry-After`.
- **Ataque Mitigado**:
  - *Denegación de Servicio (DoS)* por saturación de recursos en hardware embebido (CWE-400 Uncontrolled Resource Consumption / OWASP API4:2023 Unrestricted Resource Consumption).
  - *Fuerza bruta* contra claves de API y endpoints de ingesta.
- **Implementación**:
  - [security.py](file:///d:/proyectos/Astro-vital/Backend/security.py): Decorador `rate_limit(max_requests, window_seconds)`.
- **Cómo se Prueba**:
  - Test automatizado: `tests/test_security.py::test_rate_limiting_enforcement`.
  - Envío sostenido de 101 solicitudes consecutivas.
- **Limitaciones**:
  - Al ser en memoria local, el contador se reinicia si el proceso del servidor se reinicia.
- **Referencias**:
  - RFC 6585 - Section 4: 429 Too Many Requests.
  - OWASP Denial of Service Cheat Sheet.

---

## 3. Validación Estricta de Esquemas y Listas Blancas

- **Descripción Técnica**:
  Todos los datos recibidos son validados mediante esquemas en código puro sin dependencias externas:
  - `astronaut_id`: Expresión regular rígida `^[a-zA-Z0-9_-]{1,32}$`.
  - `variable`: Lista blanca estricta (`heart_rate`, `spo2`, `temperature`, `radiation_cpm`, `activity`).
  - `value`: Tipado numérico forzado y rangos biológicos plausibles (ej. FC de 0 a 300, SpO2 de 0 a 100).
  - `ts`: Entero UNIX con tolerancia máxima de +5 minutos respecto al reloj del servidor.
  - Lotes limitados a un máximo estricto de 500 registros.
- **Ataque Mitigado**:
  - *Inyección de Datos Maliciosos* (CWE-20 Improper Input Validation).
  - *Agotamiento de Memoria (DoS)* por lotes desmesurados (CWE-770).
  - *Contaminación de Datos Clínicos* por lecturas de transductores con ruido o valores fuera de escala biológica.
- **Implementación**:
  - [validators.py](file:///d:/proyectos/Astro-vital/Backend/validators.py): `validate_readings_batch`, `validate_single_reading`, `validate_astronaut_id`.
- **Cómo se Prueba**:
  - Test automatizado: `tests/test_readings.py::test_ingestion_payload_validation_errors` y `test_mixed_batch_fault_tolerance`.
- **Limitaciones**:
  - No detecta anomalías biológicas complejas que se encuentren dentro del rango plausible (ej. 125 BPM estables en sueño profundo; esto se delega al motor de reglas Z-Score).
- **Referencias**:
  - OWASP Input Validation Cheat Sheet.

---

## 4. Protección contra Inyección SQL mediante Sentencias Parametrizadas

- **Descripción Técnica**:
  El 100% de las operaciones sobre SQLite emplean sentencias parametrizadas nativas (signo de interrogación `?`). Está expresamente prohibido el uso de concatenación de cadenas, formato `str.format()` o f-strings en la construcción de sentencias SQL.
- **Ataque Mitigado**:
  - *Inyección SQL clásica y ciega* (CWE-89 SQL Injection / OWASP API3:2023 Broken Object Property Level Authorization).
- **Implementación**:
  - [database.py](file:///d:/proyectos/Astro-vital/Backend/database.py) y todas las rutas en `routes/`.
- **Cómo se Prueba**:
  - Test automatizado: `tests/test_security.py::test_sql_injection_resistance`.
  - Inyección de cadenas hostiles como `astro-01'; DROP TABLE lecturas; --`.
- **Limitaciones**:
  - No protege contra errores lógicos en la estructura de consultas estáticas si el esquema estuviese mal diseñado.
- **Referencias**:
  - OWASP SQL Injection Prevention Cheat Sheet.

---

## 5. Sanitización contra Cross-Site Scripting (XSS)

- **Descripción Técnica**:
  Las notas subjetivas ingresadas por los tripulantes pasan por un filtro que remueve caracteres de control no imprimibles (`\x00-\x1F`), acota la longitud a un máximo de 500 caracteres y escapa entidades HTML mediante `html.escape(quote=True)`.
- **Ataque Mitigado**:
  - *Cross-Site Scripting Almacenado (Stored XSS)* (CWE-79 Impersonation / Execution of Scripts in Client Context).
- **Implementación**:
  - [validators.py](file:///d:/proyectos/Astro-vital/Backend/validators.py): Función `sanitize_text`.
  - [routes/notes.py](file:///d:/proyectos/Astro-vital/Backend/routes/notes.py): Endpoint `POST /api/astronauts/<id>/notes`.
- **Cómo se Prueba**:
  - Test automatizado: `tests/test_astronauts.py::test_astronaut_notes_flow_and_sanitization`.
- **Limitaciones**:
  - No aplica análisis de lenguaje natural ni filtrado de información confidencial compartida por el usuario.
- **Referencias**:
  - OWASP Cross Site Scripting Prevention Cheat Sheet.

---

## 6. Cabeceras HTTP de Endurecimiento (*Security Headers*)

- **Descripción Técnica**:
  Mediante un hook `after_request` de Flask, se inyectan cabeceras de seguridad en todas las respuestas HTTP salientes:
  - `X-Content-Type-Options: nosniff`: Fuerza al cliente a apegarse al MIME declarado.
  - `X-Frame-Options: DENY`: Impide que la API sea renderizada en marcos o iframes.
  - `Content-Security-Policy: default-src 'none'`: Deshabilita la ejecución de cualquier script o recurso foráneo.
  - `Cache-Control: no-store, no-cache, must-revalidate, private`: Previene que datos fisiológicos queden almacenados en memorias caché volátiles o intermedias.
  - `Strict-Transport-Security` (opcional configurable vía `.env`).
- **Ataque Mitigado**:
  - *Clickjacking* (CWE-1021).
  - *MIME Sniffing* (CWE-430).
  - *Filtración de Datos Médicos por Caché Local Compartida*.
- **Implementación**:
  - [security.py](file:///d:/proyectos/Astro-vital/Backend/security.py): Función `register_security_headers`.
- **Cómo se Prueba**:
  - Test automatizado: `tests/test_security.py::test_security_headers_presence`.
- **Referencias**:
  - OWASP Secure Headers Project.

---

## 7. Manejo Seguro de Errores y Supresión de Stack Traces

- **Descripción Técnica**:
  Se implementan manejadores globales `@app.errorhandler` para códigos 400, 401, 404, 405, 429 y 500, así como para cualquier excepción imprevista. Las excepciones registran la traza completa internamente en el archivo rotativo de log (`logs/backend.log`), mientras que al cliente se le devuelve un JSON genérico (`{"error": "Error interno del servidor"}`).
- **Ataque Mitigado**:
  - *Divulgación de Información y Fingerprinting* (CWE-209 Information Exposure Through an Error Message / OWASP API8:2023 Security Misconfiguration).
- **Implementación**:
  - [app.py](file:///d:/proyectos/Astro-vital/Backend/app.py): Bloque de registro de manejadores de error.
- **Cómo se Prueba**:
  - Test automatizado en suite general y comprobación de respuestas de error.
- **Limitaciones**:
  - Requiere que el administrador acceda a los archivos locales de log para depurar incidentes.
- **Referencias**:
  - OWASP Error Handling Cheat Sheet.

---

## 8. Configuración Segura y Gestión de Secretos

- **Descripción Técnica**:
  - Ningún secreto ni credencial maestra reside en el código fuente (`config.py`).
  - Todas las configuraciones sensibles se leen de variables de entorno mediante `.env`.
  - El archivo `.gitignore` excluye `.env`, volcados `.db`, cachés y directorios `logs/`.
  - Se provee `.env.example` con valores de plantilla seguros y documentados.
- **Ataque Mitigado**:
  - *Filtración de Secretos en Repositorios de Código* (CWE-798 Use of Hard-coded Credentials).
- **Implementación**:
  - [.env.example](file:///d:/proyectos/Astro-vital/Backend/.env.example), [.gitignore](file:///d:/proyectos/Astro-vital/Backend/.gitignore), [config.py](file:///d:/proyectos/Astro-vital/Backend/config.py).
- **Referencias**:
  - The Twelve-Factor App: Config.
