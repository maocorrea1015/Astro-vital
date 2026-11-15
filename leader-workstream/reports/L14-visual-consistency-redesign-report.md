# L14 · Rediseño visual y funcional de los módulos

**Rama** `feature/frontend-mission-control-redesign` · **Base Git** `17e7338` con L13 autorizado en el árbol de trabajo · **Estado** listo para revisión visual del líder.

Se revisaron los AGENTS aplicables, la propuesta definitiva, L09-B, L10-B, L11 y L13, las rutas, el tema, la PWA, los modelos y servicios API y las pruebas. Las cuatro referencias ilustradas se usaron para la composición y jerarquía. Las identidades, valores, estados y textos clínicos que aparecían en ellas no se incorporaron como datos o contratos.

## Diagnóstico y sistema compartido

| Vista anterior | Cambio L14 |
| --- | --- |
| Tripulación dependía del listado y el salto a detalle. | Lista visual, mapa interactivo y perfil del seleccionado con indicadores y acciones contextuales. |
| Monitoreo usaba un desplegable y varias gráficas apiladas. | Tarjetas horizontales, selector de variables, una gráfica J03 en foco, exploración de muestras, comparaciones y figura complementaria. |
| Alertas mostraba un selector y una tarjeta en un área reducida. | Resumen por severidad, colección activa filtrable, lista priorizada y detalle contextual. |
| Asistencia usaba un formulario y un bloque angosto. | Selección visual y contexto, figura y pregunta central cuando exista, respuestas como tarjetas y barra inferior de acciones. |

[AppShell](../../frontend/src/app/AppShell.tsx) aplica a los módulos la navegación horizontal, el ancho y los espacios de Inicio. Mantiene foco, enlace de salto, estado activo y controles PWA. [MissionModules](../../frontend/src/app/MissionModules.tsx) y [estilos](../../frontend/src/app/mission-modules.css) comparten paneles, selector, identidad, indicadores circulares y estados vacíos. La figura SVG L13 se reutiliza en los módulos. En Asistencia opera como ilustración contextual. Inicio conserva su composición y colores aprobados.

La selección de astronauta se comparte por ID en la aplicación. Monitoreo, Alertas y Asistencia admiten rutas contextuales. Las rutas anteriores siguen disponibles. Cambiar de astronauta cancela las consultas de la selección anterior. La lista visual y los detalles extensos disponen de desplazamiento dentro de su área cuando hace falta.

## Interacciones y decisiones sobre datos

- **Tripulación.** Con catálogo disponible, la selección inicial segura es el primer astronauta salvo que haya un ID contextual. Los totales de conexión se derivan del catálogo. El recuento de avisos activos se toma del estado consolidado del seleccionado. Los anillos comunican calidad con texto y color. Todos son contornos completos para evitar sugerir una puntuación de salud o una proporción que el contrato no calcula.
- **Monitoreo.** Monta una sola gráfica J03 por variable y conserva la tabla accesible. Los botones de muestra anterior y siguiente muestran su valor, calidad y hora. Promedio, mínimo y máximo usan la misma variable y unidad y excluyen fallos de sensor. Se muestran con al menos dos muestras utilizables. Las barras cuantifican las muestras por calidad de la serie seleccionada. El intervalo sigue siendo 24 h con hasta 100 lecturas de todas las variables. Las métricas ausentes muestran su estado.
- **Alertas.** Los totales y filtros corresponden a las alertas activas del astronauta seleccionado, con la taxonomía del proveedor. El orden es severidad y fecha descendente. El detalle reutiliza `AlertCard` con el texto neutral aprobado para presentación. La medición mostrada se identifica como última muestra disponible, que puede corresponder a otro momento. La vista carece de historial global, recuento de reconocidas y gráfica temporal de actividad porque ese conjunto no se consulta en el alcance actual. Se conservan procedencia desconocida y guía pendiente.
- **Asistencia.** La preparación de sesión permite confirmar, volver o cancelar con el catálogo pendiente. El contenido aprobado mostraría su pregunta y progreso en el centro, sus opciones a la derecha y los controles al pie. El estado en memoria de L09-B se conserva al cambiar de módulo. La prueba con contenido no clínico verificó selección única y múltiple, corrección retrocediendo, finalización y cancelación. El catálogo de producto sigue vacío y pendiente de aprobación médica.
- **Ausencia y error.** Paneles con estados de selección, vacío, consulta en progreso, fallo y recuperación. La PWA conserva navegación y contexto sin datos al desconectarse. Se mantuvieron contrato, adaptadores, validación JSON y seguridad. Los módulos solo consumen las lecturas GET existentes.

## Resultados de verificación

| Prueba | Resultado |
| --- | --- |
| `npm run check`, `npm run build`, `git diff --check` | Pasaron. |
| Pruebas automatizadas Node | **20/20**. API 11, PWA 3, Asistencia 4 y J03/J04 2. |
| Regresiones Edge J03/J04 y L13 | Pasaron. Se adaptaron las interacciones de prueba a los selectores visuales y al gráfico por variable. Se mantuvieron las comprobaciones de datos, estados, filtros, teclado, asistencia contextual y ausencia de escrituras. |
| [Regresión visual L14](../../frontend/tests/mission-modules.browser.mjs) | Pasó en **1440, 1366, 1024, 768, 375 y 320 px**. Verificó Inicio, las cuatro vistas, selección compartida, figura por teclado, cambio de indicador, tabla, filtro, catálogo vacío, reintento, asistencia y ausencia de overflow horizontal. |
| PWA | Build en Edge con recarga offline, figura en Inicio y comprobación de texto al 200 % en 1440, 375 y 320 px. La verificación manual con lector de pantalla y el equipo de presentación sigue pendiente. |
| Flask y simulador | Instancia aislada en loopback con SQLite temporal. Dos lotes normales persistieron diez lecturas y el lote anómalo elevó el total a 15. La API devolvió dos alertas activas, incluida una crítica de frecuencia cardíaca de **143,5 bpm**, UNIX **1794740215**. Se comprobó su uso en el resumen, Tripulación, Monitoreo, Alertas y la entrada de Asistencia para `astro-01`. React emitió **28 GET, cero POST y cero `X-API-Key`**. |

### Alto de documento observado

Medición con los fixtures declarados y zoom normal. Las listas y tablas extensas admiten desplazamiento local. Ventanas cortas, tabletas y móviles permiten desplazamiento vertical de la página.

| Viewport | Inicio | Tripulación | Monitoreo | Alertas | Asistencia |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1440 × 900 | 900 | 900 | 900 | 900 | 900 |
| 1366 × 768 | 893 | 768 | 876 | 862 | 768 |
| 1024 × 900 | 906 | 900 | 951 | 906 | 900 |
| 768 × 900 | 1247 | 1175 | 1559 | 1121 | 1094 |
| 375 × 900 | 2064 | 1799 | 2159 | 1578 | 1633 |
| 320 × 900 | 2174 | 1950 | 2259 | 1813 | 1714 |

Al revisar la primera composición, un límite heredado de ancho y los espacios del selector y la gráfica apilaban más contenido del necesario. Se amplió el contenedor y se compactaron la gráfica, las barras y el detalle de Alertas. La prueba exige que 1440 × 900 conserve las cinco vistas dentro del viewport y permite el reflujo en alturas menores.

## Capturas reales de Edge

Las capturas de contenido llevan el rótulo **Datos sintéticos · ensayo local**. Provienen del código ejecutado y del transporte interceptado de la suite. Los nombres, lecturas y preguntas de ese ensayo permanecen en la suite de navegador y fuera del bundle de producto.

| Pantalla | Escritorio | Móvil |
| --- | --- | --- |
| Tripulación | [1440 px](evidence/L14/tripulacion-1440.webp) | [375 px](evidence/L14/tripulacion-375.webp) |
| Monitoreo | [1440 px](evidence/L14/monitoreo-1440.webp) | [375 px](evidence/L14/monitoreo-375.webp) |
| Alertas | [1440 px](evidence/L14/alertas-1440.webp) | [375 px](evidence/L14/alertas-375.webp) |
| Asistencia | [1440 px](evidence/L14/asistencia-1440.webp) | [375 px](evidence/L14/asistencia-375.webp) |

[Tripulación sin datos](evidence/L14/tripulacion-vacia-1440.webp) · [Inicio conservado](evidence/L14/inicio-1440.webp)

Para repetir el ensayo desde `frontend/`, con Playwright y Edge disponibles:

```powershell
node tests/mission-modules.browser.mjs '<ruta al módulo Playwright>' '<ruta a Edge>' '<directorio temporal para capturas>'
```

## Revisión pendiente

- El cuestionario de producto necesita la versión aprobada del catálogo. L11 mantiene pendientes el criterio de antigüedad y la procedencia demostrable por alerta.
- A 1366 × 768, Inicio, Monitoreo y Alertas necesitan desplazamiento vertical. A 1024 también lo necesita parte del recorrido. La tabla anterior documenta las medidas, sin atribuirles el resultado de 1440 × 900.
- Quedan pendientes la prueba con lector de pantalla, la revisión con usuarios nuevos y la demostración en el dispositivo final.
- Se conservaron las modificaciones previas de L13 y se respetaron las rutas de backend, simulador, componentes del junior, servicios API y PWA. No hubo commits, push, merges ni despliegues.
