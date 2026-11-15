# L09-B · Preparación técnica de Asistencia

**Rama** `feature/frontend-assistance-final` · **Base** `164f094`, comprobada contra `main` remoto · **Estado** preparación técnica verificada. Cuestionario clínico pendiente de revisión.

Se revisaron la propuesta definitiva, la ficha L09, la política de contenido médico y los informes L09-A, J05, L10-B y L11. L09-A ya aportaba la entrada manual, la selección contextual, el aviso médico y las transiciones de sesión en memoria para respuesta única y múltiple. La interfaz tenía confirmación, pero todavía carecía de controles de respuesta y cancelación explícita. [L09-A](L09-A-report.md) · [J05](J05-integration-and-ux-review.md) · [L10-B](L10-B-demo-validation-report.md) · [L11](L11-consistency-report.md)

## Preparación implementada

- **Entrada y selección.** Se mantienen la entrada manual y el ID contextual desde las rutas existentes. La sesión conserva el astronauta confirmado y bloquea el selector hasta cancelar. Sin contenido aprobado, se puede confirmar y cancelar mientras sigue visible «El cuestionario de asistencia está pendiente de validación médica».
- **Preguntas.** El nuevo componente de presentación consume una lista ordenada con el modelo existente. Usa radios para selección única y casillas para selección múltiple. Avanzar y finalizar requieren al menos una respuesta en el paso. Volver restaura las selecciones anteriores y permite corregirlas. Desde la pantalla de finalización también se puede volver.
- **Foco y cancelación.** El foco se traslada al encabezado del paso, de la finalización o del estado de Asistencia al cancelar. Cancelar descarta respuestas y paso, conserva la selección y permite iniciar otra sesión vacía. Salir de la vista descarta la sesión. La interacción mantiene respuestas únicamente en memoria.
- **Límite médico.** La ruta obtiene el catálogo de astronautas mediante la lectura existente. El componente recibe preguntas y opciones del catálogo local revisado. Carece de campos de guía, recomendaciones y protocolos en su interfaz de presentación. El catálogo de producto permanece en estado `pending`. No hay endpoints, escrituras ni persistencia nuevos.

| Archivo | Cambio |
| --- | --- |
| [AssistancePage.tsx](../../frontend/src/app/AssistancePage.tsx) | Montaje condicionado, selección durante la sesión, cancelación y foco. |
| [AssistanceQuestionnaire.tsx](../../frontend/src/app/AssistanceQuestionnaire.tsx) | Controles según tipo, progreso, avance, regreso y finalización local. |
| [assistanceSession.ts](../../frontend/src/app/assistanceSession.ts) | Extiende el último avance a finalización y permite regresar desde ella. |
| [assistanceContent.ts](../../frontend/src/app/assistanceContent.ts) | Formato versionado, referencias, evidencia de revisión y comprobaciones de consistencia. |
| [assistance.test.mjs](../../frontend/tests/assistance.test.mjs) | Pruebas de admisión del catálogo y finalización, regreso y reinicio. |

## Formato exacto de entrega del contenido

El junior entrega la ficha de investigación y fuentes para revisión. La responsable médica entrega la aprobación expresa vinculada a la **versión exacta de preguntas y opciones**, con fecha, responsable, audiencia, alcance y referencia al registro de aprobación. El líder integra únicamente esa versión en `assistanceCatalog` de [assistanceContent.ts](../../frontend/src/app/assistanceContent.ts), para la audiencia y el entorno acordados. Mientras esa autorización falte, se conserva `{ status: 'pending' }`.

La forma TypeScript de la entrada autorizada es:

```ts
{
  status: 'approved'
  version: string
  review: {
    reviewer: string
    reviewedOn: string
    reference: string
    audience: string
    scope: string
  }
  sources: readonly {
    id: string
    organization: string
    title: string
    url: string
    version: string
    accessedOn: string
    section: string
  }[]
  questions: readonly {
    id: string
    kind: 'single' | 'multiple'
    prompt: string
    options: readonly { id: string; label: string }[]
    sourceIds: readonly string[]
  }[]
}
```

- `version` identifica la versión que se aprobó. `review.reference` apunta al registro de aprobación. Entregar `reviewedOn` y `accessedOn` como fechas `AAAA-MM-DD`, `url` como enlace original y `section` como sección exacta. `sources[].version` identifica la edición, versión o fecha de la publicación.
- El orden de `questions` define el recorrido. Los IDs de fuentes y preguntas son únicos en el catálogo. Los de opciones son únicos dentro de su pregunta. Cada pregunta tiene al menos una opción y al menos una referencia en `sourceIds` que existe en `sources`.
- El filtro local exige estado aprobado, versión, datos de revisión y referencias no vacíos, y rechaza inconsistencias de IDs o fuentes. Comprueba estructura y trazabilidad interna. La verificación de la aprobación, la pertinencia de las fuentes y la autorización del entorno corresponden al equipo. Cambios de texto, audiencia o contexto requieren nueva revisión. No se incorporan guías a este formato. [Política médica](../../docs/MEDICAL_CONTENT_POLICY.md)

## Pruebas realizadas

| Verificación | Resultado |
| --- | --- |
| `npm run check`, `npm run build` y `git diff --check` | Pasaron. No se añadieron dependencias. |
| Batería Node | **20/20**. API 11, PWA 3, J03/J04 2 y Asistencia 4. Los casos de Asistencia cubren catálogo pendiente, rechazo de incoherencias de fuentes y aprobación incompleta, selección única/múltiple, avance, regreso, corrección, finalización y sesión nueva vacía. |
| Edge a **1440, 375 y 320 px** | Se verificaron selección contextual, confirmación con aviso pendiente, inicio por teclado, foco en cada paso, avance, corrección, finalización, retorno y cancelación. Se comprobó que cancelar conserva el astronauta y que volver a iniciar no conserva respuestas. No hubo desbordamiento horizontal en los estados comprobados. |
| Alcance de datos | La prueba de navegador inyectó preguntas ficticias sobre figuras y colores en un Vite temporal. El transporte interceptado observó únicamente GET de catálogo sin `X-API-Key`. Se verificó la ausencia de los textos de prueba en el bundle del producto. La presentación omitió un campo de guía ficticio inyectado fuera del esquema. |

## Pendientes y responsables

- **Junior** entrega la investigación y las referencias. **Responsable médica** revisa y aprueba texto, opciones, versión, audiencia y alcance. **Equipo y líder** confirman el escenario y el entorno en que se podrá usar.
- **Líder frontend** incorpora la versión autorizada sin cambiar la navegación y repite las pruebas con el contenido aprobado. Hoy la ausencia de contenido aprobado es un estado esperado del producto.
- Persistencia de eventos y publicación de protocolos siguen fuera de este cierre técnico. No se cambió `Backend/`, `script/`, `junior-workstream/` ni componentes del junior.
