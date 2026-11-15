# Contexto de Astro-vital

Astro-vital es el proyecto del equipo **Ada Lovelace** para NASA Space Apps Challenge 2026. El enunciado compartido con el equipo pide una herramienta visual para reunir indicadores de salud, facilitar la autoevaluación y orientar acciones de prevención o bienestar. La propuesta definitiva describe el reto en §2. El nombre de servicio que aparece en el backend es ASTRA HEALTH. El nombre público definitivo está abierto.

## Problema y visión

En misiones prolongadas, el aislamiento, el confinamiento, la radiación, la gravedad alterada y los entornos cerrados condicionan el monitoreo. La distancia a Tierra puede demorar la comunicación con especialistas. Un tripulante necesita saber qué se midió, cuándo, con qué calidad y qué cambió. Un compañero puede necesitar consultar el estado y, si se aprueba la función, abrir asistencia sin esperar una alerta.

La propuesta de valor es combinar telemetría identificable, tendencias y alertas legibles en una PWA que haga visible la diferencia entre una lectura reciente, una histórica, una simulada y la ausencia de datos. El prototipo busca demostrar el recorrido de extremo a extremo con evidencia reproducible de la fuente, la API y la interfaz.

| Objetivo | Resultado observable |
| --- | --- |
| Integrar adquisición y visualización | Una lectura de un astronauta se rastrea desde el emisor hasta el detalle que muestra valor, unidad y hora. |
| Comprender la disponibilidad | La interfaz distingue la pérdida del enlace al nodo de la pérdida de la API y conserva la hora de la última medición disponible. |
| Contextualizar cambios | Tendencias y alertas muestran la variable, el momento y la información disponible sobre la procedencia. |
| Evaluar asistencia, si se aprueba | Un tripulante abre una interacción breve; los textos y su uso quedan vinculados a revisión médica. |

## Usuarios y contexto operativo

- **Astronauta.** Consulta sus mediciones, tendencias, calidad y avisos desde la interfaz de misión.
- **Compañero de tripulación.** Consulta el estado y podría iniciar asistencia manual si se aprueba el flujo.
- **Operadores de la demo.** Ejecutan la simulación y observan el recorrido reproducible en el equipo definido. La topología, el navegador y el escenario quedan pendientes.

Se prioriza escritorio, con adaptación a pantallas pequeñas. La interfaz debe funcionar con teclado, mostrar foco visible y expresar estado con texto e iconografía además de color. La disponibilidad depende por separado del nodo, la API y los recursos locales de la PWA.

## Cómo funciona el sistema

1. **Sensores o simulación** producen mediciones. Los sensores propuestos cubren pulso, SpO₂, temperatura, movimiento y radiación. La disponibilidad efectiva de cada variable depende del emisor. El simulador puede representar desconexiones, recuperación y cambios controlados para el jurado.
2. **Backend central** valida y persiste la telemetría, consulta series históricas y expone estados y alertas por JSON. El [código y la referencia REST](../Backend/docs/API.md) describen el proveedor existente.
3. **Frontend** adapta los datos a una interfaz accesible, muestra estados operativos y explica antigüedad y calidad. En esta revisión existe un esqueleto documental y de organización.
4. **Interacciones propuestas** incluyen notas, reconocimiento de alertas y asistencia. Su alcance y persistencia en la PWA se acuerdan por separado.

**Monitoreo** es consultar mediciones y su contexto. Una **alerta** es un aviso generado por el backend o un escenario de demostración identificado. **Asistencia** es una interacción propuesta para recoger observaciones y mostrar contenido revisado. Un diagnóstico, un tratamiento, hardware apto para vuelo y una operación clínica certificada quedan fuera del prototipo.

## Equipo y responsabilidades

| Área | Propiedad |
| --- | --- |
| Sensores y simulación | Adquisición, emisor y coordinación del formato de ingesta con Mauricio. |
| [Mauricio](roles/backend-mauricio.md) | Backend, persistencia y referencia REST. |
| [Frontend líder](roles/frontend-lead.md) | Arquitectura, integración, UX, PWA y revisión de entregas. |
| [Frontend junior](roles/frontend-junior.md) | Componentes, estados y verificaciones de las tareas asignadas. |
| Revisión médica | Evalúa indicadores, condiciones, mensajes, preguntas y guías. El equipo debe confirmar atribuciones y uso autorizado. |

## Evolución y precedencia

1. **Propuesta inicial, pp. 1–4.** Nodos portátiles autónomos con Raspberry Pi, SQLite y reenvío, servidor central y tablero de consulta. Simulación para probar anomalías, pérdida del enlace y recuperación.
2. **Contrapropuesta, pp. 1–5.** Conserva las fronteras de adquisición y amplía el tablero con observaciones, ayuda manual, guías revisadas y PWA. La conservación y sincronización de acciones son propuestas.
3. **Propuesta definitiva v1.0, 14 de noviembre de 2026, §§4–23.** Consolida roles, JSON, PWA, priorización y validación. Incluye opciones técnicas y clínicas abiertas. Su referencia a un antecedente de tres páginas difiere de las cinco páginas del adjunto auditado.

Para decidir alcance, consulta primero los acuerdos explícitos. Para describir el estado técnico, comprueba el repositorio. Para integrar, consulta la documentación vigente del proveedor y eleva divergencias con el código. La propuesta definitiva orienta el alcance proyectado y los antecedentes explican su evolución. La auditoría de etapa 1 contrasta estas fuentes. Los PDF son adjuntos del proyecto.

| Estado | Uso en esta documentación |
| --- | --- |
| CONFIRMADO | Acuerdo explícito o encargo vigente. |
| IMPLEMENTADO | Evidencia en código o configuración. La ejecución se verifica aparte. |
| PROPUESTO | Opción de diseño o capacidad planificada. |
| PENDIENTE DE VALIDACIÓN | Requiere decisión, comprobación o revisión del responsable. |
| DESCARTADO | Fuera del alcance vigente o retirado por decisión explícita. |

## Glosario operativo

- **Nodo** es el origen asociado a un astronauta que adquiere o transmite telemetría. **Ingesta** es la recepción y procesamiento de lotes en el servidor.
- **Frescura** es la antigüedad de una medición. **Último contacto** es la referencia de conectividad del nodo. **Calidad** informa sobre el estado de la muestra o el sensor.
- **Línea base** es un resumen estadístico individual que usa el backend. **Reconocimiento** registra que se vio una alerta.
- **PWA** es una aplicación web progresiva. La instalación, la carga offline del shell y el acceso a datos en vivo se verifican por separado.
- **Evento de asistencia** designa un registro estructurado todavía pendiente. La **nota** del backend es una observación de texto.

Consulta [decisiones](DECISIONS.md) para vigencia y responsables, [arquitectura](ARCHITECTURE.md) para el recorrido técnico, [alcance](MVP_SCOPE.md) para aceptación, [integración](INTEGRATION_GUIDELINES.md) para contratos y [política médica](MEDICAL_CONTENT_POLICY.md) para publicación.
