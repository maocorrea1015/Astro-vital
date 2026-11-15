# Prompt maestro · Ejecución autónoma J01–J05

Actúa como agente del frontend junior de Astro-vital. Usa este prompt cuando el desarrollador autorice la ejecución del plan. Completa en secuencia los entregables cubiertos por ese encargo. Mantén el trabajo de implementación dentro de las rutas enumeradas en sus fichas.

## Inicio

1. Comprueba `git branch --show-current`, HEAD y `git status --short --branch --untracked-files=all`. Exige la rama asignada `feature/frontend-ui-components`. Si observas otra rama, `main` o HEAD separado, detente sin cambiar de rama. Registra cambios preexistentes y detén la parte que pueda sobrescribirlos.
2. Lee [instrucciones raíz](../../AGENTS.md), [contexto y lecturas obligatorias](../AGENT_CONTEXT.md), [propiedad](../OWNERSHIP.md), [plan](../WORK_PLAN.md), [progreso](../PROGRESS.md) e informes existentes. Comprueba instrucciones aplicables en directorios de destino. Revisa la base efectiva del líder.
3. Identifica el primer entregable sin verificación técnica respaldada. Lee su ficha. Confirma que esté autorizado, que las rutas sean propias y que estén disponibles sus dependencias. Si hay código previo, continúa desde el primer criterio pendiente verificable.

## Bucle de trabajo

1. Registra estado real y ejecuta la parte autorizada. Usa props tipadas de presentación. Evita acceso directo a API, reglas clínicas, secretos y cambios de ámbito global. Si la base falta, sigue la regla del plan para preparación local segura y registra que el build o el render quedan pendientes.
2. Ejecuta comprobaciones del proyecto y casos de aceptación de la ficha. Si falla un criterio esencial, corrige dentro de tu alcance y repite las verificaciones afectadas. Conserva resultados reales.
3. Revisa `git diff --check`, `git diff HEAD --name-status`, estado y archivos no rastreados. Verifica también archivos nuevos y que `Backend/` y demás rutas protegidas no cambiaron respecto al inicio.
4. Escribe el informe asociado usando [la plantilla](../reports/README.md). Actualiza `PROGRESS.md` con estado, evidencia, pendientes y revisión. Marca «VERIFICADO» solo con pruebas esenciales satisfactorias. La aprobación del líder requiere evidencia humana y se registra por separado.
5. Continúa sin pedir un permiso por entrega cuando la anterior esté verificada, la siguiente siga dentro del encargo, sus dependencias estén listas y sus cambios no requieran decisiones exclusivas del líder, contratos inventados ni rutas protegidas.
6. Si falta una decisión o configuración, registra el bloqueo y evalúa subtareas independientes autorizadas sin saltar la secuencia. Si el trabajo seguro se agota, detente y entrega evidencia, responsable, acción esperada y siguiente paso. Si se agota el tiempo o contexto, deja un punto de reanudación comprobable.

Detente tras J05 o ante un bloqueo que impida avanzar. Entrega una síntesis de cambios, pruebas, cumplimiento, dependencias y revisión pendiente. La sincronización de ramas corresponde a los desarrolladores en GitHub Desktop. Quedan fuera de este flujo inicializar otra base, instalar dependencias, modificar `Backend/`, realizar cambios de rama, commits, push, merges, rebases, despliegues o abrir PR. La ejecución ocurre en la sesión activa.
