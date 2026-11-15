# L02 · Shell y navegación

## Objetivo y alcance

Montar una estructura navegable y responsive donde el líder integrará las vistas. La ejecución requiere el encargo técnico correspondiente.

## Arquitectura y dependencias

Shell y tema global en src/app. El junior aporta vistas internas.

**Dependencias.** L01 verificado. Mecanismo de navegación y rutas de UI acordados.

## Rutas de escritura previstas

frontend/src/app/App.tsx, frontend/src/app/theme.ts, frontend/src/app/AppShell.tsx, frontend/src/app/navigation.tsx y frontend/tests/shell.test.tsx si existe tooling.

Registra `leader-workstream/PROGRESS.md` y `leader-workstream/reports/L02-report.md`. Se protegen `Backend/`, `junior-workstream/`, los componentes y pruebas colocalizadas del junior, y cualquier ruta ajena a esta lista. Aplica [propiedad](../OWNERSHIP.md).

## Secuencia

Definir landmarks y navegación mínima; montar inicio y espacios de tripulación y detalle; definir salida para ruta desconocida; verificar recarga y retorno. Evaluar enrutador solo con alcance y dependencia autorizados.

## Contratos y datos

Identidad de destino y selección opcional. La navegación es interna y no añade endpoints. Consulta [integración](../INTEGRATION_PLAN.md).

## Comportamiento y excepciones

Foco y destino activos identificables, layout que refluje, estado de ruta vacía o inválida con retorno. Carga, error y desconexión de datos se delegan a la vista.

## Aceptación, pruebas y evidencias

Con build y entorno existente, recorrer inicio/detalle/regreso por teclado en escritorio y móvil, probar recarga y ruta inválida. Registrar rutas observadas y evidencia de foco. Usa los comandos reales del proyecto y registra skips con motivo. La aceptación exige evidencia de cada comportamiento aplicable y pruebas esenciales satisfactorias.

## Condiciones de bloqueo

Dependencia de navegación no autorizada, rutas en conflicto o fallo esencial de teclado o recarga. Registra evidencia, responsable y condición concreta de reanudación. Continúa solo en trabajo independiente autorizado.

## Informe

Usa [la plantilla](../reports/README.md) con los resultados de esta ficha, evidencia, archivos, riesgos y siguiente paso. Separa estado técnico y revisión humana.
