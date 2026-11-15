# L05 · Monitoreo y telemetría

Rama `feature/frontend-telemetry`, HEAD inicial `f30862b`, árbol inicial limpio. L01–L04-A estaban incorporados. **Estado: verificado localmente; integración autenticada y composición definitiva pendientes.** Revisión humana pendiente.

## Implementación

Monitoreo carga el catálogo con L03 y ofrece un selector nativo accesible. `#/monitoreo/{id}` conserva la selección al recargar; el menú mantiene Monitoreo activo y el foco del selector se conserva al cambiar de astronauta. El contenedor distingue API no configurada, carga, datos, vacío, recurso ausente y error con reintento. Cambiar de ID aborta la consulta de lecturas anterior y descarta respuestas tardías. El contacto y la conectividad corresponden al nodo reportado por el catálogo.

La única nueva operación HTTP del consumidor es `GET /api/astronauts/{id}/readings`, documentada en [API.md](../../Backend/docs/API.md) e inspeccionada en [la ruta Flask](../../Backend/routes/astronauts.py). Usa el intervalo predeterminado de 24 h y hasta 100 registros, en el orden descendente del proveedor. La extensión reutiliza cliente, validación del histórico, adaptador y tratamiento de 429 de L03. Comprueba que cada registro pertenezca al ID solicitado. No se alteraron DTO, backend ni rutas del proveedor.

El contenedor muestra variable, valor, unidad cuando existe, hora UTC y calidad. Conserva cero y CPM. Actividad se muestra como valor reportado con unidad sin confirmar. La procedencia queda desconocida. La hora queda visible y la frescura se declara sin criterio configurado. Conectividad, calidad y antigüedad se tratan como estados independientes. No se interpretan clínicamente los datos.

El arranque estándar conserva el acceso protegido deshabilitado. Las pruebas usaron un transporte local inyectado y respuestas sintéticas de alcance controlado. La conexión de navegador con Flask, el mecanismo seguro y la procedencia confirmada siguen pendientes con Mauricio.

## Archivos modificados o creados

| Ruta | Cambio |
| --- | --- |
| `frontend/src/app/TelemetryPanel.tsx` | Contenedor de monitoreo, selector, consulta de histórico y presentación textual. |
| `frontend/src/app/telemetryPresentation.ts` | Etiquetas de variable, calidad y formato temporal compartidos con el detalle. |
| `frontend/src/app/AstronautPage.tsx` | Reutiliza esas etiquetas y formato. |
| `frontend/src/app/App.tsx`, `AppShell.tsx`, `navigation.tsx` | Montaje de la vista, destinos, indicación activa y foco. |
| `frontend/src/app/crewQuery.ts` | Amplía el tipo de fuente con la lectura de histórico. Reutiliza el ciclo cancelable. |
| `frontend/src/services/api/astronauts.ts` | Nuevo método de lectura dentro de la instancia L03. |
| `frontend/tests/api.test.ts` | Dos pruebas para ruta, validación, adaptación, acceso deshabilitado, vacío y fallo. |
| `leader-workstream/PROGRESS.md` y este informe | Seguimiento y evidencia. |

## Verificaciones

- Iniciales: `npm run check`, `npm run build` y `npm run test:api` pasaron, con 8 pruebas de API.
- Finales: esos tres comandos pasaron, con 10 pruebas de API. Lint no está configurado.
- Edge con Playwright del entorno a 1440, 375 y 320 px: entrada desde navegación, API no configurada, selección por teclado incluida señal visible de foco, recarga del destino, cancelación verificada en el transporte y descarte de respuesta tardía. También se probaron valor cero en CPM, calidad degradada, hora UTC, consulta vacía, error 500 y reintento, ID fuera del catálogo, reflujo y consola. La repetición final registró cero errores de consola, cero desbordamientos en las vistas verificadas y cero solicitudes reales de datos.
- Se usó una entrada temporal de Vite con Playwright y respuestas inyectadas para la verificación del navegador. La prueba de navegador no quedó como script del repositorio y no se ejecutó una auditoría completa de accesibilidad ni una conexión real con Flask.
- `git diff --check` y revisión de espacios de los nuevos archivos pasaron. El diff y los hashes confirmaron que `Backend/`, `junior-workstream/` y las rutas de componentes del junior se conservaron. Dependencias y lockfile intactos. Sin operaciones Git de escritura.

## Dependencias y avance

**75% del alcance integral de L05, medido como 6 de 8 hitos.** Se verificaron selector y navegación, estados y cancelación, consumo del histórico, presentación segura, pruebas locales, y documentación y verificación de alcance. Quedan dos hitos de integración:

1. **Mauricio y líder.** Verificar acceso autenticado de mismo origen y una lectura real. Acordar procedencia, escala o unidad de actividad, criterio de frescura y, si se necesitan, otros filtros o ventanas. La antigüedad se mostrará según ese criterio cuando esté confirmado.
2. **Junior y líder.** Integrar J03 y J04 una vez disponibles y acordar props del panel y las tendencias, identidad de muestra, unidad nullable, fecha, calidad, procedencia, estados de consulta y callbacks de reintento o cambio de filtro. Las alertas y el reconocimiento de la ficha integral quedan pendientes de componentes, datos y autorización del alcance. El contenedor actual conserva una presentación mínima y carece de gráficas o tarjetas duplicadas.

L06 permanece sin iniciar.
