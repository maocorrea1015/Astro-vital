# Política de contenido médico

El prototipo muestra información para que la tripulación pueda consultar qué se midió y cuándo, y reconocer avisos que requieren revisión. Las situaciones y el alcance de asistencia dependen de aprobación. La política se aplica tanto a contenido editorial como a mensajes devueltos por el backend o generados por un escenario de demo.

| Concepto | Tratamiento en la interfaz |
| --- | --- |
| Medición | Valor, unidad, hora, procedencia y calidad. Un sensor tiene límites y puede fallar, atrasarse o entregar valores degradados. |
| Observación | Información declarada por el usuario, con contexto y fecha cuando se acuerde. Mantener su origen separado del sensor. |
| Alerta | Aviso para revisión. Etiquetar severidad, fuente y estado cuando estén disponibles. Reconocer una alerta registra un acuse. |
| Orientación | Contenido preseleccionado, versionado y aprobado para un contexto y audiencia. |
| Diagnóstico | Conclusión clínica fuera del alcance del prototipo. |

## Investigación y aprobación

1. Registrar la situación candidata con alcance, audiencia, indicadores y preguntas que se desea evaluar. Emergencias físicas, radiación, sueño y bienestar mental son temas de investigación.
2. Localizar material institucional original. La definitiva §14 menciona NASA Human Research Program, Cruz Roja y American Heart Association como fuentes por evaluar. Verificar manualmente título, organización, enlace, edición, fecha de consulta, sección y aplicabilidad.
3. Documentar hechos respaldados, incertidumbre, límites del sensor y del contexto, diferencias entre aplicaciones terrestres y espaciales y texto exacto propuesto para la interfaz. El uso en microgravedad requiere revisión específica.
4. El profesional designado revisa la ficha, condiciones de alerta, preguntas, opciones de respuesta, orientación y límites de uso. El equipo confirma quién aprueba y para qué entorno. Los agentes pueden preparar material trazable para revisión humana.
5. Vincular aprobación con versión, fecha, responsable, audiencia y texto visible. Un cambio de indicación, umbral, pregunta, traducción que altere el sentido o contexto de uso devuelve la ficha a revisión.

| Estado | Evidencia mínima | Visibilidad |
| --- | --- | --- |
| Investigación | Tema, fuentes candidatas y dudas | Interna |
| Revisión documental | Fuentes comprobadas y limitaciones registradas | Interna |
| Revisión médica | Versión remitida al profesional designado | Interna |
| Aprobado para demo | Aprobación expresa, versión y contexto | Solo dentro de la demo autorizada |
| Retirado | Motivo y versión retirada | Fuera de publicación |

## Reglas de presentación y seguridad

- Identificar simulaciones y sus alertas. Los valores de anomalía de los PDF son insumos de demo. Sus valores y las reglas existentes del backend requieren evaluación antes de presentarse como criterios clínicos.
- Evitar conclusiones a partir de una lectura aislada, ausente, obsoleta o averiada. Usar mensajes neutrales de incertidumbre o disponibilidad. El hecho de que la API conteste o el nodo esté online informa sobre conectividad.
- Usar **Contenido pendiente de validación** cuando falte aprobación. Evitar procedimientos, tratamientos, recomendaciones de primeros auxilios o umbrales inventados. Mantener fuera de la UI las guías sin revisión que lleguen en campos de API.
- Si se aprueba un cuestionario, utilizar preguntas breves y observables, opciones revisadas, regreso y corrección antes de confirmar, y salida clara. Definir qué ocurre cuando el usuario desconoce la respuesta. Registrar solo los datos aprobados y evaluar privacidad antes de persistir.
- Para incorporar un nuevo escenario, registrar necesidad, evidencia y dependencias en [alcance](MVP_SCOPE.md), completar la ficha y revisar flujo, copy y pruebas con la persona responsable antes de publicar.

Antecedentes de investigación y UX en contrapropuesta §§3–8 y definitiva §§9, 11, 13–16. El [registro de decisiones](DECISIONS.md) mantiene visibles las aprobaciones pendientes.
