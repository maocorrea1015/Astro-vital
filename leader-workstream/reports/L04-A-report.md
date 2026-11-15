# L04-A · Composición de tripulación

**Rama:** `feature/frontend-crew-integration`. **HEAD inicial:** `e31c0ee`. **Estado:** L04-A verificado localmente, pendiente de revisión humana. L04 integral permanece pendiente de J01/J02 y la conexión autenticada.

## Línea base y alcance

La rama estaba limpia e incluía L01, L02 y L03. Los tipos, las 8 pruebas de API y el build pasaron antes de implementar. En esta rama, las carpetas de tripulación y alertas del junior contienen placeholders. Se consultaron su plan, progreso y fichas J01/J02 desde su rama en modo de solo lectura. Aún no hay componentes que se puedan importar.

## Composición y estados

El shell monta `CrewPage` en `#/tripulacion` y `AstronautPage` en `#/tripulacion/detalle/{id}`. El identificador se comprueba con el validador de L03. El detalle conserva la indicación de Tripulación en el menú y el foco del encabezado. La entrada genérica sin ID conserva el enlace de retorno; un ID con sintaxis inválida muestra la ruta no encontrada.

El catálogo muestra enlaces textuales por astronauta dentro del contenedor. El detalle muestra identidad, estado general informado, conexión del nodo y último contacto por separado. Las mediciones se muestran como texto con valor, unidad disponible, hora en UTC y calidad; cero sigue siendo un valor. La presentación omite la procedencia desconocida y marca la unidad de actividad sin confirmar. La UI carece de un criterio aprobado para marcar lecturas antiguas. Estos contenedores se podrán componer con J01/J02 cuando se incorporen, y carecen de tarjetas y gráficos propios.

Se distinguen consulta en curso, API no configurada, datos disponibles, catálogo o mediciones vacíos, error reintentable y recurso ausente. En el detalle sin datos disponibles, la conexión del nodo se informa como desconocida. Cambiar de ID reinicia el estado del detalle y cancela la consulta anterior. Una respuesta que llegue tras cancelarse se descarta. El reintento es explícito.

## Contrato y autenticación

La composición usa `listAstronauts(signal)` y `getAstronautStatus(id, signal)` de L03, con los modelos `Astronaut`, `AstronautStatus` y `Reading`. Usa el formateador de fechas y distingue `access-unconfigured` y `not-found`. La dependencia de consulta se puede inyectar para pruebas. En el arranque normal, se crea el cliente de L03 sin prefijo protegido y las operaciones se bloquean antes de llamar a la red. No se habilitó un intermediario, se conectó Flask ni se incorporaron claves o almacenamiento. Los contratos de L03 se conservaron.

## Archivos

| Archivo | Cambio |
| --- | --- |
| `frontend/src/app/App.tsx` | Monta catálogo y detalle e inyecta la fuente de consulta. |
| `frontend/src/app/navigation.tsx` | Construye y valida la ruta de detalle por ID. |
| `frontend/src/app/AppShell.tsx` | Mantiene la indicación de sección activa en el detalle por ID. |
| `frontend/src/app/CrewPage.tsx` | Catálogo de enlaces, estados compartidos de consulta y reintento. |
| `frontend/src/app/AstronautPage.tsx` | Contenedor textual para identidad, contacto, estado y mediciones. |
| `frontend/src/app/crewQuery.ts` | Ciclo de consulta cancelable y reinicio manual. |
| `leader-workstream/PROGRESS.md` y este informe | Seguimiento y evidencia. |

No se añadieron dependencias, scripts, configuraciones ni archivos de pruebas a la rama. Las pruebas de navegador usaron Playwright del entorno y una entrada temporal de Vite sin persistir fixtures.

## Verificaciones

| Comprobación | Resultado |
| --- | --- |
| `npm run check`, `npm run test:api`, `npm run build` | Pasaron antes y después. 8 pruebas API pasaron. |
| Edge con Playwright a 1440, 375 y 320 px | API no configurada por defecto, carga, catálogo, selección por teclado, foco del encabezado, recarga de detalle y retorno. Sin desbordamiento horizontal en las vistas verificadas. |
| Consulta y selección con respuestas sintéticas de L03 | Cero, calidad degradada, dos IDs y descarte de una respuesta tardía. Catálogo vacío, detalle sin mediciones, error 500 con reintento, 404 y ruta con ID inválido. |
| Solicitudes y consola | Cero errores de consola y cero solicitudes fetch/XHR a la API en la repetición final. Los datos sintéticos se entregaron al cliente vía fetch inyectado en la prueba. |
| `git diff --check` y alcance | Pasaron las comprobaciones de espacios y alcance. `Backend/`, `junior-workstream/`, los archivos del junior y los servicios L03 quedaron intactos. |

La primera ejecución de navegador contó imports de módulos de Vite como solicitudes de API. Al limitar el contador a fetch/XHR, los tres tamaños pasaron. No se ejecutó una prueba real contra Flask ni una auditoría completa de accesibilidad.

## Preparación de L04-B

- **Junior y líder:** incorporar J01/J02 en una revisión común, acordar props y callbacks de selección y reintento, y probar el montaje definitivo. Esta entrega no reutiliza componentes junior porque faltan en la rama.
- **Mauricio y líder:** confirmar y verificar el mecanismo de acceso de mismo origen y una respuesta representativa. Acordar procedencia, unidad de actividad y criterio de frescura.
- Tras autorización de L04-B, conectar la fuente acordada y verificar una medición trazable de emisor a pantalla. No se inició L04-B ni se realizaron operaciones Git de escritura.
