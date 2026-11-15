# L09-A · Estructura de asistencia interactiva

**Rama:** `feature/frontend-assistance`. **HEAD inicial:** `fe5a09c`. **Estado:** flujo no clínico verificado localmente, pendiente de revisión humana. L09-B queda pendiente de aprobación de contenido y alcance.

## Alcance y flujo

El árbol inicial estaba limpio. Se revisaron las instrucciones aplicables, la política médica, la ficha existente `L09-assistance.md` y los informes previos. La ficha integral deja la asistencia clínica condicionada. El encargo L09-A habilita únicamente la estructura no clínica.

1. **Asistencia** se abre desde el menú principal sin alerta. Desde Detalle o Monitoreo, el enlace conserva el ID de la ruta y lo propone en el selector si aparece en el catálogo.
2. La página consulta el catálogo de L03 y distingue carga, API sin configurar, error con reintento, vacío e ID ausente. La interfaz permite confirmar únicamente un integrante disponible.
3. La confirmación crea una sesión local en memoria y lleva el foco al encabezado de confirmación. Cambiar de astronauta descarta esa sesión. El catálogo de preguntas aprobadas está vacío, por lo que la pantalla dice **«El cuestionario de asistencia está pendiente de validación médica»**. El flujo actual carece de preguntas, respuestas, guías y confirmaciones de guardado.
4. Se puede regresar al detalle con el ID conservado o a Tripulación. La navegación y el shell mantienen su comportamiento offline. Al desconectarse se retira la vista que depende del catálogo, igual que en Tripulación y Monitoreo.

## Archivos y responsabilidades

| Archivo | Cambio |
| --- | --- |
| `frontend/src/app/navigation.tsx` | Destino hash de asistencia e ID contextual validado. |
| `frontend/src/app/AppShell.tsx` y `App.tsx` | Montaje, enlace contextual, sección activa y tratamiento offline. |
| `frontend/src/app/AssistancePage.tsx` | Selector, confirmación, disponibilidad limitada y salida segura. Reutiliza el estado de consulta y reintento de L04-A. |
| `frontend/src/app/assistanceSession.ts` | Modelo local tipado para opción única y múltiple, respuestas, correcciones, avance, regreso y progreso. Los cambios de paso y respuesta se probaron con estructuras neutras. La UI actual no ejecuta preguntas. |
| `frontend/src/app/assistanceContent.ts` | Fuente separada para definiciones aprobadas, inicialmente vacía. |
| `frontend/tests/assistance.test.mjs` | Dos pruebas de sesión, catálogo vacío y transiciones con definiciones de prueba no clínicas. |
| `leader-workstream/PROGRESS.md` y este informe | Registro de estado y verificación. |

No se añadieron dependencias, rutas HTTP ni cambios de contrato. La página solo usa `listAstronauts` del cliente L03. No consume `guia_actual`, escribe datos o persiste sesión.

## Verificaciones

- Pasaron `npm run check`, `npm run build`, `npm run test:api` (**11 pruebas**) y `node --experimental-strip-types --test tests/pwa.test.mjs` (**3 pruebas**) desde `frontend/`.
- Pasaron **2 pruebas** con `node --experimental-strip-types --test tests/assistance.test.mjs`. Cubren catálogo sin contenido aprobado, cardinalidad de la respuesta, avance condicionado, regreso y corrección.
- Edge con una entrada temporal de Vite y catálogo sintético a **1440, 375 y 320 px**: apertura manual, operación por teclado, foco visible, confirmación, mensaje pendiente, contexto desde detalle y monitoreo, regreso, ID ausente, vacío, reintento y reconexión. Cero solicitudes de escritura, solicitudes reales a API, errores de consola o desbordamiento en las vistas comprobadas.
- **Flask real en loopback**, con SQLite temporal y su registro ficticio de ejemplo `astro-01`: Edge obtuvo el catálogo mediante el proxy optativo de desarrollo, confirmó el integrante y volvió a su detalle. Las cuatro solicitudes API observadas fueron GET y ninguna llevó `X-API-Key`. Sin errores de consola. No se usaron registros personales ni un backend compartido. El servidor y directorio temporal se cerraron y limpiaron.
- `git diff --check` y la comprobación de los archivos nuevos pasaron. Los hashes mantienen intactos `Backend/`, `script/`, `junior-workstream/` y los componentes del junior. Sin commits, push, merges o despliegues.

La revisión de accesibilidad cubrió teclado, foco, etiqueta del selector y reflujo en esos recorridos. No constituye una auditoría WCAG completa. El aviso de Vite sobre su cargador nativo futuro apareció en el entorno de prueba, sin bloquear el build.

## Dependencias para L09-B

- El equipo y el profesional designado deben aprobar alcance, audiencia, preguntas, opciones y contenido versionado antes de montar el cuestionario.
- Cualquier registro de sesión o envío requiere acuerdo de privacidad, persistencia y contrato. La estructura actual vive en memoria y se descarta al salir.
- Mauricio y el líder mantienen pendiente la autenticación compartida. La prueba Flask anterior acredita solo el catálogo de un entorno de prueba aislado.
- El siguiente entregable requiere autorización. L09-A queda para revisión del líder.
