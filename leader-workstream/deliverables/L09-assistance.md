# L09 · Asistencia interactiva condicionada

## Objetivo y alcance

Preparar una interacción autorizada para recoger observaciones y mostrar orientación revisada. La ejecución requiere el encargo técnico correspondiente.

## Arquitectura y dependencias

Entrada manual y, si se acuerda, desde alertas. Flujo de UI separado de telemetría y del servidor.

**Dependencias.** Equipo define alcance. Profesional designado aprueba versión, preguntas, mensajes y audiencia. Contrato de persistencia acordado si aplica.

## Rutas de escritura previstas

Por autorizar tras resolver dependencias: frontend/src/app/AssistancePage.tsx, navegación en frontend/src/app/navigation.tsx y frontend/tests/assistance.integration.test.tsx. Sin autorización actual de escritura técnica.

Registra `leader-workstream/PROGRESS.md` y `leader-workstream/reports/L09-report.md`. Se protegen `Backend/`, `junior-workstream/`, los componentes y pruebas colocalizadas del junior, y cualquier ruta ajena a esta lista. Aplica [propiedad](../OWNERSHIP.md).

## Secuencia

Confirmar ficha médica y estados; diseñar entrada, preguntas, corrección, salida y contenido versionado; comprobar revisión antes de publicación; conectar persistencia únicamente si se aprueba.

## Contratos y datos

Observaciones y datos mínimos autorizados. Una nota no equivale a un evento estructurado. Sin nuevos endpoints por iniciativa del frontend. Consulta [integración](../INTEGRATION_PLAN.md).

## Comportamiento y excepciones

Indicar carga, contenido pendiente, observación incompleta, fallo y desconexión. Las respuestas no implican diagnóstico ni orientación automática. Sin guardado implícito.

## Aceptación, pruebas y evidencias

Comprobar acceso manual, teclado, retroceso, corrección, salida, ausencia de guía no aprobada y manejo de datos si se autoriza. Adjuntar evidencia de aprobación humana y versión. Usa los comandos reales del proyecto y registra skips con motivo. La aceptación exige evidencia de cada comportamiento aplicable y pruebas esenciales satisfactorias.

## Condiciones de bloqueo

Cualquier falta de aprobación clínica, alcance, contrato o política de persistencia. Registrar bloqueo y mantener fuera del recorrido mínimo. Registra evidencia, responsable y condición concreta de reanudación. Continúa solo en trabajo independiente autorizado.

## Informe

Usa [la plantilla](../reports/README.md) con los resultados de esta ficha, evidencia, archivos, riesgos y siguiente paso. Separa estado técnico y revisión humana.
