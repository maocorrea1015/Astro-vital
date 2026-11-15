# L04-B · Corrección de J01/J02 e integración de tripulación

**Rama:** `feature/frontend-crew-final-integration`. **HEAD inicial:** `7c16c52`. **Resultado:** integración visual y funcional verificada localmente, pendiente de revisión humana y de una consulta autenticada a Flask.

## Base y procedencia

El árbol inicial estaba limpio y contenía L01–L05. El commit auditado `3fb029bada4e1988ab8be4086a8ce9616fadd516` seguía siendo la punta de `origin/feature/j01-j02-crew-components`. Se leyeron los seis archivos con Git y se copiaron sus contenidos al árbol de trabajo sin integrar la rama completa. Ninguno de esos archivos existía en la rama líder.

| Archivos recuperados | Correcciones y uso |
| --- | --- |
| `frontend/src/features/crew/components/AstronautCard.tsx` | Ajuste MUI, foco dentro del borde de la tarjeta y envoltura de etiquetas largas. Estado reportado, conexión y último contacto independientes. Se retiraron las afirmaciones de ausencia de alertas y obsolescencia inferida del nodo offline. Usado en catálogo y detalle. |
| `frontend/src/features/crew/components/CrewView.tsx` | Ajuste MUI y cuadrícula que permite reducir columnas sin forzar desbordamiento. Se reutilizan carga, vacío, error, reintento y selección. |
| `frontend/src/features/crew/components/MeasurementIndicator.tsx` | Ajuste MUI, encabezado y reflujo. Formato localizado que conserva valores pequeños, con notación científica cuando conviene y callback opcional para una política de precisión por variable. Cero, ausencia, calidad degradada y fallo se distinguen. La unidad nula se informa como pendiente. Usado en detalle y monitoreo. |
| `frontend/src/features/crew/components/index.ts` | Reexportaciones originales de componentes y tipos. |
| `frontend/src/features/alerts/components/AlertCard.tsx` | Dos ajustes MUI. Se admite `info` y se distingue de `unknown`. Acuse conserva su semántica de reconocimiento. Se retiró la prop y el bloque de guía, y el componente queda sin montar en la aplicación. |
| `frontend/src/features/alerts/components/index.ts` | Reexportaciones originales de componente y tipos. |

Los cinco usos de `flexWrap` se trasladaron a `sx`. Los stacks que repetían `spacing` y `gap` conservan una sola declaración de espaciado. No se instalaron ni se actualizaron paquetes.

## Composición y contratos

- `frontend/src/app/telemetryPresentation.ts` adapta explícitamente los modelos L03 `Astronaut` y `Reading` a props. Formatea fechas en UTC y preserva valores, unidad nullable y calidad. Deja la obsolescencia sin clasificar hasta que exista una política aprobada.
- `frontend/src/app/CrewPage.tsx` conserva el estado API no configurada y monta `CrewView` para carga, vacío, datos y error. El contenedor controla la consulta, el reintento y la navegación por ID. Las tarjetas quedan sin acceso a red.
- `frontend/src/app/AstronautPage.tsx` reemplaza la presentación mínima por `AstronautCard` y `MeasurementIndicator`. Conserva el retorno, los estados excepcionales y la separación entre contacto y hora de muestra.
- `frontend/src/app/TelemetryPanel.tsx` reutiliza el mismo indicador y adaptador para el histórico L05. Conserva selección, navegación y consulta cancelable.
- Se mantienen los servicios, DTO, autenticación y ciclo de consulta de L03–L05. La opción de acuse de `AlertCard` queda disponible únicamente como callback presentacional optativo. No se montó ni conectó a ninguna operación real.

## Verificaciones

| Comprobación | Resultado |
| --- | --- |
| `npm run check` y `npm run build` | Pasaron antes y después. Los cinco errores `TS2769` de la auditoría no se reprodujeron tras la corrección. |
| `npm run test:api` | 10 pruebas pasaron antes y después. Incluyen validación, unidades, acceso deshabilitado, timeout y cancelación. |
| Edge con Playwright, 1440, 375 y 320 px | Selección por teclado, foco visible y foco en encabezado, recarga, navegación a monitoreo, texto largo, carga, catálogo vacío, ausencia de lecturas, error y reintento. |
| Casos de mediciones y alertas | Cero exacto, decimal pequeño, formato personalizado, dato ausente, degradación, fallo y unidad pendiente. Avisos `info` y `unknown`, reconocimiento visible y ausencia de acción y guía en la composición de prueba. |
| Respuestas tardías, red y consola | Se observó abortar la consulta anterior y se comprobó el descarte de su respuesta. La ejecución final registró cero desbordamientos horizontales, errores de consola y solicitudes reales a la API. |
| `git diff --check` y protección de rutas | Se revisaron diffs y espacios, incluidos los archivos nuevos. Se conservaron `Backend/`, `junior-workstream/`, configuración y dependencias. Las referencias del junior no cambiaron. |

La prueba de navegador usó respuestas sintéticas inyectadas en una entrada temporal de Vite. No se guardó esa entrada en el repositorio. La revisión de accesibilidad abarcó teclado, foco y reflujo; no se ejecutó una auditoría integral. Tampoco se ejecutó una consulta real autenticada.

## Estado y dependencias

La composición visual de L04 con J01/J02 y el uso del indicador en L05 quedaron verificados localmente. La revisión humana sigue pendiente. **L04 integral continúa abierto** hasta verificar una consulta autenticada con Flask y una lectura trazable.

Mauricio y el líder deben confirmar revisión y acceso seguro desde el mismo origen, ejemplo representativo de lectura, procedencia, unidad de actividad y criterio de frescura. El uso de mensajes y cualquier acuse o guía requieren el alcance y las revisiones correspondientes. J03, J04 y J05 quedan fuera de este cierre. L06 no se inició. No hubo commits, push, merges ni despliegues.
