# J04 · Panel visual de alertas

**Objetivo.** Mostrar alertas pendientes y reconocidas con filtros visuales y acciones que el líder pueda conectar. Depende de J03 verificado, la tarjeta J01 y los mensajes y estados aprobados para demo.

**Rutas autorizadas.** `frontend/src/features/alerts/components/AlertsPanel.tsx` y `AlertsPanel.test.tsx` colocalizada si el entorno admite pruebas. Registra informe y progreso.

## Props y eventos

- Recibir colección adaptada de alertas, filtro vigente, opciones permitidas y estado de consulta. El filtro es controlado por el consumidor mediante `onFilterChange(filter)` opcional. Si solo se recibe una colección filtrada, informar su alcance visual; no inferir conteos globales.
- Reutilizar J01 con ID, mensaje autorizado, severidad, hora y reconocimiento. Distinguir pendiente, reconocida y desconocida. Mostrar procedencia simulada cuando corresponda. Mantener el orden entregado por el consumidor.
- Propagar `onAcknowledge(id)` si el consumidor lo habilita. Si llegan estados por alerta de envío o fallo, mantener visible el estado anterior junto al indicador. El líder confirma el resultado y entrega nuevas props.
- Mostrar carga, vacío general, filtro sin resultados y error con textos diferenciados. Los filtros, acciones y reintento opcional deben tener etiquetas, foco visible y operación por teclado. En pantalla pequeña, permitir que los controles se reorganicen.

## Prueba y aceptación

Verificar mezcla de reconocidas y pendientes, severidad desconocida, mensaje vacío o no autorizado, filtro vacío, carga y fallo. Comprobar callbacks con ID y filtro correctos, acción deshabilitada durante envío cuando venga indicada y ausencia de cambios optimistas propios. Reconocimiento significa acuse. La tarjeta y el panel carecen de HTTP y generación de alertas. La política de contenido gobierna textos y excluye guías sin aprobación. Si faltan semántica del filtro, acciones o mensajes, escalar al líder. Adjuntar evidencia de teclado, tamaños y estados, y avanzar a J05 tras verificar.
