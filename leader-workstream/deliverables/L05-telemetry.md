# L05 · Mediciones, histórico y alertas

## Objetivo y alcance

Componer J03/J04 y mostrar telemetría y avisos disponibles sin reglas clínicas locales. La ejecución requiere el encargo técnico correspondiente.

## Arquitectura y dependencias

Controlador de histórico y alertas → adaptadores → MeasurementsPanel, MeasurementTrend y AlertsPanel del junior.

**Dependencias.** L04, J01/J03/J04 y aprobación de consultas, etiquetas y acciones de demo.

## Rutas de escritura previstas

frontend/src/app/AstronautPage.tsx, TelemetryPanel.tsx, frontend/src/services/api/readings.ts, alerts.ts y frontend/tests/telemetry.integration.test.tsx.

Registra `leader-workstream/PROGRESS.md` y `leader-workstream/reports/L05-report.md`. Se protegen `Backend/`, `junior-workstream/`, los componentes y pruebas colocalizadas del junior, y cualquier ruta ajena a esta lista. Aplica [propiedad](../OWNERSHIP.md).

## Secuencia

Conectar filtros de variable, ventana y reconocimiento acordados; ajustar orden de tiempo para gráficas; mantener consultas independientes; si hay acuse, actualizar tras respuesta confirmada y evitar repetición concurrente.

## Contratos y datos

Histórico con variable/hours/limit; alertas con reconocida/limit. Mensajes aprobados, origen simulado visible. Acuse solo tras aprobación del alcance. Consulta [integración](../INTEGRATION_PLAN.md).

## Comportamiento y excepciones

Distinguir carga, filtros sin resultado, serie insuficiente, dato obsoleto, alertas activas/históricas, fallo parcial y desconexión. No presentar acuse como resolución.

## Aceptación, pruebas y evidencias

Verificar histórico descendente adaptado, cero y huecos, cambios de filtro, 429 y fallo de acuse si aplica. Probar comparación con API y teclado. Adjuntar ejemplos sanitizados y resultado. Usa los comandos reales del proyecto y registra skips con motivo. La aceptación exige evidencia de cada comportamiento aplicable y pruebas esenciales satisfactorias.

## Condiciones de bloqueo

Firmas no disponibles, unidades o mensajes sin aprobar, alcance de escrituras pendiente, falta de respuesta representativa. Registra evidencia, responsable y condición concreta de reanudación. Continúa solo en trabajo independiente autorizado.

## Informe

Usa [la plantilla](../reports/README.md) con los resultados de esta ficha, evidencia, archivos, riesgos y siguiente paso. Separa estado técnico y revisión humana.
