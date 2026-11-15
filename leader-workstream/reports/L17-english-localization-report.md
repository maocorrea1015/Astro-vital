# L17 · English localization

## Alcance

Rama `feature/medical-mvp-final`. El árbol ya contenía cambios de L16 sin commit y se continuó sobre esa base. El idioma visible predeterminado es inglés estadounidense. Se mantuvo el nombre **Astro-vital**.

| Área | Cambios |
| --- | --- |
| Shell y navegación | `src/app/App.tsx`, `AppShell.tsx`, `navigation.tsx` y `src/main.tsx` traducen rótulos, estados, enlace de salto y navegación accesible. |
| Módulos de misión | `HomePage.tsx`, `CrewPage.tsx`, `AstronautPage.tsx`, `MissionFigure.tsx`, `MissionModules.tsx`, `TelemetryPanel.tsx`, `AlertsPage.tsx` y `telemetryPresentation.ts` localizan estados, variables, selección, tooltips, gráficos y alertas. |
| Asistencia | `AssistancePage.tsx`, `AssistanceQuestionnaire.tsx`, `ObservationWorkspace.tsx`, `ObservationDocument.tsx`, `observationContent.ts`, `observationInterpretation.ts` y `observationMode.ts` traducen A-01, opciones, correcciones, incertidumbre, fichas, advertencias y texto copiable. |
| Guías | `firstAidGuidance.ts` y `FirstAidGuidanceDialog.tsx` traducen A–F, los tres pasos de cada guía, evidencia, progreso, avisos y navegación. El icono de referencia terrestre usa un identificador estable en vez de buscar una palabra en la etiqueta. |
| Componentes compartidos | `src/features/crew/components/` y `src/features/alerts/components/` traducen etiquetas, estados vacíos, advertencias, tablas, leyendas y controles accesibles. |
| Metadatos y acceso | `index.html`, `public/manifest.webmanifest`, `src/pwa/PwaControls.tsx`, `pwaPlugin.ts`, `service-worker.js`, `src/services/api/` y `deploy/demo-server.mjs` traducen metadatos y mensajes de instalación, actualización, error y autorización. |
| Pruebas | Se actualizaron selectores visibles en las suites de Edge y las expectativas textuales de observación, alertas y PWA. `tests/english-localization.test.mjs` comprueba cada pregunta, opción, ficha y paso de guía, la etiqueta semántica de referencia terrestre y los metadatos de idioma. |

## Terminología y límites

Mission Control, Crew, Monitoring, Alerts y Medical Assistance son los nombres de navegación. Heart Rate, Oxygen Saturation (SpO₂), Body Temperature, Radiation, Latest Reading y Sensor Fault son los rótulos de telemetría. Los valores internos, las rutas hash, las reglas de selección y los contratos Flask se conservaron.

`<html lang="en">` y el manifiesto `en-US` describen la interfaz. Fechas, horas y decimales usan `en-US`. El histórico y la interfaz de asistencia conservan UTC, señalado también en la gráfica. Las unidades y los valores originales permanecen intactos. Los textos accesibles se tradujeron junto con su control.

Los campos `mensaje`, `guia` y `guia_actual` de Flask siguen fuera de la interfaz médica. La presentación compone etiquetas en inglés a partir de métricas, códigos y severidades existentes. Los nombres propios se muestran como llegaron de Flask. Solo se localizan las etiquetas conocidas `Astronauta Demo` y `Astronauta sintético NN`. Los documentos internos, los mensajes de diagnóstico para operadores y las rutas técnicas pueden conservar español.

La advertencia de revisión médica permanece visible. Las referencias AHA, NASA y otras conservan atribución y enlace. El catálogo operativo sigue pendiente de aprobación. Las referencias terrestres siguen identificadas y los límites de microgravedad permanecen explícitos. El modo demostrativo conserva la protección L16 y el contenido de investigación. No se requirieron cambios de diseño ni dependencias.

## Verificación

- `npm run check`, `npm run build` y `npm run build:demo` correctos.
- 28 pruebas automatizadas de API, Asistencia, J03/J04, PWA, observación y localización.
- Edge con el build productivo protegido, el gateway L16 y Flask con SQLite temporal y cinco perfiles del simulador. Recorrió Home → Crew → Monitoring → Alerts → Medical Assistance → A-01 → Result → Guidance a 1440×900, 1366×768, 375 px y 320 px. Se verificaron el contexto de la alerta, la apertura automática, navegación, cierre y reapertura. Se recorrieron las seis guías con respuestas sintéticas, incluidas las correcciones de observaciones complementarias para D y E.
- El gateway rechazó accesos anónimos y peticiones de escritura. La clave Flask permaneció fuera del navegador y de ambos bundles. La demo protegida no dejó un caché del shell. El build operativo mantuvo excluidos los módulos de observación.
- Las suites visuales locales cubrieron teclado, foco, errores, ausencia de datos, recarga, navegación, consulta de alertas, corrección de respuestas y pérdida de conexión. En escritorio se comprobó el tamaño del flujo de preguntas y del modal. Las capturas móviles muestran el desplazamiento natural permitido. A 1366×768 el cuestionario y el modal no necesitaron desplazamiento vertical. Mission Control, Monitoring y Alerts sí tuvieron desplazamiento vertical a ese tamaño.
- `git diff --check` correcto. Se conserva el aviso existente de Vite sobre la futura resolución nativa de una importación sin extensión. No se comprobó el servicio público remoto ni se desplegó.

## Capturas

[Mission Control](evidence/L17/panel-1440.png) · [Crew](evidence/L17/crew-1440.png) · [Monitoring](evidence/L17/monitoring-1440.png) · [Alerts](evidence/L17/alerts-1440.png) · [Pregunta A-01 a 1366×768](evidence/L17/pregunta-1366.png)

[Guía A a 1440×900](evidence/L17/guia-produccion-1440.png) · [1366×768](evidence/L17/guia-produccion-1366.png) · [375 px](evidence/L17/guia-produccion-375.png) · [320 px](evidence/L17/guia-produccion-320.png)

[Guía B](evidence/L17/guide-B-1440.png) · [Guía C](evidence/L17/guide-C-1440.png) · [Guía D](evidence/L17/guide-D-1440.png) · [Guía E](evidence/L17/guide-E-1440.png) · [Guía F](evidence/L17/guide-F-1440.png)
