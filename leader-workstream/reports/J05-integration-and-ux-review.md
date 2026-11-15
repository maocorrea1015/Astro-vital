# J05 · Conciliación y revisión UX del MVP

**Rama** `feature/frontend-j05-validation` · **Base** `23d6eb0`, comprobada contra `main` remoto · **Estado** verificación de frontend completada, pendiente de revisión del líder y de las dependencias P0 descritas abajo.

Se hicieron las comprobaciones sobre el árbol actual, con J03/J04, L10-A y L10-B incorporados. El [informe original J05](../../frontend/docs/reports/J05-validation-audit.md) ya estaba en el árbol como archivo sin seguimiento. Se conserva íntegro, con hash Git `e6425c3bbe87d0e26f4a6eaa725121f8029d7d4c`. Sus 13 resultados proceden del informe preliminar que el junior transcribió. La auditoría original declara que no ejecutó las pruebas.

## Conciliación

| Evidencia | J05 original | Base actual |
| --- | --- | --- |
| API | 10 casos informados | **11 aprobados**. Se añadió el caso de lectura local optativa en loopback sin credenciales. |
| PWA | 3 casos informados | **3 aprobados** sobre el build. Manifiesto e iconos, ámbito del worker y rechazo de respuestas privadas. |
| Asistencia | Fuera del inventario original | **2 aprobados**. Catálogo sin aprobación y transiciones de sesión con contenido de prueba. |
| J03/J04 | Sin casos específicos en el inventario original | **2 aprobados**. Adaptación de histórico y alerta activa. Se amplió la aserción de timestamps sin añadir un caso al conteo. |
| UI | J05 citó L07 como evidencia separada | Existe una regresión de navegador de J03/J04. Los recorridos Edge se informan aparte de los **18** casos Node. |
| Flask | J05 no ejecutó integración real | L10-B acredita el recorrido aislado con el simulador, SQLite, API y React. Se reutilizó esa evidencia. |

El plan vigente asigna `MeasurementIndicator`, `AstronautCard` y `AlertCard` a **J01**, y `CrewView` a **J02**. Se usa ese reparto para la conciliación. [Plan de integración](../INTEGRATION_PLAN.md)

| Recomendación de J05 | Estado actual |
| --- | --- |
| Corregir las props de `Stack` y verificar tipos y build | Resuelta en J03/J04. El build actual conserva las correcciones. El aviso del futuro cargador nativo de Vite sigue siendo una nota de mantenimiento. |
| Verificar foco, teclado, selección, reintento, desconexión y pantallas estrechas | L07 aporta evidencia de foco, contraste y reflujo. J03/J04 y esta revisión cubren los recorridos actuales. Queda pendiente la evaluación con lector de pantalla. |
| Validar indicadores, series y estados de J03/J04 | Hay pruebas de adaptación e integración en navegador. Quedan como cobertura adicional los casos aislados de todas las variantes de tarjetas y props. Los selectores de rango y el acuse quedan fuera del alcance actual de la vista. |
| Acordar colección, filtro y acciones de alertas | La vista consume las alertas activas del astronauta desde su estado, filtra por severidades presentes y carece de acción de acuse. Las recomendaciones sobre filtros de reconocimiento y callbacks necesitan una ampliación de alcance aprobada. |
| Probar React contra Flask | Resuelta en laboratorio por L10-B. El acceso protegido compartido sigue pendiente. |

## Revisión UX y corrección

Edge a **1440, 375 y 320 px** recorrió Inicio → Tripulación → Detalle → Monitoreo → Alertas → Asistencia con datos sintéticos. Se verificaron destinos y enlaces, etiquetas, foco por teclado, gráfico y tabla, carga/error/vacío y reintento de Alertas, y acceso a Asistencia con el ID del astronauta. La regresión comprueba el ancho de página en las vistas ejercitadas. No hubo desbordamiento en los recorridos completados. La revisión se apoyó también en los casos de carga, error y desconexión ya documentados por L07 y L10-B. La prueba de Inicio en preview confirmó que la recarga offline conserva el contenido y la navegación a 375 px.

| Clase | Hallazgo y decisión |
| --- | --- |
| Usabilidad reproducible · corregido | Dos muestras tomadas en segundos distintos del mismo minuto mostraban la misma hora en el histórico. Ahora el eje temporal y la tabla incluyen segundos en UTC. Pasaron las aserciones de adaptación y la variante en Edge. A 1440 px, el ensayo mostró `07:34:38` y `07:34:39` en el eje y las dos marcas completas en la tabla. |
| Dependencia de producto | Inicio declara que la demo usa datos simulados. Dentro de los módulos se indica procedencia desconocida, conforme a los DTO vigentes. La tarjeta de alerta carece de una señal de origen verificable para etiquetar la simulación individualmente. |
| Dependencia de producto | La UI distingue conexión del nodo, calidad y error de API. La hora de captura está disponible. El criterio de antigüedad por métrica sigue sin acuerdo, por lo que la UI no clasifica frescura. |
| Mejora cosmética opcional | Se conservó el tema común Material UI. No se aplicaron cambios de paleta, tipografía o densidad de los módulos. |
| Cobertura | La prueba de integración valida comportamientos visibles del MVP. Quedan fuera de la evidencia una auditoría WCAG completa, lector de pantalla y pruebas en el equipo final. |

**Archivos de código**. [Adaptación de telemetría](../../frontend/src/app/telemetryPresentation.ts) formatea la hora histórica con segundos. [Gráfica histórica](../../frontend/src/features/crew/components/MeasurementTrend.tsx) usa segundos en el eje. [Prueba J03/J04](../../frontend/tests/j03-j04.test.ts) exige marcas distintas para dos muestras dentro del mismo minuto.

## Matriz de cierre del MVP

Referencia directa a la propuesta definitiva, **§12, Alcance funcional priorizado**, con aceptación complementaria de **§21** y el guion de **§22**. La sección 12 prioriza carga PWA de escritorio en P0. Ubica en P1 la instalación verificada, el histórico gráfico, la persistencia de eventos y la recuperación tras desconexión.

| Prioridad y requisito | Estado | Evidencia o condición de cierre |
| --- | --- | --- |
| P0 · Carga PWA en escritorio | **Verificado** | Build servido en Edge, manifiesto y worker comprobados. La recarga offline conserva el shell. |
| P0 · Astronautas | **Verificado** | Catálogo, selección e identidad en detalle con fixtures actuales y laboratorio L10-B. |
| P0 · Lecturas JSON | **Verificado** | Validación, valores, unidades confirmadas, tiempo UTC y calidad en detalle y monitoreo. |
| P0 · Estado de error | **Verificado** | Error de consulta, estado vacío, reintento y navegación offline. La telemetría queda oculta cuando el navegador pierde conexión. |
| P0 · Antigüedad de lecturas | **Bloqueado por dependencia externa** | Mauricio y líder deben acordar el criterio por variable antes de marcar muestras antiguas. La conexión del nodo no sirve como criterio de frescura. |
| P0 · Alertas simuladas identificables | **Bloqueado por dependencia externa** | La alerta se generó y se verificó en L10-B. Hace falta procedencia verificable en el contrato o en el contexto explícito del laboratorio para etiquetar cada alerta. |
| P0 · Entrada manual a Asistencia | **Verificado** | Se abre sin alerta y conserva el astronauta desde las vistas contextuales. |
| P0 · Flujo de preguntas | **Bloqueado por dependencia externa** | La sesión y sus transiciones tienen pruebas. La responsable médica debe aprobar el cuestionario y el equipo debe confirmar el escenario. El catálogo de producto sigue vacío. |
| P0 · Contenido revisado o marcado pendiente | **Verificado** | Se cumple la alternativa del aviso de validación pendiente. Los módulos no publican guías sin aprobación. |
| P0 · Demo integrada | **Implementado pero pendiente de validación** | Simulador → Flask → SQLite → REST → React verificado en laboratorio. Falta repetir el guion con la revisión final en el equipo previsto. |
| P1 · Instalación PWA | **Implementado pero pendiente de validación** | L08 documenta modo standalone en Edge. Falta comprobar instalación y apertura desde el icono en el equipo de presentación. |
| P1 · Gráficas históricas | **Verificado** | J03 y Edge verificaron gráfico, tabla y estados de serie. |
| P1 · Recuperación tras desconexión | **Verificado** | El laboratorio L10-B recuperó las consultas tras reiniciar Flask. |
| P1 · Persistencia de eventos de asistencia | **Fuera del alcance priorizado** | La propuesta lo ubica en P1 aunque §22 lo menciona en el guion. La persistencia de lecturas y alertas del backend no acredita registro de una sesión de asistencia. El guion actual termina con el aviso médico. |
| P1 · Bienestar | **Fuera del alcance priorizado** | Fuera del cierre P0. |
| P2 y exclusiones · sincronización offline, push, diagnóstico y certificación | **Fuera del alcance priorizado** | Fuera de la validación J05. |

## Próximos pasos y responsables

1. **Mauricio y líder frontend** deben acordar el criterio de antigüedad y la procedencia de las alertas simuladas. Mauricio confirma contrato y entorno de acceso. El líder conecta la presentación y verifica aceptación.
2. **Responsable médica** revisa y aprueba preguntas, mensajes y escenario. El **líder frontend** activa el flujo bajo ese alcance y verifica navegación, corrección y salida.
3. **Líder frontend** repite el guion L10-B en el equipo de presentación y verifica instalación y apertura PWA. El **junior** apoya la cobertura de componentes y la revisión con lector de pantalla, dentro de su asignación.
4. **Líder frontend y equipo** confirman si el registro de eventos entra en una siguiente fase. Si se prioriza, **Mauricio** confirma persistencia autorizada y la **responsable médica** revisa el contenido y los datos que se pueden registrar.

## Evidencia y reproducibilidad

- `npm run check`, `npm run build`, las pruebas API/PWA, asistencia y J03/J04, y `git diff --check` pasaron. La batería Node pasó **18/18** antes y después de la corrección. El ensayo Edge de la regla de timestamp no se añade a ese total.
- Se reutilizó la regresión de navegador existente con respuestas ficticias. Una ejecución del arnés tuvo una espera vencida en Alertas a 375 px. La comprobación controlada esperó el encabezado de destino y mantuvo temporalmente visible la carga antes de verificar error, reintento y vacío.
- No se usaron credenciales reales ni datos médicos personales. No se repitió la ingesta contra Flask porque L10-B ya aportó evidencia y el cambio afecta únicamente formato de presentación.
- [L07](L07-report.md) · [J03/J04](J03-J04-integration-report.md) · [L10-A](L10-A-report.md) · [L10-B](L10-B-demo-validation-report.md) · [Progreso](../PROGRESS.md).
