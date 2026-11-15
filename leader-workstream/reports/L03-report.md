# L03 · Informe técnico de integración API

**Rama:** `feature/frontend-api-integration`. **Revisión inicial:** `ca01d04`. **Resultado:** capa de integración implementada y verificada localmente. Conexión autenticada real pendiente. Revisión humana pendiente.

## Fuentes y alcance

La rama activa incluía L01 y L02, con `AppShell.tsx`, `navigation.tsx` e informe L02. El árbol estaba limpio. Los tipos y el build iniciales pasaron. La referencia contractual es [API.md](../../Backend/docs/API.md), contrastada con [app.py](../../Backend/app.py), [rutas Flask](../../Backend/routes/), [validadores](../../Backend/validators.py), [esquema](../../Backend/schema.sql) y [seguridad](../../Backend/security.py) de esa revisión. Se consultaron J01–J05 en la rama junior, en solo lectura.

## Operaciones revisadas

| Método y ruta | Formato observado en código | Uso en L03 |
| --- | --- | --- |
| GET `/api/health` | Público. `{status, service}`. | Cliente preparado, probado con respuesta local. |
| GET `/api/astronauts` | Lista con `astronaut_id`, `nombre`, estados general y de conexión y `ultimo_contacto`. | Cliente preparado y protegido por configuración explícita. |
| GET `/api/astronauts/{id}/status` | Estado consolidado, lecturas, alertas activas, línea base y `guia_actual` nullable. | Cliente preparado. Comprueba que el ID devuelto coincida con el pedido. |
| GET `/api/astronauts/{id}/readings` | Lista descendente con `id`, astronauta, variable, valor, `ts`, calidad. Filtros `variable`, `hours`, `limit`. Predeterminados 24 h y 100, máximos 720 h y 1.000. | DTO, validador y adaptador. Consulta reservada a L05. |
| GET `/api/astronauts/{id}/alerts` | Lista descendente. Filtros `reconocida=0/1` y `limit`, predeterminado 50 y máximo 500. Incluye reconocimiento y marcas de creación y acuse. | DTO, validador y adaptador. Consulta reservada a L05. |
| POST `/api/alerts/{id}/acknowledge` | Confirma con `{status: "ok"}`. El ID es entero. Conserva la primera hora de acuse. | Tipo y validador de confirmación. Escritura fuera del alcance de ejecución. |
| GET `/api/astronauts/{id}/notes` | Lista de notas con identificador, astronauta, texto, `ts` y `creado_en`. | DTO, validador y adaptador. |
| POST `/api/astronauts/{id}/notes` | Recibe `texto` y `ts` opcional. Devuelve 201 con `nota_id`. | Tipos y validador de confirmación. Escritura fuera del alcance de ejecución. |

Todas las rutas de la tabla salvo health requieren `X-API-Key` en Flask. Los campos principales coinciden con los ejemplos de API.md. Precisiones del código: `ultimo_contacto=0` indica ausencia de contacto, las alertas del estado consolidado carecen de los campos de acuse del histórico, y la consulta de notas devuelve texto ya saneado por el servidor. La cuota de 100 solicitudes por 60 segundos se comparte por clave entre rutas operativas. CORS permite cualquier origen para `/api/*` y la configuración inspeccionada carece de exposición explícita de `Retry-After`. El cuerpo `retry_after` sirve como alternativa. No se duplicó lógica clínica ni se añadieron endpoints. La API observada carece de un campo de procedencia de lectura o unidad en el JSON.

## Diseño de servicios

| Archivo | Responsabilidad |
| --- | --- |
| `frontend/src/services/api/contracts.ts` | DTO del proveedor, enumeraciones y confirmaciones de escrituras. |
| `frontend/src/services/api/validators.ts` | Validación de JSON desconocido, objeto/lista, campos, ID, valor finito, timestamp UNIX, enums y nullabilidad. Rechaza datos incompletos con `ContractError`. Una lista vacía es válida. |
| `frontend/src/services/api/adapters.ts` | Modelos `Astronaut`, `AstronautStatus`, `Reading`, `HistoricalReading`, `Alert`, `Baseline` y `Note`. Convierte segundos a milisegundos y admite presentación con locale y zona explícitos. |
| `frontend/src/services/api/client.ts` | GET por fetch nativo, timeout de 10 s configurable, cancelación y errores tipados. Agrupa consultas simultáneas sin señal por instancia y URL. |
| `frontend/src/services/api/astronauts.ts` | Expone `getHealth(signal?)`, `listAstronauts(signal?)` y `getAstronautStatus(id, signal?)`. |
| `frontend/tests/api.test.ts` | Pruebas Node con respuestas sintéticas derivadas de las formas documentadas y fetch inyectado. |
| `frontend/package.json` y `frontend/tsconfig.json` | Script `test:api`, imports TS explícitos e inclusión de las pruebas en el chequeo de tipos. Sin dependencias nuevas ni cambios al lockfile. |
| `leader-workstream/PROGRESS.md` y este informe | Estado, evidencia y pendientes. |

Los modelos separan estado reportado, conectividad, hora de contacto, hora de medición, calidad y acuse. Conservan cero y representan ausencia de contacto como `null`. El catálogo observado usa bpm, %, °C y CPM para pulso, SpO₂, temperatura y radiación. La unidad de actividad queda `null`; la procedencia queda `unknown`. La frescura requiere una política explícita del consumidor. Los textos de guía se validan como DTO y se excluyen de los modelos adaptados. El mensaje de alerta es un texto reportado, sujeto a validación para su despliegue clínico.

## Seguridad y errores

Health usa una base pública HTTP(S) sin credenciales. Las rutas protegidas fallan con `access-unconfigured` antes de usar la red, salvo que se configure expresamente un prefijo de acceso del mismo origen. Ese prefijo es un punto de configuración para un mecanismo futuro acordado. L03 no despliega un intermediario. Las solicitudes rechazan redirecciones y usan `no-store`. El código carece de campos para claves privadas, cabeceras de autenticación, lectura de storage o variables `VITE_*`.

El cliente distingue 400, 401/403, 404, 429, 5xx, otros estados HTTP, fallo de red, timeout, cancelación y JSON inesperado. El validador distingue JSON bien formado con estructura incompatible. El 429 lee segundos o fecha HTTP de `Retry-After`, con respaldo de `retry_after` en JSON. Si hay plazo, suprime nuevas llamadas del mismo ámbito durante la espera en esa instancia. No reintenta automáticamente. El proveedor sigue aplicando la cuota compartida y el consumidor debe reutilizar la instancia para conservar esa espera.

## Verificaciones

| Comprobación | Resultado |
| --- | --- |
| `npm run check` y `npm run build` | Pasaron antes y después de implementar. |
| `npm run test:api` | 8 pruebas pasaron sin red. Cubren DTO válidos e inválidos, cero, nulos, tiempo, calidad, estados, acuse, ausencia de credenciales, errores HTTP, 429, cancelación, timeout y deduplicación. |
| Instrucciones de reproducción | Ejecutar desde `frontend/` con el entorno Node 24 usado para verificar. El script usa `node:test` y el modo nativo de eliminación de tipos. |
| Seguridad estática | Revisión de rutas, configuración, ausencia de cabeceras de credenciales y escaneo de patrones de secretos en los archivos alterados. El shell aún no consume estos módulos, por lo que el build verifica el proyecto y los tipos verifican la capa de API. |
| `git diff --check` y comprobación de archivos nuevos | Pasaron. Los hashes de los archivos preexistentes fuera del alcance se conservaron. |

La primera ejecución detectó un import de tipo sin uso y propiedades de constructor incompatibles con el modo nativo de pruebas. Se corrigieron ambos y se repitieron tipos, pruebas y build. No se ejecutaron solicitudes reales a Flask ni prueba de conectividad desde navegador. No se realizaron operaciones Git de escritura.

## Pendientes y preparación de L04

- **Mauricio y líder:** confirmar revisión desplegada, ejemplos sanitizados y acceso de mismo origen con credenciales privadas administradas fuera del navegador. Comprobar URL, HTTPS o localhost, política de sesión y errores desde el navegador.
- **Mauricio, simulación y líder:** confirmar unidades y escala de actividad, procedencia, reloj, criterio de frescura, ventana de consulta y presupuesto de peticiones. Probar el 429 y la visibilidad de su cabecera en el entorno real.
- **Líder y junior:** acordar props para identidad, estado reportado, conectividad, contacto, medida, unidad nullable, calidad y frescura. Acordar estructura de series, estados de consulta y acciones por ID. Coordinar `onSelect`, `onRetry`, cambio de filtro y acuse dentro del alcance autorizado. Los modelos de esta capa son insumos de presentación, no sustituyen la coordinación de firmas.
- Cuando se autorice L04, montar una instancia del cliente en el controlador de datos, pasar señales por selección y manejar carga, vacío, error y cancelación por separado. Verificar primero una muestra de extremo a extremo y la coincidencia del ID. La integración autenticada permanece bloqueada hasta confirmar el acceso. L04 no se inició.
