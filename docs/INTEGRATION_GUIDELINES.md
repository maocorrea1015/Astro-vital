# Guía de integración frontend–backend

## Frontera y fuente

El emisor entrega lotes al backend. La PWA consume JSON por HTTP(S) mediante un adaptador. La fuente contractual es [Backend/docs/API.md](../Backend/docs/API.md). Los campos de esta guía son un mapa para el consumidor. Confirma con Mauricio la revisión que utilizará la demo. Si el código, el documento y una muestra de ejecución discrepan, registra los tres con su revisión y solicita confirmación antes de depender del comportamiento.

| Operación implementada | Uso previsto | Datos o límites que afectan a frontend |
| --- | --- | --- |
| `GET /api/health` | Alcance básico del servidor, público | Un éxito confirma respuesta del servicio. La autenticación y los datos requieren sus propias pruebas. |
| `GET /api/astronauts` | Listado y selección | Array de `astronaut_id`, `nombre`, `estado_general`, `estado_conexion` y `ultimo_contacto`. |
| `GET /api/astronauts/{id}/status` | Lecturas recientes y alertas activas del seleccionado | Identidad, estado, `lecturas`, `alertas_activas`, `linea_base` y `guia_actual` nullable. La política médica gobierna el uso de mensajes y guías. |
| `GET /api/astronauts/{id}/readings` | Historial | `variable`, `hours` y `limit`. Valores por defecto 24 h y 100 filas, máximos 720 h y 1.000 filas. El servidor ordena de más reciente a más antigua. |
| `GET /api/astronauts/{id}/alerts` | Activas e históricas | `reconocida=0/1` para pendientes/reconocidas. Límite por defecto 50, máximo 500. Estado consolidado solo incluye pendientes y usa una selección de sus campos. |
| `POST /api/alerts/{id}/acknowledge` | Acuse si se incluye en alcance | Identificador de alerta. El código conserva la primera marca de reconocimiento. |
| `GET` y `POST /api/astronauts/{id}/notes` | Notas si se incluyen en alcance | La escritura acepta texto y hora opcional. Devuelve `201` con `nota_id`. Sin idempotencia de escritura documentada. |

`POST /api/readings` pertenece al emisor. La entrada usa `value` y `quality`; la consulta usa `valor` y `calidad`. La API inspeccionada carece de ruta para eventos estructurados. El formato ISO normalizado de la definitiva §7.1 queda como propuesta.

## Interpretación de telemetría

| Dato | Evidencia y trabajo de adaptación |
| --- | --- |
| Identidad | Usa `astronaut_id` para correlacionar. Usa `nombre` como etiqueta. Evita mezclar la respuesta tardía de una selección anterior con el detalle actual. |
| Tiempo | `ts` y `ultimo_contacto` son UNIX en segundos. Convierte para mostrar una fecha y hora legibles. Distingue la hora de medición de contacto y del instante en que el navegador consultó. El JSON de lecturas carece de fecha de recepción. |
| Variables | [El validador](../Backend/validators.py) describe `heart_rate` en bpm, `spo2` en %, `temperature` en °C y `radiation_cpm` en CPM. `activity` es un índice de movimiento o aceleración integrada. Escala y etiqueta final de actividad quedan pendientes. Los payloads de consulta carecen de `unit`. Confirma qué variables emitirá el simulador. |
| Calidad | `ok`, `degraded`, `sensor_fault`. En el backend se almacena `sensor_fault` y se excluye del motor de alertas y de la línea base. `degraded` puede participar. Acuerda su presentación y evita tratar una lectura averiada como normal. |
| Conectividad | El backend infiere `online/offline` con `ultimo_contacto` y un timeout por defecto de 60 s. Un contacto de cero representa ausencia de contacto registrado. El timeout de nodo es independiente de la política pendiente de frescura por lectura. |
| Estado general | `normal`, `warning` y `critical` se derivan de alertas pendientes de severidad `warning` o `critical`. `normal` puede coexistir con falta de lecturas o con nodo offline. |
| Procedencia | No hay campo de origen en las lecturas de consulta. Acordar contexto de demo o metadato autorizado. Etiquetar el origen simulado sin inferirlo de nombres o valores. |
| Alertas | Leer severidad, fecha y reconocimiento según operación. El acuse registra reconocimiento, sin afirmar resolución. Tratar `mensaje` y `guia` como contenido sujeto a revisión. |

## Seguridad, consultas y fallos

Las rutas operativas requieren `X-API-Key`. El código configura CORS abierto en `/api/*`. La PWA necesita un mecanismo autorizado de acceso, con origen, HTTPS o localhost, distribución y rotación resueltos. Un intermediario de mismo origen es una opción para discutir. Todo valor `VITE_*` puede llegar al navegador. Excluye claves privadas de código, variables públicas, fixtures y logs. Respeta `Cache-Control: no-store` de las respuestas operativas.

| Resultado | Comportamiento esperado |
| --- | --- |
| Carga, vacío o respuesta inválida | Muestra carga al iniciar. Un array vacío válido tiene estado propio. Un payload inválido se reporta como error de datos. Conserva el contexto de la selección. |
| `400` o `404` | Indica consulta inválida o recurso ausente. Ofrece volver al listado o corregir la selección. |
| `401` | Indica problema de acceso. Evita reintentar en bucle y omite detalles de credenciales. |
| `429` | Pausa consultas según `Retry-After` si es accesible o el campo `retry_after`. La cuota de código es 100 peticiones en 60 s por clave, compartida entre rutas. |
| `500`, timeout o fallo de red | Indica API no disponible y permite recuperación según política. Si se conserva temporalmente el último dato, identifica hora y antigüedad. |
| Escritura ambigua | Distingue pendiente, confirmada y fallida. Acordar reintento e idempotencia antes de automatizarlo. |

Polling controlado es PROPUESTO. Acordar latencia, cadencia, consultas simultáneas y tratamiento de pestañas inactivas. Para el primer recorrido, evaluar listado y detalle seleccionado con el presupuesto por clave. SSE y WebSocket requieren contrato y evidencia de soporte antes de planificarlos.

## Proceso y contrato de pruebas

1. Acordar revisión de proveedor y operaciones habilitadas. Registrar campos requeridos y opcionales, unidades, reloj, calidad, procedencia, límites, errores y condiciones de aceptación en [decisiones](DECISIONS.md).
2. Obtener ejemplos representativos de Mauricio y simulación. Revisar que sean ficticios y sanitizados. Mantener fixtures de consumidor vinculados a la revisión, sin replicar el catálogo REST completo.
3. Confirmar con el navegador y entorno elegidos autenticación, CORS y cabeceras de error. Probar respuesta válida, vacío, dato inesperado, recurso inexistente, fallo de autenticación y límite de tasa cuando el entorno lo permita.
4. Seguir un lote simulado hasta un astronauta. Verificar valor, unidad, fecha, calidad y alerta permitida. Cortar por separado emisor y API, reanudar y observar un lote atrasado. Las escrituras se verifican cuando se aprueben.
5. Si hace falta un cambio, enviar a Mauricio operación y revisión, ejemplo anonimizado, comportamiento observado, necesidad de consumidor y prueba de aceptación. Mauricio confirma la referencia y la compatibilidad. El líder actualiza fixtures y adaptadores tras el acuerdo. Los asuntos clínicos pasan por [revisión médica](MEDICAL_CONTENT_POLICY.md).

Referencias adicionales de proveedor [seguridad](../Backend/docs/SECURITY.md), [despliegue](../Backend/docs/DEPLOYMENT.md) y [pruebas](../Backend/docs/TESTING.md). La definitiva §§7, 15–16 y 20–21 aporta los pendientes de contrato y demo.
