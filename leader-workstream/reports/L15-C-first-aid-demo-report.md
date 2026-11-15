# L15-C · Guías interactivas y escenarios de tripulación

Rama revisada: `feature/medical-mvp-final`. El árbol incluía avances de L15 y L15-B que se conservaron.

## Implementación

- En `firstAidGuidance.ts` y `FirstAidGuidanceDialog.tsx` viven seis recorridos educativos de tres pasos. A cubre falta de respuesta con respiración anormal. B cubre falta de respuesta con respiración normal reportada. C cubre entorno, alarma o EVA. D cubre trauma o sangrado visible. E cubre antecedente de atragantamiento. F cubre evidencia insuficiente. La prioridad A → C → D → E → B permite conservar hallazgos adicionales sin confundirlos con la hipótesis seleccionada.
- `ObservationWorkspace.tsx` abre la guía al terminar la evaluación rápida y devuelve el foco a «Abrir guía» al cerrarla. El resultado permite volver a la guía o revisar y reiniciar la evaluación. El cuerpo del modal identifica escenario, versión, revisión pendiente, observaciones y datos de las fuentes disponibles. El usuario puede leer cada paso en Astro-vital y desplegar las fuentes si lo necesita.
- `App.tsx` y `AssistancePage.tsx` guardan las sesiones en memoria por ID. Cambiar el astronauta conserva las respuestas del perfil previo. `mission-modules.css` adapta el modal al tema y a pantallas estrechas.
- La ficha investigativa v0.1 sigue pendiente de revisión médica. Las referencias de soporte vital terrestre se identifican dentro de los pasos. La ficha no valida procedimientos físicos para microgravedad ni EVA. La guía comunica incertidumbre y orienta hacia procedimientos autorizados de misión. Las lecturas y severidades provienen de Flask y se muestran separadas de las observaciones. [AHA, soporte vital básico de adultos](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support) · [American Red Cross, atención a una persona que no responde y respira](https://www.redcross.org/take-a-class/resources/learn-first-aid/unresponsive-and-breathing-person) · [NASA, operaciones médicas](https://www.nasa.gov/reference/6-0-medical-operations/)

## Perfiles del laboratorio

[El laboratorio](evidence/L10-B/laboratorio.py) añade el comando `crew` al arnés existente. Ejecuta dos lotes por ID mediante el simulador original y verifica persistencia y alertas con REST. La única edición directa de la base temporal asigna nombres sintéticos. Flask calcula los avisos con sus reglas existentes y las mediciones no están incorporadas en React.

| ID | Modo del simulador | Histórico | Resultado observado |
| --- | --- | ---: | --- |
| astro-01 | normal | 10 | Calidad nominal, sin avisos |
| astro-02 | tachycardia | 10 | Alerta crítica cardiovascular, con posibles avisos SpO₂ secundarios |
| astro-03 | hypoxia | 10 | Alerta crítica SpO₂ y avisos cardiovasculares secundarios |
| astro-04 | radiation | 10 | Alerta crítica de radiación en CPM |
| astro-05 | sensor_fault | 10 | Marcadores de fallo del sensor, sin avisos |

Iniciar desde la raíz con `python leader-workstream/reports/evidence/L10-B/laboratorio.py .` en un intérprete con Flask, flask-cors, python-dotenv y requests, con el puerto 5000 libre. Esperar el mensaje de disponibilidad y escribir `crew` una sola vez en el laboratorio recién iniciado. En otra PowerShell, desde `frontend`:

```powershell
$env:VITE_LOCAL_ANONYMOUS_READ = 'true'
$env:VITE_ASSISTANCE_DEMO = 'true'
npm run dev -- --host 127.0.0.1
```

Para cerrar el laboratorio, escribir `quit`. La prueba automatizada empleó el puerto 15000 y un proxy Vite local ajustado únicamente en el proceso de prueba. Una base nueva permite reproducir perfiles sin arrastrar avisos. La credencial temporal se creó en el laboratorio y no se detectó en el bundle. Flask rechazó la ingesta sin credencial con 401.

## Verificación

- TypeScript y build correctos. Pasaron 26 pruebas de API, Asistencia, J03/J04, PWA y guías. El selector comprueba A–F, precedencia, incertidumbre, fuentes y ausencia de inferencia clínica a partir de la telemetría.
- Edge con Playwright verificó 1440×900, 1366×768, 1024×900, 768×900, 375×900 y 320×900. Las pruebas cubrieron avance, retroceso, reapertura, Escape y restauración de foco. El flujo de preguntas, resultado y modal con las fuentes plegadas no presentó desplazamiento vertical a 1440×900 ni 1366×768. En móvil se permite desplazamiento.
- Se verificó en Edge el recorrido con Flask y SQLite temporales, la lista de cinco astronautas, el acceso a sus alertas y el fallo de sensor en Monitoreo. Se comprobó el acceso desde una alerta, las guías A, B, C y F con perfiles del laboratorio, el reinicio sin respuestas previas y la separación de sesiones al alternar perfiles. El navegador hizo 46 GET sin enviar API Keys. [Evidencia del laboratorio](evidence/L15-C/laboratorio.json) En el bundle JS de producción no aparecieron el cuestionario ni el modal documental. La habilitación exige desarrollo, opt-in y loopback.
- `git diff --check` correcto. Vite emite un aviso previo sobre la futura resolución nativa de la configuración PWA.
- Evidencia visual: [Tripulación](evidence/L15-C/tripulacion.webp) · [Cardiovascular](evidence/L15-C/alertas-astro-02.webp) · [SpO₂](evidence/L15-C/alertas-astro-03.webp) · [Radiación](evidence/L15-C/alertas-astro-04.webp) · [Fallo de sensor](evidence/L15-C/calidad-astro-05.webp) · [Datos insuficientes](evidence/L15-C/informacion-insuficiente-320.webp).
- Modal: [Recorrido con Flask a 1366×768](evidence/L15-C/asistencia-astro-02.webp) · [Segundo paso](evidence/L15-C/guia-paso-2.webp) · [1440×900](evidence/L15-C/guia-1440.webp) · [375 px](evidence/L15-C/guia-375.webp) · [320 px](evidence/L15-C/guia-320.webp).

## Guion de cinco minutos

| Tiempo | Acción |
| --- | --- |
| 0:00–0:45 | Declarar la simulación y mostrar los cinco nombres sintéticos en Tripulación. Abrir astro-01 como referencia. |
| 0:45–1:45 | Seleccionar astro-02. Mostrar Monitoreo y luego la alerta de frecuencia cardíaca emitida por Flask. |
| 1:45–2:45 | Abrir Asistencia desde la alerta. Declarar como observaciones ficticias la falta de respuesta y la respiración anormal. Marcar los datos de entorno como indeterminados. |
| 2:45–4:00 | Completar el cuestionario, recorrer la guía A y cerrar para leer el resultado. Mostrar la separación entre alerta y observaciones y el estado de revisión médica. |
| 4:00–5:00 | Cambiar a astro-05, mostrar el fallo de calidad e iniciar una evaluación independiente con observaciones indeterminadas. |

El líder debe revisar la demo y la responsable médica debe aprobar cualquier futura incorporación clínica. La procedencia sintética describe el laboratorio completo. El contrato actual de Flask mantiene sin confirmar la procedencia individual de los avisos.
