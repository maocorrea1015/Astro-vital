# Alcance del MVP

El stack, la PWA desktop-first con adaptación responsive, la accesibilidad y la integración JSON son CONFIRMADOS. Monitoreo, tendencias y alertas son objetivos de producto. La siguiente priorización es provisional. P0 identifica la propuesta de recorrido mínimo, P1 sus extensiones y P2 capacidades optativas. El equipo debe aprobar el P0 y los criterios del jurado. La revisión de escenarios, indicadores y mensajes se rige por la [política médica](MEDICAL_CONTENT_POLICY.md).

## MVP-01 · Tripulación

- **Objetivo y justificación.** Encontrar al astronauta correcto.
- **Prioridad y estado.** P0 · PROPUESTO. **Usuario.** Tripulante o compañero.
- **Entradas y dependencias.** Listado API, ID estable, nombre y contacto.
- **Comportamiento y excepciones.** Mostrar cada identidad y abrir el detalle. Separar catálogo vacío y consulta fallida.
- **Aceptación.** Un ID de prueba abre su propio detalle y conserva la selección al actualizar. Un catálogo vacío anuncia su estado.
- **Exclusiones.** Gestión de altas y perfiles.

## MVP-02 · Detalle de astronauta

- **Objetivo y justificación.** Reunir sus lecturas y alertas en una vista.
- **Prioridad y estado.** P0 · PROPUESTO. **Usuario.** Tripulante o compañero.
- **Entradas y dependencias.** Vista consolidada, selección y colecciones disponibles.
- **Comportamiento y excepciones.** Encabezar con nombre y estado de nodo. Mostrar lecturas y alertas por separado. Para 404, indicar recurso ausente.
- **Aceptación.** Con dos astronautas, la selección atribuye cada dato al ID correcto. Un 404 ofrece retorno al listado.
- **Exclusiones.** Diagnóstico o evaluación global de salud.

## MVP-03 · Mediciones fisiológicas

- **Objetivo y justificación.** Consultar valor, unidad y fecha de toma.
- **Prioridad y estado.** P0 · PROPUESTO. **Usuario.** Tripulante.
- **Entradas y dependencias.** Valor, variable, fecha, calidad y catálogo acordado.
- **Comportamiento y excepciones.** Presentar métricas disponibles. Indicar ausencia o error de formato. Tratar cero como valor.
- **Aceptación.** Una muestra acordada muestra cifra, unidad y hora verificables. Un campo ausente jamás aparece como cero.
- **Exclusiones.** Interpretación clínica de rangos.

## MVP-04 · Histórico y tendencias

- **Objetivo y justificación.** Comparar evolución temporal.
- **Prioridad y estado.** P1 · PROPUESTO. **Usuario.** Tripulante.
- **Entradas y dependencias.** Histórico, filtros y ventana del proveedor.
- **Comportamiento y excepciones.** Ordenar cronológicamente para gráfica. Mostrar unidad y huecos. Distinguir serie vacía y error.
- **Aceptación.** Una serie descendente de prueba se presenta en orden temporal. Cambiar la ventana actualiza el resultado y el estado vacío es legible.
- **Exclusiones.** Consulta ilimitada o interpolar huecos.

## MVP-05 · Alertas

- **Objetivo y justificación.** Identificar avisos pendientes e históricos.
- **Prioridad y estado.** P0 para activas, P1 para histórico y acuse · PROPUESTO. **Usuario.** Tripulante o compañero.
- **Entradas y dependencias.** Alerta, severidad, ts, procedencia de demo y estado cuando exista.
- **Comportamiento y excepciones.** Mostrar gravedad y motivo autorizados. En vacío indicar ausencia de avisos disponibles. Si falla la consulta, conservar esa distinción.
- **Aceptación.** Se identifica una alerta ficticia con texto y su origen. Si se aprueba acuse, la UI refleja su confirmación por el servidor.
- **Exclusiones.** Diagnóstico, resolución clínica y reglas locales.

## MVP-06 · Conexión

- **Objetivo y justificación.** Ubicar el tramo del sistema que perdió contacto.
- **Prioridad y estado.** P0 · PROPUESTO. **Usuario.** Tripulante y operador.
- **Entradas y dependencias.** Respuesta API, estado de nodo y último contacto.
- **Comportamiento y excepciones.** Distinguir fallo de consulta, nodo offline y contacto desconocido.
- **Aceptación.** Probar corte del emisor y corte de la API por separado. Mostrar mensajes diferentes y recuperar consulta al restablecer cada tramo.
- **Exclusiones.** Inferir conexión usando solo el estado de red del navegador.

## MVP-07 · Calidad y frescura

- **Objetivo y justificación.** Evitar decisiones basadas en muestras antiguas o averiadas.
- **Prioridad y estado.** P0 · PROPUESTO. **Usuario.** Tripulante.
- **Entradas y dependencias.** ts, calidad, política de frescura y reloj.
- **Comportamiento y excepciones.** Marcar obsoleta, degradada o averiada. Mantener fecha cuando exista. Indicar ausencia si falta muestra.
- **Aceptación.** Un lote atrasado conserva la etiqueta de obsolescencia con el nodo online. Probar las tres calidades y dato ausente.
- **Exclusiones.** Umbral temporal o de salud unilateral.

## MVP-08 · Navegación responsive

- **Objetivo y justificación.** Completar la consulta desde escritorio y pantallas pequeñas.
- **Prioridad y estado.** P0 · CONFIRMADO como objetivo. **Usuario.** Tripulante o compañero.
- **Entradas y dependencias.** Composición MUI, vistas y estados disponibles.
- **Comportamiento y excepciones.** Priorizar resumen en escritorio y adaptar columnas y controles. Mantener salida visible ante error o vacío.
- **Aceptación.** Completar listado, detalle y regreso con teclado, foco visible y texto legible en ambos tamaños.
- **Exclusiones.** Figura humana y animaciones como requisitos.

## MVP-09 · Instalación PWA

- **Objetivo y justificación.** Abrir la interfaz desde el entorno objetivo.
- **Prioridad y estado.** P1 · PROPUESTO para verificación de instalación. **Usuario.** Tripulante y operador.
- **Entradas y dependencias.** Navegador, manifest, iconos y origen seguro.
- **Comportamiento y excepciones.** Documentar instalación y acceso por URL cuando el navegador carezca de instalación o falle.
- **Aceptación.** Instalar y relanzar en equipo acordado. Verificar nombre e icono y recarga.
- **Exclusiones.** Ejecutable nativo.

## MVP-10 · Uso sin conexión

- **Objetivo y justificación.** Distinguir shell disponible y datos en vivo.
- **Prioridad y estado.** P0 para informar, P1 para shell, P2 para sincronización · PROPUESTO. **Usuario.** Tripulante.
- **Entradas y dependencias.** Estado de API, política de caché y persistencia.
- **Comportamiento y excepciones.** Mostrar fallo de consulta. Si se aprueba caché del shell, abrir sus recursos y señalar estado de datos.
- **Aceptación.** Tras una carga previa, cortar API y recargar en entorno de prueba. Distinguir shell, error y cualquier dato persistido mediante fecha.
- **Exclusiones.** Persistir telemetría o escrituras automáticamente.

## MVP-11 · Registro de acciones

- **Objetivo y justificación.** Conservar observaciones cuando haya persistencia aprobada.
- **Prioridad y estado.** P1 · PENDIENTE DE VALIDACIÓN. **Usuario.** Tripulante o compañero.
- **Entradas y dependencias.** Tipo de registro, autoría si aplica, fecha, contrato e idempotencia.
- **Comportamiento y excepciones.** Mostrar estados de envío, confirmación y fallo. Si no hay registros, mostrar vacío. Una nota y un evento tienen semánticas distintas.
- **Aceptación.** Una acción confirmada se recupera con su ID. Probar fallo sin éxito aparente y reintento según contrato.
- **Exclusiones.** Usar texto libre como sustituto de un evento estructurado.

## MVP-12 · Asistencia interactiva

- **Objetivo y justificación.** Recoger observaciones y acceder a orientación aprobada.
- **Prioridad y estado.** P0 condicionado · PENDIENTE DE VALIDACIÓN. **Usuario.** Tripulante o compañero.
- **Entradas y dependencias.** Flujo, preguntas, fuente, versión y revisión.
- **Comportamiento y excepciones.** Permitir entrada manual si se aprueba, corrección antes de confirmar y salida. Mostrar contenido pendiente si falta aprobación.
- **Aceptación.** Completar con teclado o clic, corregir una respuesta, salir y verificar versión del contenido autorizado.
- **Exclusiones.** Diagnóstico, procedimientos sin revisión o cantidad fija de escenarios.

## MVP-13 · Radiación, sueño y bienestar

- **Objetivo y justificación.** Evaluar indicadores adicionales con su procedencia.
- **Prioridad y estado.** Radiación según disponibilidad, sueño y bienestar P1/P2 · PENDIENTE DE VALIDACIÓN. **Usuario.** Tripulante.
- **Entradas y dependencias.** Radiación en CPM si llega, entradas manuales si se aprueban y revisión médica.
- **Comportamiento y excepciones.** Identificar qué proviene de sensor, simulación u observación. Señalar ausencia y error de registro.
- **Aceptación.** Radiación muestra CPM si está disponible. Una observación manual queda etiquetada como tal.
- **Exclusiones.** Convertir CPM a dosis, inferir sueño o bienestar de variables sin acuerdo.

## MVP-14 · Demo simulada

- **Objetivo y justificación.** Demostrar un recorrido integrado y reproducible.
- **Prioridad y estado.** P0 · PROPUESTO. **Usuario.** Operador y jurado.
- **Entradas y dependencias.** Simulador, revisión backend, PWA y guion acordado.
- **Comportamiento y excepciones.** Mostrar lectura y aviso ficticios, pérdida de enlace y recuperación. Hacer visible un fallo en lugar de sustituir datos silenciosamente.
- **Aceptación.** Repetir la demo en el equipo acordado y rastrear la muestra en API e interfaz. Registrar lo demostrado.
- **Exclusiones.** Hardware de vuelo o datos médicos personales.

## Trazabilidad y criterios de corte

- Propuesta inicial §§3–5 aporta estado, historia, alertas y simulación de enlace. La contrapropuesta §§3–7 añade interacción, instalación y orientación. La definitiva §§9–15, 20–22 aporta prioridades y criterios de demo.
- La definitiva coloca persistencia e instalación verificada en P1 y sincronización de eventos en P2, pero su guion incluye un evento registrado y una PWA abierta desde el icono. El equipo debe cerrar ese alcance en [decisiones](DECISIONS.md).
- DESCARTADO para el alcance vigente de esta etapa el desarrollo de la aplicación y módulos clínicos. Fuera del MVP proyectado quedan diagnóstico autónomo, prescripción, certificación para vuelo, IA clínica generativa y protocolos sin revisión.
