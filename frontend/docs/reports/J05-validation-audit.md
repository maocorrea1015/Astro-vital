# Auditoría de validación automatizada — J05

**Proyecto:** Astro-vital · Frontend
**Fecha del informe:** 15 de noviembre de 2026
**Rama inspeccionada:** `feature/j03-j04-measurements-alerts`
**Responsabilidad:** Frontend Junior · auditoría documental
**Alcance:** análisis estático de las pruebas y resultados aportados en el informe preliminar. No se ejecutaron pruebas durante esta auditoría.

## 1. Fuentes y método

Se inspeccionaron `AGENTS.md`, `frontend/AGENTS.md`, `frontend/package.json`, `frontend/tsconfig.json`, `frontend/tests/api.test.ts`, `frontend/tests/pwa.test.mjs`, la configuración Vite, los componentes de J01–J04, `leader-workstream/INTEGRATION_PLAN.md` y `leader-workstream/OWNERSHIP.md`. El inventario de `frontend/` contiene dos archivos de prueba: los dos anteriores. El repositorio también contiene pruebas bajo `Backend/tests/`; pertenecen al backend, no se consideran evidencia de J05 frontend y no se ejecutaron. Se inspeccionó además el informe histórico L07, que describe comprobaciones de integración en otra rama; se registra aparte y no se agrega al total J05.

Los resultados de Node/npm y de comandos de validación que siguen se transcriben del informe preliminar entregado para esta auditoría. No se repitieron ni se corroboraron ejecutándolos. Las descripciones de cobertura sí se contrastaron con las aserciones actuales de los archivos de prueba.

## 2. Estado del repositorio inspeccionado

Antes de crear este informe, el árbol estaba en `feature/j03-j04-measurements-alerts`, alineado con `origin/feature/j03-j04-measurements-alerts`. La inspección de ese momento mostró únicamente estos dos cambios funcionales locales:

```text
 M frontend/src/features/alerts/components/AlertsPanel.tsx
 M frontend/src/features/crew/components/MeasurementTrend.tsx
```

El diff corresponde a mover `alignItems` y `flexWrap` a `sx` en dos componentes `Stack`, conservando las demás propiedades. `git diff --check` terminó sin errores de espacios en blanco; Git mostró una advertencia de normalización LF/CRLF para `AlertsPanel.tsx`. Estos son hallazgos de la inspección actual, no una repetición de toda la revisión Git del informe preliminar. Los cambios locales se conservaron intactos. Durante la redacción se añadió este informe; por eso el estado Git posterior también incluye `?? frontend/docs/reports/`.

## 3. Entorno y comandos informados

El informe preliminar declara Node.js `v24.22.3`, npm `11.19.1`, React `19.3.1`, TypeScript `5.9.3`, Vite `8.3.8` y Material UI `9.5.0`. Las versiones de dependencias coinciden con `frontend/package.json`; las versiones de Node y npm no se verificaron en esta auditoría.

| Comando informado (desde `frontend/`) | Resultado informado | Interpretación |
| --- | --- | --- |
| `npm ci` | Completado; sin vulnerabilidades reportadas, según el preliminar. | Instalación declarada por el informe; no se repitió. |
| `npm run check` | Primera ejecución falló por props de `Stack` en `AlertsPanel.tsx` y `MeasurementTrend.tsx`. Tras las correcciones, segunda ejecución aprobada sin errores TS, según el preliminar. | Ejecuta `npm run typecheck`, que a su vez ejecuta `tsc --noEmit`. No prueba comportamiento funcional ni renderizado. |
| `npm run build` | Aprobado; 478 módulos transformados y aproximadamente 723 ms, según el preliminar. | El script vuelve a ejecutar typecheck y después `vite build`. No es una prueba funcional de interfaz. |
| `npm run test:api` | 10 aprobadas, 0 fallidas, según el preliminar. | Node ejecuta `tests/api.test.ts` con `--experimental-strip-types`. |
| `node --test tests/pwa.test.mjs` | 3 aprobadas, 0 fallidas, según el preliminar. | Prueba artefactos compilados; requiere `dist/` generado previamente por build. |

El total reportado es **13 pruebas automatizadas aprobadas y 0 fallidas**: 10 API y 3 PWA. TypeScript y build son verificaciones adicionales, no se suman como pruebas.

### TypeScript y build

`frontend/package.json` define `check` como `npm run typecheck`; `typecheck` es `tsc --noEmit`. `frontend/tsconfig.json` incluye `src`, `vite.config.ts` y `tests/api.test.ts`, con modo estricto. Esto comprueba tipos de los archivos incluidos, pero no verifica el comportamiento visual o interactivo de React.

`build` ejecuta `check` y luego `vite build`. La advertencia de Vite relacionada con una extensión de importación en `vite.config.ts` está descrita por el informe preliminar como no bloqueante. `vite.config.ts` queda fuera de cambios autorizados en esta tarea; no se propone modificarlo.

## 4. Pruebas de API: comportamiento y cobertura

`frontend/tests/api.test.ts` usa `node:test`, `node:assert/strict`, respuestas `Response` sintéticas y un `fetchImpl` falso. No contacta al backend real. Invoca directamente validadores, adaptadores, `createAstronautApi` y el cliente HTTP.

| # | Caso | Aserciones y comportamiento comprobado | Módulos / funciones | Tipo y límite |
| --- | --- | --- | --- | --- |
| 1 | Conversión y frescura | Estado offline, contacto cero convertido a `null`, valor cero conservado, unidad de actividad `null`, conversión de segundos a ms, calidad degradada, procedencia `unknown`, resumen de línea base, alerta activa pendiente, exclusión de `guia`, formato de hora y frescura `unknown`/`stale`/`recent`. | `adaptAstronautStatus`, `formatTimestamp`, `getFreshness` en `adapters.ts`; `decodeAstronautStatus`. | Unitario de adaptación. No prueba que los componentes presenten esos campos. |
| 2 | Validación de listas y contratos | Acepta lista de astronautas vacía; rechaza objeto donde se espera lista, ID inseguro, valor de lectura no numérico/nulo/infinito, calidad o timestamp inválidos, variable y estado de conexión no permitidos, y campo requerido ausente. | `decodeAstronauts`, `decodeAstronautStatus`; `ContractError` en `validators.ts`. | Unitario de validación de entrada; solo cubre los ejemplos de contrato incluidos. |
| 3 | Historial, alertas y notas | Decodifica histórico y adapta unidad; convierte fecha de reconocimiento; acepta `reconocida` 0/1 y rechaza booleano/severidad inválida; adapta fecha de nota; valida recibos de nota y reconocimiento. | `decodeReadings`, `decodeAlerts`, `decodeNotes`, `decodeNoteReceipt`, `decodeAcknowledgeReceipt`; `adaptHistoricalReading`, `adaptAlert`, `adaptNote`. | Unitario de adaptadores/validadores. No envía una escritura real ni verifica UI de acuse. |
| 4 | Salud pública y rutas protegidas | Sin prefijo protegido, rechaza listado pero permite health; con prefijo, consulta listado y estado. Verifica rutas, credenciales, headers, redirect/cache y rechazo de IDs/prefijos no válidos o de respuesta asociada a otro ID. | `createAstronautApi`; cliente de `client.ts`; decodificadores de astronautas/estado. | Integración aislada cliente–API simulada; no prueba navegador, servidor, CORS ni autenticación real. |
| 5 | Normalización de errores | Mapea 400/401/404/405/500, fallo de red, JSON inválido y forma de health inválida a los errores esperados. | `createAstronautApi`, `ApiError`, `ContractError`, decodificadores. | Unitario/integración aislada de errores con `fetchImpl` falso. |
| 6 | Límite 429 | Comprueba pausa compartida entre rutas, prioridad de `Retry-After` respecto al cuerpo, valor del cuerpo cuando falta header y caso sin valor válido; verifica que no se repita la solicitud automáticamente. | `createAstronautApi`, cliente (`ApiError`). | Prueba de lógica de cliente, no de rate limiter real ni de cabeceras de un despliegue. |
| 7 | Cancelación y timeout | Distingue cancelación del llamador y timeout configurado, propaga estado cancelado a una llamada posterior y verifica el número de llamadas al fetch falso. | Cliente de `client.ts`, `createAstronautApi`. | Unitario de ciclo de solicitud; no mide latencia de red real. |
| 8 | Agrupación concurrente | Dos llamadas simultáneas sin señal comparten una petición; una llamada posterior genera una petición nueva. | Cliente de `client.ts`, `createAstronautApi`. | Unitario de deduplicación en memoria; no evalúa concurrencia entre pestañas. |
| 9 | Histórico | Verifica ruta exacta del histórico, adaptación de valor cero, unidades, timestamp, calidad y procedencia desconocida; rechaza ID inseguro y respuesta de otro astronauta. | `createAstronautApi`, `decodeReadings`, `adaptHistoricalReading`. | Integración aislada adaptador–fetch falso; no integra el gráfico ni el servidor. |
| 10 | Histórico deshabilitado / vacío / error | Sin configuración, no usa fetch; acepta array vacío; normaliza error 500. | `createAstronautApi`, `ApiError`, `decodeReadings`. | Unitario/integración aislada de cliente. |

Los módulos directamente ejercitados son `src/services/api/adapters.ts`, `astronauts.ts`, `client.ts` y `validators.ts`. Los tipos de `contracts.ts` se usan indirectamente por esos módulos; las pruebas no validan por sí mismas una respuesta de proveedor en vivo.

## 5. Pruebas PWA: comportamiento y cobertura

`frontend/tests/pwa.test.mjs` utiliza `node:test`, aserciones de Node, `readFile` y `runInNewContext`. Carga `frontend/dist/sw.js`; por tanto, cubre el artefacto generado y necesita un build previo.

| Caso | Aserciones y comportamiento comprobado | Módulos / artefactos | Tipo y límite |
| --- | --- | --- | --- |
| Manifiesto e iconos | `display`, `start_url`, `scope`, tamaños y propósito de iconos; firma PNG y dimensiones declaradas; rutas de iconos presentes en el service worker. | `dist/manifest.webmanifest`, `dist/icons/*`, `dist/sw.js`. | Prueba de artefacto compilado; no instala la PWA en navegador. |
| Ámbito de fetch del worker | Navegación del scope y recurso local obtienen respuesta del shell/cache; API, gateway, otro origen, query en icono, requests con credenciales y POST quedan fuera de ese manejo cache-first. | `dist/sw.js`, evaluado en VM con mocks de `self`/Cache. | Prueba unitaria del worker generado; no prueba navegador ni red real. |
| Instalación segura | Si un recurso del shell responde `private`, la instalación rechaza y no abre/escribe el cache. | `dist/sw.js`, fetch y cache simulados. | Prueba unitaria del worker; no verifica encabezados del servidor real. |

Estas pruebas no cubren `PwaControls.tsx`, el hook de conectividad de navegador ni el ciclo real de instalación/actualización en Chrome u otro navegador.

## 6. Distinción entre verificaciones

| Categoría | Estado en esta ejecución reportada | Qué aporta / qué no aporta |
| --- | --- | --- |
| Pruebas API | 10 aprobadas, según el preliminar. | Lógica de contrato, adaptación y cliente con fixtures/fetch simulado. No backend real. |
| Pruebas PWA | 3 aprobadas, según el preliminar. | Invariantes del manifiesto, iconos y service worker compilado en VM. No navegador real. |
| Comprobación de tipos | `npm run check` aprobado tras la corrección, según el preliminar. | TypeScript estático para los archivos incluidos en `tsconfig`. No ejecución de UI. |
| Build de producción | `npm run build` aprobado, según el preliminar. | Typecheck más generación de bundle. No aceptación funcional o visual. |
| Pruebas unitarias de componentes | No existen en el inventario frontend actual. | Sin evidencia automatizada de props, estados, callbacks ni DOM de J01–J04. |
| Pruebas de integración de UI | No hay archivo/suite de UI en `frontend/tests/` ni forman parte de los 13 casos J05 reportados. | Un informe L07 separado sí describe recorridos de integración con respuestas sintéticas en otra rama; no forma parte de esta ejecución J05 ni valida individualmente J03/J04. |
| Validación visual / accesibilidad | No se reportó para esta ejecución J05. | L07, en `feature/frontend-quality` con HEAD inicial `b6f2ce3`, documenta comprobaciones en Edge/Playwright de navegación, foco, teclado, reflujo y contraste para su integración. Es evidencia histórica separada: no debe atribuirse a esta rama ni a la aceptación individual de J01–J04. |
| Integración con backend | No ejecutada ni afirmada. | Los tests API usan `fetchImpl` falso; no verifican servidor, credenciales, CORS ni datos reales. |

No se encontraron pruebas React/DOM en `frontend/tests/` ni dependencias de testing de componentes en `frontend/package.json`. `leader-workstream/reports/L07-report.md` describe recorridos automatizados y manuales adicionales, pero no es una suite colocalizada ni una ejecución de J05 sobre esta rama. No se recomienda incorporar infraestructura o paquetes dentro de este informe.

## 7. Cobertura por entregable J01–J04

El mapeo documentado en `leader-workstream/INTEGRATION_PLAN.md` asigna `AstronautCard`, `MeasurementIndicator` y `AlertCard` a J01; `CrewView` a J02; `MeasurementsPanel` y `MeasurementTrend` a J03; y `AlertsPanel` a J04. `leader-workstream/OWNERSHIP.md` confirma la propiedad junior de los directorios de componentes y pruebas colocalizadas, pero remite a `INTEGRATION_PLAN.md` para el reparto por entregable. El informe preliminar llama a J02 “MeasurementIndicator”; la documentación disponible no resuelve esa discrepancia. Debe confirmarla el Frontend Lead antes de usar el mapeo como registro definitivo de ownership.

| Entregable según plan de integración | Prueba directa encontrada | Evidencia indirecta disponible | No cubierto / estado prudente |
| --- | --- | --- | --- |
| J01 — `AstronautCard`, `MeasurementIndicator`, `AlertCard` | Ninguna. | TypeScript/build reportados; adaptadores API prueban algunos modelos de astronauta, lecturas y alertas sin montar componentes. | Render, fallbacks, severidad/calidad, `isSimulated`, props, acciones, foco, teclado, responsive y texto accesible no probados individualmente. J01 no queda validado por estas pruebas. |
| J02 — `CrewView` | Ninguna. | TypeScript/build reportados. Los tests API no llaman a `CrewView` ni a selección/reintento de UI. | Carga inicial/recarga con datos, vacío, error/retry, selección y estados de conectividad no probados. J02 no queda validado. |
| J03 — `MeasurementsPanel`, `MeasurementTrend` | Ninguna. | API prueba adaptación de lecturas, cero, calidad, timestamp y frescura; TypeScript/build incluyen fuentes según `tsconfig`. | No prueba render de indicador, gráfica, ejes/segmentos, huecos, obsolescencia visual, tabla, filtros de rango, estados ni accesibilidad. J03 no queda validado individualmente. |
| J04 — `AlertsPanel` | Ninguna. | API prueba validación/adaptación de alertas, reconocimiento y errores; TypeScript/build incluyen componentes. | No prueba filtros, estado desconocido, carga/vacío/error, retry, callback/ID, envío, datos simulados, IDs únicos ni render. J04 no queda validado individualmente. |

La compilación general acredita que el compilador y el bundler aceptaron el conjunto que procesaron; no reemplaza pruebas funcionales específicas ni confirma que los componentes estén montados en la integración.

## 8. Correcciones y diff observado

El preliminar informa que `npm run check` falló inicialmente por propiedades incompatibles de `Stack` y que pasó tras mover estilos a `sx`. El diff local inspeccionado corresponde a estas dos correcciones:

- `frontend/src/features/alerts/components/AlertsPanel.tsx`: `alignItems="center"` pasó a `sx={{ alignItems: 'center' }}`.
- `frontend/src/features/crew/components/MeasurementTrend.tsx`: `alignItems="center"` y `flexWrap="wrap"` pasaron a `sx`, conservando `direction`, `spacing` y `useFlexGap`.

No se cambiaron archivos de configuración para atender la advertencia Vite. Esta auditoría no editó componentes ni ejecutó validaciones de código.

## 9. Recomendaciones de validación futura

Estas son recomendaciones; no se implementaron ni ejecutaron pruebas nuevas.

### J01 — tarjetas y componentes de tripulación

- `AstronautCard`: nombre ausente/blanco, ID visible, estados online/offline/desconocido, estado general independiente, contacto ausente, resumen opcional; callback recibe el ID; operabilidad por teclado/foco cuando la tarjeta sea interactiva.
- `AlertCard`: severidades conocidas y desconocida, mensaje largo/vacío, hora ausente, acuse verdadero/falso/desconocido, simulación solo cuando el prop es verdadero, callback con ID, botón deshabilitado durante `isAcknowledging`; verificar que acuse no se rotule como resolución.

### J02 — `CrewView` según plan vigente

- Carga inicial sin datos, catálogo vacío, error con/sin callback de retry, éxito con lista, selección controlada, actualización conservando tarjetas y error con datos previos.
- Comprobar que las etiquetas de conexión desconocida y los conteos no confunden conexión del nodo con disponibilidad de API; verificar nombres accesibles, teclado y layout estrecho.
- Confirmar con Lead la discrepancia de asignación de `MeasurementIndicator` antes de fijar el alcance de pruebas J01/J02.

### J03 — panel, gráfica, tabla, rangos y estados

- `MeasurementsPanel`: estados loading/success/empty/error, mensajes y retry; datos cero, unidad/fecha nulas, calidad, frescura y procedencia.
- `MeasurementTrend`: puntos desordenados por tiempo, duplicados o huecos, cortes por `sensor_fault`, series insuficientes, varias calidades, obsolescencia simultánea con cada calidad; leyenda coincidente con marcadores; rangos con límites, selección y callback; tabla conserva valor/calidad/continuidad/obsolescencia.
- Verificar texto accesible de SVG/tabla, no depender solo del color, foco y ausencia de recorte del halo a tamaños pequeños.

### J04 — panel de alertas, filtros y estados

- `all` conserva orden y estados de acuse desconocidos; `pending` solo falso; `acknowledged` solo verdadero; sin resultados y colección vacía diferenciadas.
- Loading, error personalizado y fallback, retry opcional, severidad desconocida, mensaje largo, procedencia simulada, varias instancias con IDs accesibles distintos.
- Callback de reconocimiento recibe el ID correcto; `isAcknowledging` por alerta deshabilita el botón; tras callback la UI no cambia estado de acuse hasta que el consumidor envíe props confirmadas.

## 10. Pendientes y riesgos para integración

1. Frontend Lead: confirmar el mapeo formal J01/J02 para `MeasurementIndicator` frente al informe preliminar. Hasta recibir respuesta, este informe conserva como referencia principal el plan de integración vigente y registra explícitamente la discrepancia.
2. Frontend Lead/L05: cerrar el contrato de props de J03/J04, alcance de colección/filtros, estado confirmado por servidor y callbacks autorizados; el plan de integración indica que esos acuerdos son previos al acoplamiento.
3. Ejecutar en la rama de integración `check`, build y pruebas API/PWA, conservando resultados y revisión exacta de cambios. La salida aquí citada proviene del preliminar, no de esta inspección.
4. Añadir pruebas específicas de componentes con infraestructura aprobada o documentar la decisión del Lead de mantenerlas pendientes; no hay harness actual.
5. Realizar revisión visual/responsive/teclado/foco/contraste y lector de pantalla en navegador. No hay evidencia actual de esos ensayos.
6. Coordinar con Mauricio/Lead una prueba real de navegador contra backend con acceso autorizado; el suite sintético no prueba conectividad, autenticación, CORS ni correspondencia en vivo.
7. Revisar la advertencia Vite sobre extensión de import en `vite.config.ts` durante integración. Ese archivo está protegido por el alcance de este informe y no se propone cambiarlo aquí.

## 11. Conclusión y estado de J05

Según el informe preliminar, la validación automatizada de base terminó con typecheck y build aprobados, diez pruebas API aprobadas y tres pruebas PWA aprobadas. El alcance automatizado respalda comportamiento de validadores, adaptadores, cliente HTTP y algunos invariantes del service worker/manifiesto. No aporta pruebas de UI para J01–J04, validación visual, integración real con backend ni aceptación individual de los entregables.

Por tanto, J05 queda **parcialmente documentado y pendiente de cierre de integración**: la base automatizada reportada es favorable, pero las verificaciones de composición, interfaz, navegador y backend siguen a cargo del Frontend Lead y de los responsables correspondientes. No se afirma validación individual de J01, J02, J03 o J04.

## 12. Trazabilidad de archivos

- Pruebas API: [`../tests/api.test.ts`](../../tests/api.test.ts)
- Pruebas PWA: [`../tests/pwa.test.mjs`](../../tests/pwa.test.mjs)
- Scripts y versiones: [`../package.json`](../../package.json)
- Componentes crew/J01–J03: [`../../src/features/crew/components/`](../../src/features/crew/components/)
- Componentes alerts/J01 y J04: [`../../src/features/alerts/components/`](../../src/features/alerts/components/)
- Mapeo de ownership: [`INTEGRATION_PLAN.md`](../../../leader-workstream/INTEGRATION_PLAN.md)
- Ownership por zona: [`OWNERSHIP.md`](../../../leader-workstream/OWNERSHIP.md)
- Evidencia histórica separada de L07: [`L07-report.md`](../../../leader-workstream/reports/L07-report.md)
