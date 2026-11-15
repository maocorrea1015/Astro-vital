# L07 · Informe de calidad e integración

**Rama:** `feature/frontend-quality`. **HEAD inicial:** `b6f2ce3`. **Dictamen:** estabilización comprobada localmente, pendiente de revisión humana, de conexión autenticada y de verificación de la ventana instalada.

## Línea base

Árbol limpio. L01–L06 presentes, incluidos J01/J02 corregidos mediante L04-B y el manifiesto y worker de L06. Se revisaron las instrucciones, fichas y los informes L03–L06, y el plan y los límites del junior en solo lectura. Antes de editar pasaron los tipos, el build, 10 pruebas de API y 3 de PWA. Los hallazgos de foco y reflujo se reprodujeron en Edge con una fuente de pruebas inyectada.

## Hallazgos y correcciones

| Severidad | Hallazgo y evidencia inicial | Resultado |
| --- | --- | --- |
| Media | Activar Reintentar por teclado sustituía el botón por el estado de carga. El foco caía en `BODY`. | El reintento dirige el foco al encabezado que permanece montado. Se comprobó recuperación del catálogo y foco en el encabezado. |
| Media | La desconexión retiraba el selector enfocado de Monitoreo y el foco caía en `BODY`. | Si la transición offline desmonta el control y el foco queda en el cuerpo, el shell enfoca el encabezado. Conserva el foco que aún esté en otro control. |
| Media | Tripulación a 320 px con tamaño de texto al 200% alcanzaba 350 px de ancho. Las cajas de texto del enlace de navegación, H1 y etiquetas de estado superaban el viewport. | Los enlaces y H1 pueden partir palabras cuando es necesario y las etiquetas de estado de AstronautCard refluyen. La repetición midió 320 px sin desbordamiento. |
| Baja | El servidor de prueba de Vite emitió un aviso sobre una extensión de importación que requiere su cargador nativo futuro. | No bloquea scripts ni navegador actuales. Configuración sin cambios. |
| Alta · dependencia externa | La autenticación y una lectura real de extremo a extremo con Flask siguen sin verificar. | Pendiente de Mauricio y el líder. Sin accesos improvisados ni datos ficticios en producción. |
| Media · verificación pendiente | No se pudo comprobar la apertura desde el icono instalado con Edge headless. | Se intentó en perfil temporal. El intento no produjo evidencia concluyente del lanzamiento. La instalación y desinstalación documentadas en L06 siguen siendo el antecedente. |

No aparecieron otros defectos críticos o altos reproducibles en los escenarios locales ejecutados.

## Archivos modificados

- `frontend/src/app/AppShell.tsx` y `frontend/src/app/navigation.tsx`: foco estable y reflujo del shell.
- `frontend/src/app/crewQuery.ts`: conserva la navegación por teclado al reintentar.
- `frontend/src/features/crew/components/AstronautCard.tsx`: corrección mínima de reflujo de las etiquetas integradas mediante L04-B, dentro de la excepción autorizada por L07.
- `leader-workstream/PROGRESS.md` y este informe.

## Matriz de verificación

| Módulo | Evidencia |
| --- | --- |
| Navegación | Inicio, Tripulación, Monitoreo y contenedor de Alertas; enlaces, URL directa, recarga de detalle e histórico, historial atrás/adelante y selección preservada en Monitoreo. |
| Tripulación | API no configurada, carga, vacío, selección por teclado, identidad, estado reportado, conexión, contacto, respuesta cancelada o tardía y retorno al catálogo. |
| Monitoreo | Selección, histórico, cambio durante una consulta, aborto y descarte de respuesta, cero, decimal pequeño, degradación, fallo, hora UTC, actividad sin unidad y CPM sin conversión. Se verificó el estado vacío. El intervalo y límites predeterminados se contrastaron con las referencias de L05. |
| Errores | HTTP 500 y reintento, JSON inválido y contrato incompatible en UI con fuente sintética. HTTP 429, timeout, cancelación y deduplicación cubiertos por la suite API. |
| Alertas | La ruta sigue como contenedor pendiente. Se montó AlertCard de forma aislada con cuatro severidades, fecha y estados de reconocimiento. Sin guía ni botón de acuse en esa composición. |
| PWA | Build de producción en loopback: manifiesto, iconos, worker y seis entradas estáticas. Recarga offline servida por el worker, navegación por hash, reconexión y exclusión de JSON bajo API y prefijo de acceso. Segunda revisión sintética quedó en espera sin recarga y activó tras el cierre. La apertura standalone sigue pendiente. |
| Accesibilidad y responsive | Edge con Playwright a 1440, 768, 375 y 320 px. Salto a contenido, operación por teclado, foco visible y estabilidad tras reintento y desconexión, etiqueta del selector, estados anunciables y etiquetas largas. Sin desbordamiento al tamaño normal. En Tripulación, texto al 200% sin desbordamiento en los cuatro anchos. Contraste mínimo calculado de los enlaces de navegación: 10,17:1. |

Los recorridos funcionales se probaron con respuestas sintéticas identificadas y una entrada Vite temporal. La PWA se comprobó por separado con el build real servido en loopback. No quedaron fixtures en el producto. La ejecución final de los recorridos de UI registró cero errores de consola y cero solicitudes reales de datos. La revisión de código fue manual; las interacciones y mediciones indicadas fueron automatizadas. No se ejecutó una auditoría WCAG completa, pruebas con lector de pantalla ni con dispositivos físicos.

## Seguridad, pruebas finales y alcance

Pasaron `npm run check`, `npm run build`, `npm run test:api` (10 pruebas), `node --test tests/pwa.test.mjs` (3 pruebas después del build) y `git diff --check`. No hay script de lint configurado. Inspección estática y escaneo de patrones sobre frontend y recursos del build sin hallazgos de credenciales privadas. No se agregaron claves, variables públicas sensibles, almacenamiento persistente ni registros de datos de astronautas. Las pruebas offline verificaron que las respuestas API sintéticas no quedaran en caché ni se recuperaran tras el corte. Los contratos, worker y política de autenticación se conservaron.

El alcance del diff y los hashes confirmaron `Backend/`, `junior-workstream/` y los demás archivos preexistentes fuera del entregable. La rama del junior quedó intacta. No se instalaron paquetes ni se ejecutaron commits, push, merges o despliegues.

## Pendientes de entorno y revisión

- **Mauricio y líder:** acceso autenticado desde el mismo origen, lectura trazable, procedencia, unidad de actividad y criterio de frescura. La conexión real con Flask sigue sin probarse.
- **Equipo de demo:** confirmar origen y navegador objetivo, y abrir la PWA desde su icono en sesión interactiva para verificar standalone y navegación. No se declara evidencia de lanzamiento nativo.
- Históricos y alertas mantienen el alcance previo. Los componentes pendientes, el acuse real y el contenido clínico requieren sus acuerdos correspondientes.
- Se concluye L07 localmente para revisión humana. L08 y L09 quedan sin iniciar.
