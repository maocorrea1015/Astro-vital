# L11 · Antigüedad de lecturas y procedencia de alertas

**Rama** `feature/frontend-l11-consistency` · **Base** `a8c8129`, comprobada contra `main` remoto · **Estado** presentación verificada. Dos criterios P0 siguen pendientes de decisión.

Se revisaron los AGENTS aplicables, la propuesta definitiva §§7, 12, 13, 16 y 21, las decisiones vigentes, J05, L08-I y L10-B. Se contrastó la referencia API con las consultas Flask, el procesamiento de ingesta, el esquema SQLite, el simulador y los modelos de React. Se reutilizó la prueba vertical L10-B. [Matriz J05](J05-integration-and-ux-review.md) · [L08-I](L08-I-connection-report.md) · [L10-B](L10-B-demo-validation-report.md)

## Qué quedó implementado

[Detalle](../../frontend/src/app/AstronautPage.tsx) y [Monitoreo](../../frontend/src/app/TelemetryPanel.tsx) indican **«Antigüedad sin clasificar. Procedencia no informada por la API.»** cuando hay lecturas. El intervalo de consulta se muestra por separado. Se conservan la hora de captura, la calidad del sensor, la conexión del nodo y los estados de error o vacío. El estado general y la severidad se presentan como datos reportados.

Los DTO y adaptadores conservan `source: 'unknown'`. No se pasa una marca de obsolescencia ni de simulación individual a los componentes sin respaldo. Alertas conserva la procedencia desconocida y el aviso neutral. Inicio identifica el contexto de la demostración sintética. No hubo cambios en contratos, reglas, mensajes médicos, componentes del junior ni autenticación.

## Antigüedad verificada

| Fuente | Semántica actual |
| --- | --- |
| Detalle `/status` | Cada lectura aporta `variable`, `valor`, `ts` UNIX en segundos y `calidad`. Flask devuelve la última lectura persistida de cada variable sin un corte de antigüedad. |
| Histórico `/readings` | Devuelve los mismos datos más ID de lectura e ID de astronauta. La consulta filtra desde un instante de corte. El valor predeterminado es 24 h y hasta 100 registros. El intervalo es un límite de consulta, independiente de la frescura. |
| Catálogo y estado del nodo | `ultimo_contacto` es la referencia que Flask usa con `ASTRONAUT_TIMEOUT_SECONDS`, 60 s por defecto. La ingesta actualiza el contacto con el máximo entre el reloj del servidor y el mayor `ts` del lote válido. Un lote antiguo puede dejar el nodo en línea. |
| Ingesta y almacenamiento | SQLite conserva `creado_en` como tiempo de inserción. Los DTO de lectura que consume React carecen de fecha de recepción. El validador de ingesta permite un adelanto de hasta cinco minutos. Esa tolerancia sirve para validar entrada. |
| Simulador | `--interval` tiene valor predeterminado de 3 s. Cada iteración obtiene `int(time.time())` y comparte ese segundo entre las variables del lote. La pausa ocurre después de la solicitud, por lo que la cadencia efectiva incluye latencia y procesamiento. L10-B configuró 2 s. Ninguno de esos valores documenta la cadencia de sensores físicos. |
| React | Tripulación y Detalle presentan último contacto. Detalle usa hora de captura en los indicadores y Monitoreo usa segundos UTC en la tabla y la gráfica. Alertas presenta la marca temporal reportada en el aviso. `getFreshness()` puede resolver `unknown`, `recent` y `stale`. Sin límite válido o con edad negativa devuelve `unknown`. Los componentes admiten una bandera explícita de obsolescencia cuando el consumidor puede suministrarla. |

`PEN-03` sigue abierto. La tolerancia de ingesta, el intervalo histórico, el tiempo de contacto y la cadencia del simulador tienen propósitos diferentes. La propuesta definitiva §21 pide acordar el tiempo de corte antes de marcar una lectura atrasada. No se encontró una decisión aprobada que lo fije. [Decisiones](../../docs/DECISIONS.md) · [Contrato Flask](../../Backend/docs/API.md) · [Adaptadores](../../frontend/src/services/api/adapters.ts)

## Procedencia verificada

- `alertas_activas` en `GET /api/astronauts/{id}/status` contiene `id`, `ts`, `variable`, `valor`, `severidad`, `mensaje` y `guia`. El endpoint de alertas añade ID de astronauta, creación y datos de acuse. Ninguna de esas proyecciones contiene procedencia.
- La ingesta evalúa reglas del servidor para lecturas insertadas con calidad distinta de `sensor_fault`. La alerta guarda la marca de tiempo de la lectura y la hora de creación por separado. La ejecución de una regla identifica el mecanismo de generación. El lote, el esquema y las respuestas actuales no identifican si la lectura de origen vino de un sensor físico o de un simulador.
- En L10-B el emisor se verificó mediante el laboratorio aislado, el perfil ejecutado y la traza del dato hasta React. Ese contexto permite anunciar **«demostración con telemetría simulada»** para esa sesión. No permite que React etiquete una alerta individual a partir de su severidad, valor, nombre, timestamp o de la portada.

## Solicitud técnica para Mauricio y el líder

**1. Antigüedad.** Confirmar por perfil operativo la cadencia esperada por variable, el reloj de referencia y el máximo de edad aceptable en segundos. Registrar el acuerdo con revisión y alcance. La opción mínima es publicar esa tabla como política versionada y reutilizar `ts` en los DTO existentes. Si el reloj del navegador no cumple la precisión acordada, decidir cómo suministrar una referencia del servidor antes de activar clasificación. `received_at` sería un dato adicional para medir retraso de transporte si se necesita en otra fase. Para P0, la edad puede definirse desde la captura sin ampliar las respuestas actuales.

**Aceptación.** Con reloj y corte acordados, probar edades menor, igual y mayor al límite. La igualdad es reciente con la implementación actual de `getFreshness()` y debe confirmarse como parte de la decisión. Sin política, con hora futura o inválida, mantener desconocido. Verificar que una muestra antigua siga siendo antigua con nodo online, que una muestra reciente pueda conservarse con nodo offline, y que el cero y la calidad se preserven en todos los casos. Confirmar cómo se vuelve a evaluar una vista abierta al cruzar el límite.

**2. Procedencia.** Aprobar un campo opcional **`source` en la alerta** con valores propuestos `simulator`, `physical_sensor` y `unknown`. El servidor asignaría y persistiría la fuente de la medición causal usando una identidad de emisor o un contexto de laboratorio verificable. Confirmar cómo se autoriza esa identidad y se conserva al pasar de la lectura a la alerta. La severidad y la generación por reglas conservan su semántica actual. Si posteriormente se necesita distinguir alertas generadas por escenarios directos de las generadas por reglas, eso corresponde a un campo de generación separado y queda fuera de la ampliación mínima.

**Ejemplo ilustrativo de un elemento de `alertas_activas` · propuesta no aprobada**

```json
{
  "id": 42,
  "ts": 1794732821,
  "variable": "heart_rate",
  "valor": 141.5,
  "severidad": "critical",
  "mensaje": "Aviso de laboratorio",
  "guia": "",
  "source": "simulator"
}
```

**Compatibilidad y aceptación.** Ampliar el mismo campo en las dos proyecciones de alertas, sin cambiar llaves ni unidades existentes. Tras aprobar el contrato, un adaptador actualizado deberá aceptar respuestas antiguas y conservar `unknown` cuando el campo falte o no sea reconocido. Probar alertas con distinto emisor y el mismo valor y severidad. Solo la de procedencia simulada verificada debe mostrar el rótulo individual. Probar también datos anteriores al cambio y una alerta real de laboratorio trazada desde ingesta; los textos clínicos conservan su política de publicación. No se propuso una ruta nueva ni se implementó el ejemplo JSON.

## Validación y cierre

- `npm run check`, `npm run build` y la batería de **18 pruebas** de API, PWA, Asistencia y J03/J04 pasaron. `git diff --check` pasó.
- La regresión en Edge a **1440, 375 y 320 px** usó fixtures sintéticos para comprobar la hora UTC y antigüedad sin clasificar junto a un nodo online, la distinción de calidad en el histórico y la alerta con severidad visible y sin rótulo individual de simulación. Se usaron las consultas de prueba existentes. No se reejecutó la ingesta de L10-B.
- **Mauricio** confirma los datos del productor, la fuente verificable y la compatibilidad del contrato. **Equipo y líder** aprueban reloj, cadencia, corte y comportamiento al cruzarlo. **Frontend Lead** conecta únicamente la política y metadatos aprobados y verifica los casos anteriores.
- El cierre P0 de L11 requiere esas dos decisiones. Los pendientes de cuestionario y del equipo final registrados en J05 continúan en sus líneas de trabajo. La solicitud de coordinación queda en este informe para revisión humana.
