# L04 · Tripulación y estado individual

## Objetivo y alcance

Mostrar una lectura de la API en el astronauta correcto y componer la vista junior. La ejecución requiere el encargo técnico correspondiente.

## Arquitectura y dependencias

Controladores en src/app; adaptador L03; AstronautCard y CrewView del junior.

**Dependencias.** L02/L03. J01 y J02 verificados y disponibles para integración final.

## Rutas de escritura previstas

frontend/src/app/App.tsx, navigation.tsx, CrewPage.tsx, AstronautPage.tsx y frontend/tests/crew.integration.test.tsx.

Registra `leader-workstream/PROGRESS.md` y `leader-workstream/reports/L04-report.md`. Se protegen `Backend/`, `junior-workstream/`, los componentes y pruebas colocalizadas del junior, y cualquier ruta ajena a esta lista. Aplica [propiedad](../OWNERSHIP.md).

## Secuencia

Consultar catálogo; seleccionar por ID; consultar status; descartar respuestas tardías; pasar props tipadas y callbacks; integrar lectura mínima según el plan.

## Contratos y datos

ID, nombre, contacto, lectura, variables, valor, unidad, hora, procedencia, calidad y frescura acordadas. Confirmar firma de selección y reintento. Consulta [integración](../INTEGRATION_PLAN.md).

## Comportamiento y excepciones

Mostrar carga, vacío de catálogo, 404 de detalle y API inaccesible por separado de nodo offline. Mantener hora anterior si existe. Cero sigue siendo medición.

## Aceptación, pruebas y evidencias

Prueba con dos IDs y respuesta tardía, datos parciales y recuperación. Rastrear una muestra del emisor hasta la pantalla en entorno autorizado. Registrar ID ficticio, hora, revisión y captura sanitizada. Usa los comandos reales del proyecto y registra skips con motivo. La aceptación exige evidencia de cada comportamiento aplicable y pruebas esenciales satisfactorias.

## Condiciones de bloqueo

Integración final bloqueada si faltan J01/J02 o firmas. Corte vertical bloqueado si no hay acceso seguro o datos trazables. Registra evidencia, responsable y condición concreta de reanudación. Continúa solo en trabajo independiente autorizado.

## Informe

Usa [la plantilla](../reports/README.md) con los resultados de esta ficha, evidencia, archivos, riesgos y siguiente paso. Separa estado técnico y revisión humana.
