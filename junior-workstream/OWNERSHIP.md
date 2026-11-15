# Propiedad y permisos

La autorización actual cubre únicamente la creación del paquete documental. La tabla de escritura describe los permisos futuros al activar [el prompt de ejecución](prompts/02-autonomous-execution.md). La lista exacta de archivos vive en cada ficha. Si un archivo ya pertenece a otro desarrollador o contiene cambios concurrentes, coordina antes de editarlo.

| Zona | Propietario | Lectura junior | Escritura junior al ejecutar | Autorización y riesgo |
| --- | --- | --- | --- | --- |
| Archivos de presentación en `frontend/src/features/crew/components/` y `frontend/src/features/alerts/components/` | Junior según asignación | Sí | Solo archivos y pruebas colocalizadas enumerados en J01–J05 | Composiciones existentes, barrels o tipos compartidos requieren acuerdo del líder. |
| Resto de `frontend/src/features/`, `frontend/src/components/` y fixtures compartidos | Líder o propietario asignado | Sí | Requiere asignación específica | Riesgo de contratos internos y superficies compartidas. |
| `frontend/src/app/`, entradas, tema, navegación, estado global y composición | Líder | Sí | Reservada al líder | Riesgo de colisión con inicialización e integración. |
| `frontend/src/services/api/`, autenticación, adaptadores y contratos REST | Líder con Mauricio | Sí, referencias y código | Reservada a responsables | Riesgo de divergencia contractual y de exponer secretos. |
| PWA, assets globales, infraestructura, manifiestos, lockfiles y configuración React/Vite/TS/pruebas | Líder o responsable de infraestructura | Sí, evitando secretos | Reservada a responsables | Solicitar cambios de tooling y dependencias. |
| `Backend/` y reglas del servidor | Mauricio | Solo lectura | Prohibida en este flujo | Cambios de API, persistencia, ingesta y seguridad corresponden a Mauricio. |
| `docs/`, README raíz, instrucciones de agentes y prompts previos | Equipo y responsables | Sí | Requiere autorización específica | Conflictos de política y pérdida de instrucciones. |
| `junior-workstream/` | Junior y líder | Sí | Durante ejecución, `PROGRESS.md` y el informe J correspondiente | Cambios de alcance y plan requieren al líder. |
| Git, ramas, historial y despliegue | Desarrolladores responsables | Inspección Git de solo lectura | Sin operaciones de escritura de Git en este flujo | Coordinación por GitHub Desktop si se requiere sincronizar la rama. |

Para solicitar cambios fuera del ámbito, registra entregable, archivo o dependencia, responsable, razón, opciones disponibles, verificación bloqueada y acción esperada. El líder coordina los cambios con el proveedor cuando corresponda.
