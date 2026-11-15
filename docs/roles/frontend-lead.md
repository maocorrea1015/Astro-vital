# Frontend líder

El líder es responsable de convertir el [alcance](../MVP_SCOPE.md) en tareas verificables de interfaz y de revisar su integración. Puede decidir la organización interna de la PWA dentro de los acuerdos. Los cambios de contrato, prioridades de producto y publicación clínica requieren a sus responsables.

## Responsabilidades y entregables

| Área | Resultado esperado |
| --- | --- |
| Arquitectura | Delimitar funcionalidades, componentes compartidos, tema MUI, adaptador y shell PWA. Documentar cambios transversales de estructura. |
| Integración | Acordar con Mauricio revisión, acceso, esquemas y fixtures. Coordinar con simulación una prueba que siga la misma muestra de origen a pantalla. |
| Experiencia | Definir selección de astronauta, jerarquía de métricas, estados y textos para error, vacío, desconexión, antigüedad y calidad. Evaluar teclado, foco, contraste y pantallas pequeñas. |
| PWA | Proponer navegador, instalación, recarga y caché. Coordinar la política de credenciales y persistencia con Mauricio. |
| Pruebas y revisión | Priorizar adaptación JSON, componentes y corte o recuperación. Revisar evidencia de criterios, impacto en otros módulos y diff autorizado. |
| Coordinación | Descomponer el trabajo del junior en tareas con entrada, salida, estados, archivos y verificaciones. Registrar bloqueos con responsable y siguiente decisión. |

## Flujo de revisión

1. Asocia la tarea a un requisito y su estado. Fija rutas autorizadas y decisiones fuera de su alcance.
2. Entrega al junior ejemplos acordados o fixtures identificados como provisionales, criterios visuales y casos esperados. Las asignaciones pueden cambiar según el alcance.
3. Revisa cambios con [la guía frontend](../../frontend/docs/README.md). Exige evidencia de comportamiento, accesibilidad, ausencia de credenciales y conformidad con los datos aprobados. Revisa los estados excepcionales descritos en la tarea.
4. Si falta un dato del proveedor, remite a Mauricio evidencia reproducible y necesidad del consumidor según [integración](../INTEGRATION_GUIDELINES.md). Registra versión, decisión y dependencia. Deriva las dudas de contenido al responsable médico.
5. Informa archivos modificados, prueba ejecutada y resultado, pruebas pendientes con motivo y decisiones que requieren intervención.

El líder modifica `frontend/` y documentación compartida solo dentro del encargo. [AGENTS.md](../../AGENTS.md) protege `Backend/` y define el alcance de operaciones Git. La asignación sigue la propuesta definitiva §§17–21 y los acuerdos de roles.
