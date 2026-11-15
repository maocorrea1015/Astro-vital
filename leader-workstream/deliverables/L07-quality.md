# L07 · Pruebas, accesibilidad e integración

## Objetivo y alcance

Verificar los módulos del líder y el montaje de componentes junior con evidencia reproducible. La ejecución requiere el encargo técnico correspondiente.

## Arquitectura y dependencias

Pruebas del consumidor, composición end-to-end y revisión manual. J05 documenta la calidad local; el líder prueba el montaje.

**Dependencias.** Corte vertical y entregas junior disponibles para lo que se integre. Tooling aprobado.

## Rutas de escritura previstas

frontend/tests/ para pruebas de integración previstas, configuraciones de prueba y cambios de manifiesto/lockfile solo si se autorizan, y correcciones en archivos del líder previamente enumerados. No editar pruebas ni componentes del junior.

Registra `leader-workstream/PROGRESS.md` y `leader-workstream/reports/L07-report.md`. Se protegen `Backend/`, `junior-workstream/`, los componentes y pruebas colocalizadas del junior, y cualquier ruta ajena a esta lista. Aplica [propiedad](../OWNERSHIP.md).

## Secuencia

Separar cobertura local e integrada; reproducir fallos; verificar tipos y build; probar teclado, orden, contraste y responsive; enviar defectos del junior a su propietario.

## Contratos y datos

Fixtures de consumidor versionados con revisión; IDs ficticios y estados de consulta, tiempo y calidad. Consulta [integración](../INTEGRATION_PLAN.md).

## Comportamiento y excepciones

Cubrir carga, vacío, error, 429, nulos, cero, nodo offline, API inaccesible, lectura vieja, degradación y datos simulados.

## Aceptación, pruebas y evidencias

Ejecutar scripts de tipos, build y pruebas existentes. Recorrer demo en escritorio y móvil. Revisar diff y rutas. Registrar comandos, entorno y matriz con resultados y evidencia. Usa los comandos reales del proyecto y registra skips con motivo. La aceptación exige evidencia de cada comportamiento aplicable y pruebas esenciales satisfactorias.

## Condiciones de bloqueo

Fallo esencial no corregido, defecto de propietario externo, ausencia de tooling o incertidumbre sobre un criterio de seguridad. Registra evidencia, responsable y condición concreta de reanudación. Continúa solo en trabajo independiente autorizado.

## Informe

Usa [la plantilla](../reports/README.md) con los resultados de esta ficha, evidencia, archivos, riesgos y siguiente paso. Separa estado técnico y revisión humana.
