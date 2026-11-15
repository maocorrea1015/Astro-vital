# J02 · Vista visual de tripulación

**Objetivo.** Componer tarjetas de J01 para que el consumidor liste y seleccione tripulantes en escritorio y móvil. Depende de J01 verificado y de la confirmación del modelo de UI que suministra el líder.

**Rutas autorizadas.** `frontend/src/features/crew/components/CrewView.tsx` y `CrewView.test.tsx` colocalizada con tooling existente. Registra informe y progreso. Utiliza la tarjeta existente sin alterar su interfaz unilateralmente.

## Entradas, estados y salida

- Entradas tipadas: colección de tarjetas de J01, estado de consulta, ID seleccionado opcional, mensaje operativo permitido y `onSelect(id)` opcional. Un reintento visual puede emitir `onRetry()` si se suministra.
- En éxito, mostrar total y resumen operativo calculado sobre estados de conexión recibidos. Desconocido, online y offline deben distinguirse. Mantener orden suministrado e identidad por ID. Datos parciales permanecen visibles con marcadores de ausencia.
- En carga inicial, mostrar progreso accesible. En vacío exitoso, explicar que no hay tripulación disponible. En error, mostrar mensaje de consulta y posible acción; si el consumidor incluye datos anteriores, identificarlos explícitamente como existentes y conservar su contexto.
- Entregar lista o rejilla semántica, columnas que se adapten y una columna cuando el espacio sea insuficiente. El foco debe seguir el orden visual y la selección debe tener indicación perceptible mediante texto o semántica. No anidar botones.

## Prueba y aceptación

Renderizar dos IDs distintos, uno offline y otro desconocido, nombre ausente, lista vacía, carga y error. Verificar que la selección por teclado emita el ID correcto y que la ausencia de callback permita lectura estática. Revisar escritorio y móvil con texto largo. Demostrar selección sin rutas globales ni acceso directo al backend. El líder monta la vista y conecta selección, reintento y estado de consulta. Si el modelo reutilizable o un estado del consumidor no está claro, registrar la discrepancia y pedir su confirmación. Adjuntar evidencia al informe y avanzar a J03 tras verificar.
