# L08-I · Auditoría de Mauricio y conexión local React–Flask

**Rama:** `feature/frontend-flask-integration` · **Base:** `0a95a78` · **Fecha:** 15 de noviembre de 2026.
**Dictamen:** recorrido local de extremo a extremo verificado con telemetría ficticia del simulador. Acceso autenticado desde el navegador y despliegue compartido pendientes.

## Línea base y cambios de Mauricio

El árbol inicial estaba limpio y la rama incorporaba `main`, confirmado contra la referencia remota `0a95a78`. L01–L08 seguían disponibles. La revisión principal fue `0a95a78`, que agrega proxy Vite, lectura anónima, permisos por método, respuesta 403 y simulador. `977ff1e` incorpora cambios previos de `main`, incluida documentación de `12356d8`. Se contrastó el código con la referencia API vigente. Las reglas nuevas de acceso deben actualizarse en la documentación del proveedor.

## Hallazgos de seguridad

| Gravedad | Evidencia y acción pendiente |
| --- | --- |
| Alta | **Producción permite GET anónimo por defecto.** `ProductionConfig` hereda el valor base `ALLOW_ANONYMOUS_READ=true` si falta la variable. Desarrollo lo fuerza a `True` y pruebas lo fuerzan a `False`. Flask puede enlazarse a todas las interfaces por defecto. Antes de compartir el servicio, Mauricio debe dejar producción cerrada por defecto, verificar el bind y exigir autorización. La validación de `SECRET_KEY` de producción es independiente del acceso anónimo. |
| Alta | La excepción omite la API key solo en GET sin cabecera. Alcanza catálogo, detalle, histórico, alertas y notas. Health ya era público. CORS está abierto y las cabeceras `no-store` evitan caché, pero ninguna de estas dos medidas autoriza usuarios. El proxy original reenviaba `/api` completo si se exponía Vite. |
| Media | Los permisos se infieren del nombre de la clave. `readonly`, `read_only` y `browser` bloquean métodos distintos de GET. Otras claves pasan este filtro sin restricción por ruta. Las lecturas anónimas comparten un identificador de tasa. Se recomienda a Mauricio definir permisos explícitos, separar ingesta de lectura y revisar cuota y exposición. |
| Media | El simulador acepta `ASTRA_API_KEY` o el argumento manual. La alternativa automática puede escribir en SQLite del repositorio si encuentra una clave activa, y de lo contrario cae en un token incorporado que no necesariamente existe en Flask. Además, imprime fragmentos de la clave. Se solicita eliminar ese log y el fallback predecible, y documentar aprovisionamiento fuera del código. |

Fuentes: [Configuración](../../Backend/config.py), [seguridad](../../Backend/security.py), [aplicación](../../Backend/app.py), [simulador](../../script/simulator.py) y [API](../../Backend/docs/API.md).

## Compatibilidad y cambios del frontend

El proxy Vite recibe `/api/...`; L03 exigía un prefijo protegido y construía `<prefijo>/api/...`. Sin prefijo, la llamada terminaba como `access-unconfigured`. La integración añade una opción explícita `VITE_LOCAL_ANONYMOUS_READ=true` para desarrollo. El arranque exige `import.meta.env.DEV`, el cliente comprueba loopback y usa `/api` directamente con `credentials: omit`. Conserva el prefijo seguro y sus credenciales de mismo origen para una configuración futura.

- `frontend/vite.config.ts`: Vite enlaza a loopback; el proxy optativo solo reenvía GET de health, catálogo, detalle e histórico. La comprobación previa valida socket, host y origen o contexto de solicitud si se envían. Preview tiene el proxy explícitamente vacío.
- `frontend/src/app/App.tsx` y `frontend/src/services/api/client.ts`: conectan la opción pública de desarrollo. Se conservan validadores, adaptadores, timeout, cancelación, 429 y manejo de errores.
- `frontend/tests/api.test.ts`: cubre URL sin prefijo, ausencia de credenciales y rechazo en un host externo.

El lanzamiento de ensayo usó la opción pública en el **entorno del proceso** de Vite. En PowerShell, con el Flask aislado ya preparado y solo para ese ensayo: `$env:VITE_LOCAL_ANONYMOUS_READ = 'true'; npm run dev`. Quitar la variable de esa sesión al finalizar. El puerto ascendente es `127.0.0.1:5000`. El valor de la variable es un interruptor sin secretos.

## Prueba real aislada

Flask se levantó en `127.0.0.1:5000` con una base SQLite y logs temporales, sin cargar el .env del repositorio. Las dependencias Python se instalaron en un directorio temporal. Se usaron claves efímeras generadas en el proceso de prueba. El simulador real se ejecutó con `--count 1` y su generador configurado en calidad degradada a través de su método existente. Se capturó únicamente el lote y la respuesta de ingesta; se suprimió toda la salida del simulador que podría mostrar fragmentos de claves. El emisor recibió la clave por `ASTRA_API_KEY`, por lo que no usó autogeneración contra la base del repositorio. No se editó Flask ni el simulador.

| Comprobación | Evidencia |
| --- | --- |
| Flask estricto en cliente de prueba con lectura anónima desactivada | GET sin clave **401**, GET con clave de lectura **200**, POST con la misma clave **403**, health público **200**. |
| Proxy optativo | Health OK y catálogo antes y después del envío. Rechazó tres intentos: escritura, lectura de notas y origen externo. Las lecturas conservaron `no-store`. |
| Ingesta real | HTTP 200 y **5 recibidas, 0 inválidas y 0 duplicadas**. El ID ficticio apareció después de la ingesta. |
| Muestra trazada | `l08i-demo-01` · `heart_rate` · **71,9 bpm** · `degraded` · `1794727112` UNIX · **2026-11-15 07:18:32 UTC** (02:18:32 Bogotá). Coincidió en el lote, en el detalle y el histórico JSON de Flask y en React, incluida la representación UTC según la precisión visual actual. |
| Navegador | Edge a 375 px, selección desde Tripulación y Monitoreo, sin errores de consola y **cero solicitudes con `X-API-Key`**. El emisor es el simulador en este ensayo; la API conserva procedencia desconocida en sus DTO. |
| Producción local | Con el mismo interruptor en el proceso de preview, `/api/health` no se reenvió a Flask y la UI del build mantuvo «API no configurada». |

Las consultas de navegador y el POST anteriores fueron reales contra la instancia Flask aislada. Los registros eran ficticios y la prueba no usó un entorno público ni credenciales previamente difundidas. Las sesiones se cerraron al terminar.

## Verificaciones y próximos pasos

Pasaron `npm run check`, `npm run build`, `npm run test:api` (**11 pruebas**), `node --test tests/pwa.test.mjs` (**3 pruebas**) y `git diff --check`. La prueba API añadida usa un transporte sintético. Las pruebas PWA verificaron el build y su política existente, sin modificación a la PWA. Vite emitió un aviso para su futuro cargador nativo; no bloqueó las pruebas. Se conservaron `Backend/`, `script/`, `junior-workstream/`, los componentes del junior y las dependencias del frontend.

**Demostración:** el flujo aislado con el simulador es reproducible y debe presentarse como telemetría ficticia. Para una demo compartida, Mauricio debe cerrar la lectura anónima por defecto, acordar el acceso autenticado desde mismo origen, resolver el manejo de claves del simulador y confirmar el entorno autorizado. Quedan pendientes unidad o escala de actividad, procedencia en el contrato y criterio de frescura. No hubo commits, push, merges ni despliegues.
