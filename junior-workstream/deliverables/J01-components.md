# J01 · Componentes visuales básicos

**Objetivo.** Dar a J02–J04 componentes reutilizables que conviertan props tipadas en información legible. Conserva el alcance del [encargo previo](../../Feature_01_Prompt.md). Lee [propiedad](../OWNERSHIP.md) y [verificación común](../WORK_PLAN.md).

## Archivos autorizados cuando se active la ejecución

- `frontend/src/features/crew/components/AstronautCard.tsx`
- `frontend/src/features/crew/components/MeasurementIndicator.tsx`
- `frontend/src/features/alerts/components/AlertCard.tsx`
- Pruebas colocalizadas `AstronautCard.test.tsx`, `MeasurementIndicator.test.tsx`, `AlertCard.test.tsx` en sus carpetas, si la herramienta existente las admite, y el registro e informe del plan.

## Tarjeta de astronauta

Props de presentación esperadas: ID estable, nombre opcional, etiqueta de estado general recibida, estado de conexión separado, último contacto formateado opcional, resumen breve opcional y `onSelect(id)` opcional. Mostrar nombre o ID, y faltantes como desconocidos. Mantener separados estado reportado y contacto. La tarjeta offline conserva la hora si existe. Sin callback, renderizar contenido estático. Con callback, presentar un botón con nombre accesible, activable por teclado y foco visible.

Aceptación y prueba: render con datos completos, nombre ausente, nodo offline y contacto ausente. Verifica que la etiqueta general no afirme salud y que el botón invoque una vez el ID correcto mediante teclado o clic.

## Indicador de medición

Props de presentación esperadas: etiqueta de variable, valor numérico opcional, unidad confirmada opcional, hora legible opcional, disponibilidad, calidad y bandera de obsolescencia suministradas. Renderizar cero como dato; ausencia como «Sin datos». Mostrar unidad solo si viene confirmada. Identificar calidad desconocida, degradada o fallo con texto. Mantener la hora de una lectura obsoleta. Una muestra averiada se identifica como tal y su cifra, si se muestra, no debe parecer válida.

Aceptación y prueba: comparar cero, nulo, número con y sin unidad, muestra degradada, averiada y obsoleta. Verificar que no se calcule frescura a partir de un corte propio, ni se aplique un rango clínico.

## Tarjeta de alerta

Props de presentación esperadas: identificador, mensaje aprobado para UI, severidad recibida, fecha legible, reconocimiento, descripción permitida opcional, etiqueta de simulación cuando aplique y `onAcknowledge(id)` opcional. Mostrar el estado pendiente, reconocido o desconocido. Aplicar severidad con texto además de color e icono. Para severidad desconocida usar una salida neutral. Renderizar la acción solo cuando sea aplicable y esté habilitada por el consumidor. El evento no muta el estado del proveedor.

Aceptación y prueba: casos pendiente, reconocida, sin acción, severidad desconocida y simulada. Validar evento con ID correcto sin consulta HTTP ni éxito aparente previo a props actualizadas.

## Dependencias y salida

Usa React/TypeScript/MUI y tema existentes cuando estén disponibles. Reutiliza tipos de presentación del líder si aplican. De lo contrario, declara tipos locales en los archivos autorizados y describe sus props en el informe. Los campos anteriores son conceptos de UI; nombres finales se registran en el informe. Usa estilos responsivos MUI y verifica textos largos, foco y ausencia de desbordamiento. Bloquea la verificación si faltan base, dependencias, tipos indispensables o entorno de render; comunica al líder lo que haga falta. Evidencia: casos ejecutados, comandos y ejemplos sanitizados. Avanza a J02 tras verificar los tres componentes.
