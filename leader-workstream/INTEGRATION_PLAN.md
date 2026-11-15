# Integración con el junior y con Mauricio

## Traspasos con el junior

Referencia auditada: `feature/frontend-ui-components` en `ad6c14c`, paquete `junior-workstream/`. La rama líder no contiene ese paquete. Consulta sus fichas en Git antes de integrar y comprueba la revisión recibida por el desarrollador.

| Junior | Entrega del líder para desbloquear | Aporte del junior e interfaz TypeScript por acordar | Punto de integración |
| --- | --- | --- | --- |
| J01 | L01 con stack, tema base y forma de verificar; L03 aclara semántica de los modelos | `AstronautCard`, `MeasurementIndicator`, `AlertCard`. Acordar identidad, textos, nulos, estado de conexión, hora, unidad, calidad, severidad y callbacks por ID. | L04 y L05. |
| J02 | L02 y L04 precisan selección, navegación, estado de consulta y reintento | `CrewView` con colección tipada, selección opcional, estados y eventos `onSelect` / `onRetry` si se acuerdan. | L04 monta y conserva la responsabilidad de consultas. |
| J03 | L03/L05 confirman unidades, zona horaria, orden, ventana y calidad; líder decide dependencia gráfica | `MeasurementsPanel` y `MeasurementTrend`, entradas tipadas de indicador, serie y estados, evento de rango si se acuerda. | L05 mapea DTO a props y consulta el histórico. |
| J04 | L03/L05 confirman reconocimiento, textos autorizados y filtros | `AlertsPanel`, props de lista y filtro, callbacks de filtro y acuse opcional. | L05 conecta alcance, fallos y estado confirmado por servidor. |
| J05 | L07 provee entorno de integración y criterios; L06 aporta pruebas de conectividad aprobadas | Evidencia de calidad, imports, props y pruebas locales. | L07 valida la composición; L08 prepara el ensayo. |

Acordar nombres de tipos, propiedad, nullability, nombres de callbacks y valores de estados antes de acoplar imports. Las props son modelos de UI; el adaptador mantiene los DTO del proveedor. El junior edita solo sus componentes y pruebas colocalizadas. El líder modifica base, adaptadores y composición. Si una firma diverge, comparar revisiones, acordar cambio compatible y pedir al propietario su edición.

**Antes de un PR.** Confirmar rama, revisión de cada lado, alcance y diff; comprobar tipos, build, pruebas esenciales, teclado y tamaños pertinentes; incluir evidencia, instrucciones de integración, pendientes y ausencia de secretos; obtener revisión humana para aprobar integración. La apertura se coordina explícitamente. El agente conserva el historial.

## Proveedor y semántica

Fuente contractual: [API.md](../Backend/docs/API.md). La [guía general](../docs/INTEGRATION_GUIDELINES.md) contiene el mapa detallado. Para el corte vertical se usan `GET /api/astronauts` y `GET /api/astronauts/{id}/status`; `GET /api/health` es público y solo verifica alcance. Para ampliar: `GET /api/astronauts/{id}/readings` y `GET /api/astronauts/{id}/alerts`. Acuse por `POST /api/alerts/{id}/acknowledge` y notas por GET/POST de `/api/astronauts/{id}/notes` solo si se aprueban. `POST /api/readings` corresponde al emisor.

- **Datos.** Identidad `astronaut_id`, nombre, estado general, conexión y último contacto. Las lecturas de consulta usan `variable`, `valor`, `ts` UNIX en segundos y `calidad`. El validador contempla pulso, SpO₂, temperatura, radiación CPM y actividad. Confirmar la escala de actividad, unidades, procedencia y campos opcionales. Alertas incluyen severidad, hora, mensaje y reconocimiento según operación.
- **Calidad y edad.** `ok`, `degraded`, `sensor_fault`. El timeout del nodo por último contacto es de 60 s por defecto en el código. Es independiente de la frescura por métrica. Un lote retrasado puede llegar con nodo online. `normal` es un estado derivado de alertas pendientes y puede coexistir con datos ausentes.
- **Errores y frecuencia.** Manejar 400/401/404/405/429/500, fallos de red y JSON inválido. El código limita 100 solicitudes por 60 s por clave entre rutas operativas y responde con `retry_after` y `Retry-After`. Acordar presupuesto, cadencia y acceso a cabeceras. Evaluar polling controlado.
- **Seguridad.** Las rutas operativas exigen `X-API-Key`. CORS abierto en el código no reemplaza autenticación. Una clave privada en `VITE_*`, bundle, almacenamiento del navegador o logs incumple la condición de acceso. Acordar con Mauricio un acceso apto para navegador, con un intermediario de mismo origen como opción. Confirmar origen, HTTPS o localhost y custodia de claves. Respetar `Cache-Control: no-store`.

## Acuerdos y pruebas pendientes

Mauricio y líder deben confirmar revisión, rutas, ejemplos sanitizados, esquema, origen y unidades, tiempos, cadencia, topología, autenticación, alcance de escrituras y estrategia de error. Simulación confirma emisor, reloj, procedencia y muestras repetibles. Antes de la demo, comprobar preflight si aplica, acceso real desde navegador, respuesta válida, vacía, inválida, 401, 404 y 429 en un entorno permitido. Probar corte del emisor y de la API por separado, reenvío atrasado y recuperación. Confirmar con el equipo qué mensajes y reglas pueden mostrarse. Registra contradicciones con operación, ejemplo, revisión y criterio de aceptación.
