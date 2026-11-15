# Propiedad y alcance

L00 solo autoriza crear `leader-workstream/`. Las rutas técnicas de las fichas son propuestas de escritura para una ejecución futura autorizada. Comprueba cambios de otros propietarios e instrucciones aplicables en cada carpeta.

| Zona | Responsable | Escritura del líder en este plan |
| --- | --- | --- |
| Manifiesto, lockfile, Vite, TypeScript, entrada y tooling frontend | Líder | Solo archivos enumerados en L01 y configuraciones de prueba expresamente previstas por L07. |
| `frontend/src/app/` | Líder | Tema, shell, navegación, controladores y composición según cada ficha. |
| `frontend/src/services/api/` | Líder, coordinado con Mauricio | Transporte, adaptadores, validación y pruebas contractuales del consumidor. |
| `frontend/src/pwa/` y recursos de instalación | Líder | Solo L06 y archivos enumerados allí. |
| `frontend/src/features/crew/components/` y `frontend/src/features/alerts/components/` | Junior | Solo lectura e importación. Cambios y pruebas colocalizadas corresponden al junior. Las vistas en `src/app/` consumen sus props. |
| `frontend/tests/` | Líder para integración | Pruebas de aplicación y fixtures de consumidor acordados, dentro de las rutas de las fichas. |
| `Backend/` | Mauricio | Solo lectura. No alterar código, configuración, dependencias, base de datos o documentación. |
| `junior-workstream/` | Junior y responsables | Solo lectura. Acuerdos de interfaz se registran en este plan y se comunican al junior. |
| `leader-workstream/` | Líder | En ejecución ordinaria, progreso e informe del entregable. Cambios de alcance requieren acuerdo. |
| `docs/`, README raíz, instrucciones, infraestructura y Git | Responsables respectivos | Solo lectura para este plan, salvo nuevo encargo explícito. |

El código que reciba una lista, un estado o una acción de UI vive en el junior cuando es presentación; la selección, las consultas y sus efectos viven en controladores del líder. Si un cambio atraviesa esa frontera, registrar revisión, archivo, interfaz, conducta esperada y quién modifica cada lado. Conserva trabajo previo y escala conflictos. Cambios de rama, commits, push, merges, rebases, apertura de PR y despliegue requieren autorización.
