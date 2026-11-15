# Contexto del agente líder

Lee [instrucciones raíz](../AGENTS.md), [contexto](../docs/PROJECT_CONTEXT.md), [arquitectura](../docs/ARCHITECTURE.md), [alcance](../docs/MVP_SCOPE.md), [decisiones](../docs/DECISIONS.md), [integración general](../docs/INTEGRATION_GUIDELINES.md), [política médica](../docs/MEDICAL_CONTENT_POLICY.md), [rol líder](../docs/roles/frontend-lead.md), [rol junior](../docs/roles/frontend-junior.md), [reglas frontend](../frontend/AGENTS.md) y [guía técnica](../frontend/docs/README.md).

El equipo Ada Lovelace propone Astro-vital para NASA Space Apps Challenge 2026. Sus usuarios previstos consultan identidad, valor, unidad, hora, calidad, procedencia y cambios aun con enlaces intermitentes. Sensores o simulación emiten las muestras; Mauricio mantiene Flask, SQLite y REST; el líder adapta los datos y compone una PWA con React, Vite, TypeScript y Material UI. El junior aporta presentación, interacciones por callback y pruebas locales. La interfaz separa acceso a la API, contacto del nodo, vigencia del dato y calidad. Una alerta es un aviso. La orientación requiere aprobación médica.

## Evidencia y precedencia

Primero los acuerdos vigentes, luego el repositorio para describir lo implementado y [API.md](../Backend/docs/API.md) para coordinar el contrato. Escala cualquier diferencia entre documento, código y entorno. La propuesta original (4 pp.) plantea nodos autónomos y sincronización; la contrapropuesta (5 pp.) añade asistencia y PWA; la definitiva v1.0 (12 pp.) consolida diseño y pendientes. Sus rutas, formatos y escenarios candidatos orientan el plan sin constituir acuerdos.

L00 se basa en `6e3109e`. La rama líder contiene documentación y carpetas con placeholders. No hay configuración React/Vite/TypeScript/MUI, rutas de aplicación, cliente HTTP ni PWA. Los 13 documentos junior se consultaron desde `feature/frontend-ui-components` en `ad6c14c` sin cambiar de rama. Para releerlos usa `git ls-tree -r --name-only feature/frontend-ui-components -- junior-workstream` y `git show feature/frontend-ui-components:junior-workstream/WORK_PLAN.md`. Sustituye la ruta por cada ficha y verifica la revisión antes de asumir disponibilidad de código.

Consulta [propiedad](OWNERSHIP.md) antes de escribir, [progreso](PROGRESS.md) para reanudar y [el plan de integración](INTEGRATION_PLAN.md) para decidir cuándo escalar dependencias. Usa datos ficticios identificados, excluye credenciales del navegador y evita interpretaciones médicas o contratos inventados.
