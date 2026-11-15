# L15-B · Evaluación rápida de Asistencia

**Rama** `feature/medical-mvp-final` · **Base** `2f5f01b` con L15 en el árbol · **Estado** recorrido demostrativo verificado, pendiente de revisión humana.

## Corrección de experiencia

L15 agrupaba varias preguntas en un panel con scroll y mostraba el resultado como una lista de respuestas y referencias. L15-B dedica la columna central a una sola pregunta o al resultado. A la izquierda conserva persona, conectividad, hora, valor y calidad de FC, SpO₂ y temperatura cuando existen. A la derecha presenta estado de la evaluación, incertidumbre, contexto del aviso y acceso a apoyo y fichas. El resultado muestra hasta tres situaciones sustentadas. El detalle de respuestas, sensores adicionales, correcciones, reinicio y copia vive en un diálogo. La figura existente se conserva en la entrada.

El recorrido rápido pregunta **Q01 → Q02 → Q06a → Q06b** y luego muestra el resultado. Q03, Q04, Q07 y Q08a/b son complementarias y pueden abrirse individualmente desde **Revisar y corregir**. Al corregir una respuesta se vuelve directamente al resultado. Q05 permanece excluida. Las opciones indeterminadas se cuentan aparte de las preguntas pendientes. La sesión conserva datos al cambiar de ruta y requiere inicio manual. Al entrar desde Alertas, el ID del aviso se conserva y se comprueba contra las alertas activas del astronauta seleccionado. Un aviso ausente se identifica como tal. El valor del aviso se distingue de las últimas muestras.

## Interpretación del prototipo

[Motor local](../../frontend/src/app/observationInterpretation.ts) separa observaciones declaradas, avisos de Flask y estado de las mediciones. Las etiquetas **Priorizar contacto**, **Solicitar valoración** e **Información insuficiente** organizan la presentación. La primera destaca una alerta crítica ya reportada o la combinación declarada de falta de respuesta y respiración anormal. Su función es mantener visible el contacto conforme al procedimiento autorizado de la misión, sin esperar a terminar el cuestionario. **No constituye triaje clínico validado.**

Las situaciones visibles se apoyan en respuestas explícitas o el aviso cardiovascular crítico ya reportado por Flask. Incluyen falta de respuesta, respiración anormal, entorno o alarma reportados, EVA, trauma, antecedente de atragantamiento y fluidos visibles. Los recuentos de calidad, timestamps y datos ausentes contextualizan lecturas. Una observación respiratoria distinta de un aviso de SpO₂ se muestra como evidencia que requiere contraste. Un sensor fallido, una muestra nominal o una muestra ausente no confirman ni descartan observaciones. No se aplican rangos clínicos ni criterios de frescura.

La trazabilidad se conserva desde la ficha investigativa v0.1 en el [catálogo documental](../../frontend/src/app/observationContent.ts) y las fichas C-01 a C-03. La guía, las maniobras, las prescripciones y los diagnósticos quedan fuera. La recomendación de contacto remite al procedimiento ya autorizado de la misión. El catálogo operativo sigue `pending` y la interfaz de demo permanece aislada a desarrollo en loopback.

## Verificación

- Pasaron TypeScript, build, **25/25 pruebas automatizadas** y `git diff --check`. Los casos nuevos cubren orden rápido, optativas, Q05 excluida, señales discordantes, ausencia de datos y sensores fallidos. La inspección de los JS compilados confirmó que el contenido demostrativo y sus reglas de presentación quedan fuera del build operativo.
- [Regresión en Edge](../../frontend/tests/observation-demo.browser.mjs) a **1440 × 900, 1366 × 768, 1024 × 900, 768 × 900, 375 × 900 y 320 × 900**. Verificó entrada, Q01/Q02, entorno, alternativa indeterminada, optativa, corrección, diálogo, cancelación, navegación contextual, conservación al regresar, desconexión y resultado sin datos. Todas las resoluciones pasaron el control de ancho horizontal.
- A **1440 × 900 y 1366 × 768**, la prueba verificó el alto del documento, que pregunta y resultado no tienen scroll interno, y que sus controles principales caben. Una primera iteración a 1366 excedía el alto. Se movió el selector de astronauta a un diálogo y se dispusieron las situaciones del resultado en horizontal.
- Con Flask y SQLite temporal a **1366 × 768**, el simulador dejó **15 lecturas y dos avisos**. Se abrió desde Alertas el aviso **1**, de frecuencia cardíaca crítica de **143,4 bpm**, UNIX **1794744230**. La sesión A-01 pasó de inicio a resultado y finalización sin scroll de página. React hizo **20 GET** y cero POST, sin cabecera de API key. [Evidencia de laboratorio](evidence/L15-B/laboratorio.json)
- No se probó con usuarios bajo presión, con lector de pantalla ni en el equipo final de presentación. Usar el [guion L15](L15-medical-mvp-integration-report.md) con los cuatro pasos rápidos, el resultado y la revisión opcional.

## Capturas de Edge

Capturas con respuestas REST sintéticas rotuladas. El ensayo Flask se registró por separado.

- [Pregunta a 1366 × 768](evidence/L15-B/pregunta-1366.webp) · [Pregunta a 1440 × 900](evidence/L15-B/pregunta-1440.webp)
- [Resultado con alerta a 1366 × 768](evidence/L15-B/resultado-alerta-1366.webp) · [Resultado con alerta a 1440 × 900](evidence/L15-B/resultado-alerta-1440.webp)
- [Resultado móvil a 375 px](evidence/L15-B/resultado-alerta-375.webp) · [Información insuficiente a 320 px](evidence/L15-B/informacion-insuficiente-320.webp)

Quedan pendientes revisión médica, criterio de frescura y procedencia individual de las alertas. El rediseño se limitó a Asistencia y su entrada contextual. Se conservaron L15, rutas, servicios y PWA. No se modificaron backend, simulador, contratos ni componentes del junior. No hubo commits, push, merges ni despliegues.
