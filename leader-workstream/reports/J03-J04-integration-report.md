# Integración J03 y J04

**Rama** `feature/frontend-j03-j04-integration` · **Base** `96a3255` de `origin/main` · **Fuente** `origin/feature/j03-j04-measurements-alerts` en `723cd34`.

El árbol inicial estaba limpio. Se revisaron las instrucciones del repositorio, el alcance, la política médica, los informes L03, L05, L07, L08-I y L09-A, y la referencia API de Flask. La integración se verificó en navegador y con Flask local aislado. Pendiente de revisión del líder.

## Archivos incorporados

| Archivo | Ajuste |
| --- | --- |
| [MeasurementTrend.tsx](../../frontend/src/features/crew/components/MeasurementTrend.tsx) | Conserva gráfico y tabla. Corrige props de Material UI, precisión de valores, etiquetas de discontinuidad y acceso a la tabla por teclado. |
| [MeasurementsPanel.tsx](../../frontend/src/features/crew/components/MeasurementsPanel.tsx) | Conserva el uso de `MeasurementIndicator` y ajusta el ancho mínimo de columnas. |
| [Exportaciones de tripulación](../../frontend/src/features/crew/components/index.ts) | Conserva las exportaciones J01/J02 y añade componentes y tipos J03. |
| [AlertsPanel.tsx](../../frontend/src/features/alerts/components/AlertsPanel.tsx) | Cambia filtro por reconocimiento a filtro por severidad y muestra únicamente categorías presentes en la colección. |
| [Exportaciones de alertas](../../frontend/src/features/alerts/components/index.ts) | Conserva `AlertCard` y añade las exportaciones J04. |

Se recuperaron únicamente esos cinco archivos de la revisión del junior. La comparación de los dos archivos de exportación confirmó que los cambios de la fuente eran adiciones. No se reescribieron las tarjetas J01/J02 ni se fusionó la rama del junior.

## Datos y composición

- **Detalle y Monitoreo.** Detalle pasa las mediciones recientes del endpoint de estado a `MeasurementsPanel`. Monitoreo pasa las series por variable del endpoint de histórico a `MeasurementTrend`. El adaptador convierte milisegundos a segundos UNIX para el gráfico, ordena los puntos sin mutar la colección original y conserva cero, calidad y unidades L03. Actividad conserva unidad desconocida. La conexión del nodo, el error de consulta y el fallo de sensor tienen representaciones independientes.
- **Gráfica y tabla.** Las muestras con fallo se identifican en la tabla y se excluyen de la línea. Una serie con una sola muestra utilizable indica que faltan muestras para trazar la línea. El cálculo de cortes heredado se etiqueta como discontinuidad estimada de visualización. No se usa para inferir interrupción de transmisión o frescura. El histórico mantiene las 24 h y las 100 lecturas predeterminadas, sin selector de periodo.
- **Alertas.** `/alertas` consulta el catálogo y `activeAlerts` de `GET /api/astronauts/{id}/status` para el seleccionado. Se muestran severidad reportada, variable, marca temporal UTC y estado de acuse. El texto de Flask y las guías carecen de aprobación verificable en el contrato, por lo que se usa «Aviso para revisión · Contenido pendiente de validación». La vista declara procedencia no informada. El laboratorio y la prueba de navegador usaron registros ficticios identificados en el ensayo. El producto carece de un campo para confirmar esa procedencia.
- El flujo reutiliza las cancelaciones y reintentos existentes. El selector de Alertas remonta la consulta al cambiar de astronauta. Alertas también se oculta offline con el patrón de las vistas que dependen de datos. El panel se monta sin callback de acuse y no se añadieron endpoints, autenticación ni cambios al proxy.

## Verificación

| Prueba | Resultado |
| --- | --- |
| `npm run check` y `npm run build` | Pasaron. |
| `npm run test:api` | 11 pruebas aprobadas. |
| Batería Node de API, PWA, asistencia y J03/J04 | 18 pruebas aprobadas en total, incluidas las 11 de API. |
| Edge con respuestas sintéticas | Pasó a 1440, 375 y 320 px. Tripulación por teclado, Detalle, histórico vacío y cargado, gráfico y tabla, calidad, cero, decimal pequeño y marcas UTC. Pasaron Asistencia con astronauta conservado y Alertas en carga, error, reintento, vacío y filtro de severidad. Sin desbordamiento horizontal de página, errores inesperados de consola, POST ni claves API. |
| Edge a 375 px con Vite → Flask | Health 200. Catálogo, detalle, histórico y alerta filtrada visibles. La tabla mostró `0,00004 CPM` en formato local. Se observaron 12 GET, cero POST y cero solicitudes con `X-API-Key`. Flask se ejecutó en loopback, con copia temporal de código y SQLite ficticia sembrada directamente. No se ejercitó ingesta desde el simulador. |
| `git diff --check` y rutas protegidas | Pasaron. `Backend/`, `script/`, `junior-workstream/` y J01/J02 quedaron intactos. |

Desde `frontend/`, puede repetirse la batería con:

```powershell
node --experimental-strip-types --test tests/api.test.ts tests/pwa.test.mjs tests/assistance.test.mjs tests/j03-j04.test.ts
node tests/j03-j04.browser.mjs '<ruta al módulo Playwright disponible>' '<ruta al ejecutable de Edge>'
```

La prueba de navegador arranca Vite en loopback e intercepta las respuestas del catálogo, estado e histórico. Las dependencias del repositorio no cambiaron. Vite emitió un aviso para su futuro cargador nativo durante el ensayo de desarrollo. El build final pasó.

## Pendientes para la demo

- Confirmar circuito del simulador o sensor hasta Flask en el equipo de demo y mantener visible la procedencia ficticia cuando corresponda.
- Coordinar con Mauricio el acceso protegido de mismo origen para el entorno compartido y la confirmación contractual de procedencia, unidad de actividad y criterio de frescura.
- Obtener revisión expresa de mensajes y guías antes de sustituir el aviso neutral. El acuse y un historial de alertas quedan pendientes de alcance y autorización.
- Revisión humana del cambio. No hubo commits, push, merges ni despliegues.
