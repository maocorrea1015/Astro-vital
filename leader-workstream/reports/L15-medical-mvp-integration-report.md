# L15 · Integración documental y demostración observacional del MVP

**Rama** `feature/medical-mvp-final` · **Base** `2f5f01b` · **Estado** demostración local integrada y verificada. Uso operativo pendiente de aprobación.

La fuente de contenido fue **Astro-vital_Ficha_Investigativa_v0.1.pdf**, 14 páginas, del 15/11/2026. Su estado es pendiente de revisión médica. El apéndice distingue referencias registradas, cifras por comprobar, propuestas internas y vacíos de evidencia. La interfaz conserva esa distinción y limita el alcance a la demostración educativa autorizada en el encargo. La observación no activa diagnósticos, tratamientos, guías de maniobras, comunicaciones ni reglas nuevas.

## Qué quedó implementado

- **Separación de modos.** [El catálogo operativo](../../frontend/src/app/assistanceContent.ts) sigue en `pending`. El [catálogo demostrativo](../../frontend/src/app/observationContent.ts) conserva versión, fecha, audiencia, aplicabilidad y trazabilidad. La UI se activa exclusivamente en desarrollo con `VITE_ASSISTANCE_DEMO=true` y un hostname de loopback. Los módulos del catálogo se cargan solo en desarrollo. Se confirmó su ausencia del bundle de producción y que `preview` mantiene el catálogo pendiente incluso con el interruptor activo.
- **A-01.** Se inicia manualmente en Asistencia para el astronauta seleccionado. Cuatro pasos agrupan nueve campos de respuesta y conservan los IDs de origen. Q05 queda fuera por requerir formación y autorización no disponibles. Q06 y Q08 se separaron para evitar respuestas ambiguas. Cada campo permite «No se puede determinar». Se mantienen la corrección, cancelación, reinicio y conservación de sesión por navegación. [Flujo observacional](../../frontend/src/app/ObservationWorkspace.tsx)
- **Resumen y sensores.** El resumen muestra identidad, versión, fecha UTC de inicio, respuestas, número de respuestas no determinadas, telemetría disponible, hora de medición y calidad. El sensor aporta contexto, con antigüedad sin clasificar y estado vacío explícito. El resumen permanece en memoria. Copiar exige una acción manual y añade la advertencia de uso demostrativo. Finalizar limpia la sesión.
- **Alertas.** El aviso conserva ID, severidad y valor que devuelve Flask, y separa su hora de la última lectura disponible. El texto clínico crudo y el campo `guia` se mantienen fuera de la presentación. En laboratorio, **Ver información relacionada** abre una ficha de la variable, y **Iniciar asistencia** conserva el ID. La identidad sintética se anuncia para la sesión de demostración. La procedencia individual sigue sin informar. [Alertas](../../frontend/src/app/AlertsPage.tsx)
- **Biblioteca.** [El diálogo documental](../../frontend/src/app/ObservationDocument.tsx) muestra C-01 y C-02 como referencias terrestres sin validación espacial y C-03 como contexto espacial documentado. Presenta las limitaciones y once enlaces originales registrados por la ficha. Los contextos de FC, SpO₂, temperatura, actividad y radiación referencian el banco documental sin convertir mediciones en conclusiones clínicas. Se contrastaron páginas institucionales de referencia y se conservó el estado de revisión de la ficha. [NASA Medical Operations](https://www.nasa.gov/reference/6-0-medical-operations/) · [AHA Adult Basic Life Support](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support) · [Cruz Roja](https://www.redcross.org/take-a-class/resources/learn-first-aid/unresponsive-and-breathing-person)

| Paso demostrativo | IDs | Criterio de presentación |
| --- | --- | --- |
| Respuesta y respiración | Q01, Q02 | Observación y opción indeterminada. Q02 advierte sobre la dificultad de distinguir boqueos sin entrenamiento. |
| Observaciones y antecedentes | Q03, Q04, Q07 | Registra reporte visible o conocido, sin activar maniobras. |
| Entorno operativo | Q06a, Q06b | Separa EVA o traje de alarma ambiental reportada. |
| Disponibilidad de apoyo | Q08a, Q08b | Separa CMO y canal con Tierra. Las respuestas quedan como contexto de sesión. |
| Excluida | Q05 | Identificada en el catálogo documental como especializada. No se presenta con texto operativo ni opciones en la interfaz. |

La numeración y las referencias R01–R11 están en el catálogo y en el diálogo. La ficha no verificó de forma independiente todas las citas ni la aplicabilidad de maniobras en microgravedad. Se excluyeron sus cifras discutidas, las afirmaciones sin respaldo operativo y los procedimientos. Continúan abiertos política de frescura, procedencia por alerta de L11 y aprobación del contenido por la responsable médica.

## Evidencia y pruebas

| Verificación | Resultado |
| --- | --- |
| `npm run check`, `npm run build`, `git diff --check` | Pasaron. |
| Batería automatizada | **22/22**. Se conservaron las 20 existentes. Las dos nuevas prueban aislamiento del catálogo, IDs, exclusión de Q05 y trazabilidad de fuentes. |
| [Regresión Edge A-01](../../frontend/tests/observation-demo.browser.mjs) | Pasó a **1440 × 900, 1366 × 768, 375 y 320 px** con datos sintéticos interceptados. Verificó alerta, enlaces, sensores, estado sin mediciones, avance, corrección, conservación de sesión, resumen, reinicio y cancelación. La copia se probó con un portapapeles interceptado. Se comprobaron 13 GET por ancho sin POST ni cabecera `X-API-Key`. |
| L14 y PWA | La regresión visual L14 pasó a sus seis anchos con el modo cerrado. Preview conservó el aviso pendiente con ambos interruptores activos. La recarga offline fue servida por el worker y mantuvo el aviso de datos no disponibles. |
| Simulador y Flask reales | Laboratorio aislado en loopback con SQLite temporal y puerto alterno 15000. Los lotes normales persistieron 10 lecturas y el perfil de anomalía elevó el total a 15. Flask devolvió dos alertas activas, incluida FC crítica de **141,4 bpm**, UNIX **1794742727**. Edge recorrió Monitoreo, Alertas, ficha, Asistencia, resumen y finalización. React emitió **26 GET, cero POST, cero solicitudes con API key**. [Datos del ensayo](evidence/L15/laboratorio.json) |

Las capturas se obtuvieron en Edge con transporte sintético interceptado, separado del ensayo Flask.

| Vista | Escritorio | Móvil |
| --- | --- | --- |
| Ficha contextual | [1440](evidence/L15/ficha-contextual-1440.webp) | [375](evidence/L15/ficha-contextual-375.webp) |
| A-01 | [1440](evidence/L15/cuestionario-1440.webp) | [375](evidence/L15/cuestionario-375.webp) |
| Resumen | [1440](evidence/L15/resumen-1440.webp) | [375](evidence/L15/resumen-375.webp) |

La lista de respuestas admite desplazamiento dentro del panel en escritorio. En móvil la página permite desplazamiento natural. No se validó un lector de pantalla ni el equipo final del jurado.

## Preparación y recuperación de la demo local

Desde la raíz, en una consola. El arnés de L10-B arranca Flask en loopback, comprueba la SQLite temporal y crea una credencial efímera de ingesta que la UI nunca recibe. Debe estar libre el puerto 5000 antes de usar este comando. [Arnés L10-B](evidence/L10-B/laboratorio.py)

```powershell
$astroRepo = (Get-Location).Path
$astroLab = Join-Path ([IO.Path]::GetTempPath()) ('astro-l15-' + [guid]::NewGuid())
python -m venv $astroLab
$astroPython = Join-Path $astroLab 'Scripts\python.exe'
& $astroPython -m pip install Flask==3.1.3 flask-cors python-dotenv requests
& $astroPython "$astroRepo\leader-workstream\reports\evidence\L10-B\laboratorio.py" $astroRepo
```

En otra consola, desde `frontend/`:

```powershell
npm ci
$env:VITE_LOCAL_ANONYMOUS_READ = 'true'
$env:VITE_ASSISTANCE_DEMO = 'true'
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Comprueba `ready: true`, `health: 200` y `post_sin_clave: 401` antes de enviar lotes. Abre `http://127.0.0.1:5173/#/` y confirma el rótulo de laboratorio. Escribe `normal` y después `tachycardia` cuando indique el guion. Para ensayar pérdida de Flask, usa `stop`, verifica el mensaje y usa `start` y **Reintentar**. El comando `sensor_fault` permite preparar el caso de calidad. Cierra el arnés con `quit`, detén Vite y elimina ambos interruptores del entorno. Para el ensayo PWA estático usa `npm run build` seguido de `npm run preview -- --host 127.0.0.1`.

| Tiempo | Guion de jurado |
| --- | --- |
| 0:00–0:50 | Abrir Inicio, identificar el laboratorio sintético, elegir el astronauta y consultar figura, indicadores y tendencia tras `normal`. |
| 0:50–1:40 | Lanzar `tachycardia`, volver a consultar y abrir la alerta realmente generada. Mostrar severidad, fecha y la ficha vinculada. |
| 1:40–3:55 | Abrir Asistencia desde la alerta, iniciar A-01, responder, retroceder y corregir una opción. Mostrar contexto del sensor y completar cuatro pasos. Abrir el resumen y C-03. |
| 3:55–5:00 | Mostrar finalización, el alcance del material documental y la limitación offline o de calidad. La recarga PWA se demuestra en preview. |

**Antes de presentar:** confirmar equipo, disponibilidad del puerto, datos sintéticos, alerta en REST y React, cuatro pasos, fuentes y cero escrituras del navegador. El modo observacional se demuestra solo en desarrollo y loopback. Para publicación siguen pendientes aprobación médica, alcance operativo, acceso protegido de mismo origen y acuerdos con Mauricio. No se modificaron backend, simulador, contratos, reglas, PWA ni componentes del junior. No hubo commits, push, merges ni despliegues.
