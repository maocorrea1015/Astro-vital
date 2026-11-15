# J05 · Calidad, accesibilidad y pruebas

**Objetivo.** Verificar J01–J04 en un entorno ejecutable y dejar evidencia de integración. Depende de la base del líder, los entregables anteriores técnicamente verificados y sus informes.

**Rutas autorizadas.** Solo archivos TSX y pruebas ya enumerados en J01–J04 para correcciones locales. Actualiza `junior-workstream/PROGRESS.md` y `junior-workstream/reports/J05-report.md`. Los cambios de tema, tooling, infraestructura o harness compartido van al líder.

| Revisión | Evidencia mínima |
| --- | --- |
| Visual y responsive | Verificar escritorio y móvil en el entorno disponible. Registrar dimensiones, textos largos, reflujo y ausencia de desbordamientos. |
| Accesibilidad | Recorrer selección, filtros y acciones con Tab, Enter y Espacio según semántica. Verificar foco, etiquetas, orden de lectura, contraste y estados con texto. Revisar alternativa de gráficas. |
| Datos y excepciones | Probar completos, parciales, cero, nulo, desconocido, vacío, serie de un dato, fallo de consulta, nodo offline, obsolescencia y calidad degradada. |
| Verificación automatizada | Ejecutar chequeo TypeScript, build de producción y pruebas disponibles con scripts y dependencias existentes. Registrar comando, entorno, resultado y cualquier fallo. |
| Diff y permisos | Revisar cambios, archivos no rastreados y `Backend/` contra la línea base. Confirmar que los informes y fixtures excluyen secretos y datos personales. |
| Integración | Enumerar importaciones, props, estados, callbacks, dependencias y quién compone el flujo. Documentar los criterios que necesita comprobar el líder en la aplicación. |

Aceptación: todas las verificaciones esenciales se ejecutaron y pasaron. Si un script, medio de render o dependencia falta, registrar responsable y comando o criterio pendiente. Corregir solo defectos locales autorizados y repetir las pruebas afectadas. Si el defecto depende de bases externas, reportarlo con caso reproducible. Marca revisión del líder por separado y entrega el informe final. Detén la ejecución al completar J05.
