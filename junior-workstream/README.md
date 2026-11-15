# Sistema de trabajo del frontend junior

Astro-vital es el prototipo del equipo Ada Lovelace para NASA Space Apps Challenge 2026. La interfaz presenta tripulación, mediciones y alertas con su contexto operativo. El junior entrega componentes presentacionales, pruebas locales y evidencia de integración para el líder, que controla la aplicación, el acceso a datos y la composición.

## Inicio y ciclo de trabajo

1. Abre la copia del repositorio en la rama asignada `feature/frontend-ui-components`. Comprueba el nombre exacto con `git branch --show-current` y revisa `git status --short --branch --untracked-files=all`. Si la rama difiere o HEAD está separado, detente y pide al desarrollador que seleccione la rama. Si hay cambios previos, identifícalos y evita colisiones.
2. Abre [el prompt de contextualización](prompts/01-contextualization.md) para auditar la copia sin escribir. Empieza por [las instrucciones raíz](../AGENTS.md), la [ficha junior](../docs/roles/frontend-junior.md) y [el contexto operativo](AGENT_CONTEXT.md).
3. Consulta [plan](WORK_PLAN.md), [propiedad](OWNERSHIP.md) y [progreso](PROGRESS.md). El plan enlaza las especificaciones y el progreso señala evidencia y dependencias.
4. Cuando el desarrollador active la implementación con el [prompt de ejecución](prompts/02-autonomous-execution.md), reconcilia los estados con los archivos reales. Toma el primer entregable pendiente, lee su especificación y trabaja en su lista de rutas. El permiso para redactar este paquete es independiente de esa activación.
5. Ejecuta las verificaciones descritas en [el plan](WORK_PLAN.md) usando las herramientas ya disponibles. Escribe el informe según [la plantilla](reports/README.md) y actualiza el progreso. Avanza automáticamente si el anterior está técnicamente verificado y el siguiente cumple sus dependencias y permisos. Una revisión del líder puede ocurrir después.
6. Ante una dependencia ausente, registra evidencia, efecto, responsable y siguiente acción. Continúa solo en trabajo autorizado que sea independiente. Si el bloqueo impide seguir, entrega el estado y el siguiente paso exacto.
7. Para revisión, comprueba `git diff --check`, `git diff HEAD --name-status` y los archivos no rastreados. Entrega informe, rutas, pruebas y notas de integración. El desarrollador y el líder coordinan las operaciones Git y el PR.

[Prompt previo de J01](../Feature_01_Prompt.md) y [contextualización anterior](../Prompt_Agente) se conservan como antecedentes. El prompt secuencial aplica cuando el usuario lo activa. Si el encargo invoca exclusivamente el prompt previo, su alcance termina en J01.
