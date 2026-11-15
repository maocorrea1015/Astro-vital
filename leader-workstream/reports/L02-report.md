# L02 · Informe técnico del shell

**Rama:** `feature/frontend-app-shell`. **HEAD inicial:** `39957f2`. **Estado:** VERIFICADO técnicamente, pendiente de revisión humana.

## Implementación

La base de L01 compiló antes del cambio. L02 reutiliza su entrada React, su tema Material UI y sus scripts npm. `AppShell` encapsula encabezado, navegación y región principal. La navegación es lateral en escritorio y se convierte en una cuadrícula de enlaces en pantallas pequeñas. El enlace activo combina texto subrayado, peso y `aria-current`. Un enlace para saltar al contenido y el foco del encabezado al cambiar de ruta facilitan el recorrido con teclado.

| Fragmento | Vista |
| --- | --- |
| Sin fragmento o `#/` | Inicio |
| `#/tripulacion` | Tripulación |
| `#/tripulacion/detalle` | Contenedor de detalle sin identidad seleccionada |
| `#/monitoreo` | Monitoreo |
| `#/alertas` | Alertas |
| Otros fragmentos | Sección no encontrada y enlace para volver a Inicio |

Se eligieron enlaces nativos y eventos `hashchange` para conservar el destino tras recarga y usar el historial del navegador. El host sirve la entrada sin reglas de reescritura para estas rutas. La UI de detalle usa una ruta genérica hasta que L04 acuerde cómo recibir un identificador. Estado del sistema queda fuera de L02 porque aún carece de una fuente de conectividad.

## Archivos

- `frontend/src/app/App.tsx` (modificado). Selección de contenedor, mensajes de integración pendiente y retorno.
- `frontend/src/app/AppShell.tsx` (nuevo). Estructura MUI responsive, landmarks, navegación y foco.
- `frontend/src/app/navigation.tsx` (nuevo). Destinos y lectura reactiva del fragmento.
- `leader-workstream/PROGRESS.md` (modificado) y este informe (nuevo).
- Sin cambios de dependencias, lockfile, tema o configuración.

## Verificaciones

| Verificación | Resultado |
| --- | --- |
| `npm run build` antes de implementar | L01 compiló en esta rama. |
| `npm run check` y `npm run build` después de implementar | Comprobación TypeScript y build Vite correctos. |
| Lint y runner de pruebas del proyecto | El manifiesto carece de estos scripts. La prueba de navegador usó Playwright del entorno, fuera de las dependencias del proyecto. |
| Edge sobre build de producción servido con Vite preview en loopback | HTTP 200. Prueba repetida a 1440, 375 y 320 px. Menú lateral a 1440 px, dos columnas a 375 y 320 px. Sin desbordamiento horizontal. |
| Navegación y teclado | Tab y Enter, salto al contenido, foco visible del enlace, foco de encabezado en navegación, `aria-current`, detalle y retorno, recarga directa, historial atrás/adelante y recuperación de ruta desconocida. |
| Consola y solicitudes de datos | Cero errores de consola y cero solicitudes fetch/XHR en el recorrido final para los tres tamaños. |
| Diff y rutas protegidas | Solo las cinco rutas enumeradas cambiaron respecto a la línea base. `git diff --check` y comprobación de espacios en archivos nuevos pasaron. Los hashes de `Backend/` y del resto de archivos preexistentes fuera del alcance coinciden. |

Durante la primera compilación se detectaron propiedades de estilo incompatibles con la versión de MUI. Se trasladaron a `sx` y la repetición pasó. La prueba de teclado se repitió desde carga limpia para el orden inicial de tabulación, y la recarga se verificó por separado en la ruta de detalle. La evidencia disponible es la salida de la prueba de navegador. No se guardaron capturas. La revisión de accesibilidad se acota a semántica, foco, teclado y reflujo del shell; el recorrido integrado se verificará en L07.

## Integración y pendientes

- **L04 / J01–J02.** Reemplazar el contenedor de tripulación y montar tarjetas o `CrewView` cuando estén disponibles. Acordar ID de selección, evento de selección y reintento y estados de carga, vacío y error. El líder mantiene navegación y composición.
- **L05 / J01, J03 y J04.** Montar indicadores, tendencias y panel de alertas en sus contenedores. Acordar props de datos, intervalo y filtros y callbacks que se autoricen. Los componentes junior y sus pruebas permanecen en sus rutas de propiedad.
- **L03.** Acceso seguro y adaptación de API siguen pendientes, sin cambios de contrato en L02. La interfaz actual carece de datos conectados. PWA e integración de conectividad quedan para L06.
- El trabajo se detuvo al completar L02. La revisión humana y cualquier operación Git se realizan por separado.
