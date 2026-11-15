# J03 · Mediciones y tendencias

**Objetivo.** Mostrar mediciones individuales e histórico sin interpretar clínicamente la evolución. Depende de J02 verificado, el indicador J01 y las unidades y modelos de presentación disponibles.

**Rutas autorizadas.** `frontend/src/features/crew/components/MeasurementsPanel.tsx`, `MeasurementTrend.tsx` y sus pruebas colocalizadas con el mismo nombre base y extensión `.test.tsx`. Registra informe y progreso.

## Entradas y presentación

- Panel: indicadores adaptados, orden o agrupación proporcionados y estado de consulta. Reutilizar J01. Mostrar unidad confirmada, hora, calidad, ausencia y obsolescencia suministrada. Una métrica ausente permanece ausente; cero se presenta como dato.
- Tendencia: etiqueta, unidad confirmada opcional, intervalo, conjunto de puntos con hora ordenable, valor y calidad, y estado de consulta. Presentar puntos en orden temporal, sin mutar las props. El líder suministra la semántica de hora y filtros; cualquier cambio de intervalo aprobado se comunica por callback, sin consultar la API.
- Cero puntos válidos: mostrar estado vacío. Un punto válido: mostrar lectura individual y avisar que faltan muestras para tendencia. Los huecos y datos averiados se distinguen de valores válidos y se evita conectarlos de manera engañosa. Señalar degradación u obsolescencia, sin inventar umbrales, cadencia o unidades.
- Proveer representación gráfica compatible con el proyecto y alternativa textual o tabla con tiempos y valores. Usar etiquetas legibles, adaptar espacio, preservar orden y comunicar series sin depender del color. Priorizar HTML/SVG local o el medio ya disponible. Una biblioteca nueva exige solicitud con justificación e impacto; el líder decide.

## Prueba y aceptación

Ejercitar series vacías, de un punto, desordenadas, con cero, huecos y calidad mixta; verificar orden y etiquetas de unidad y tiempo. Revisar mensajes de carga y error, tamaños de pantalla y acceso a alternativa textual. El gráfico y la tabla deben representar los mismos puntos trazables. El líder conecta rangos, consulta y datos. Si falta semántica de muestras, unidad o un medio de render aprobado, registra el bloqueo. Envía evidencia y avanza a J04 tras verificar.
