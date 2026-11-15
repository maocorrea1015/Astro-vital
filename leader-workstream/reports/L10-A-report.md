# L10-A · Pantalla de Inicio definitiva

**Rama** `feature/frontend-home` · **Base** `b73676d` · **Estado** verificado localmente, pendiente de revisión del líder.

Se revisaron las instrucciones del repositorio, la propuesta definitiva, las guías de integración y los informes L08-I, L09-A y J03/J04. Inicio presenta el propósito de Astro-vital en misiones espaciales prolongadas e identifica la telemetría de demostración como simulada.

## Funcionalidad y alcance

- Inicio enlaza a Tripulación, Monitoreo, Alertas y Asistencia mediante las rutas hash y los nombres de la navegación existente. El foco se traslada al encabezado al entrar y al regresar.
- En escritorio, la bienvenida ocupa el ancho del contenido y los cuatro accesos forman una fila. En móvil, los accesos se apilan y la navegación conserva áreas de activación de al menos 44 px de alto.
- La bienvenida usa contenido estático y puede abrirse sin consultar la API. La imagen es decorativa y se sirve desde el mismo origen. La recarga offline conserva el texto, la navegación y el fondo de respaldo con el Service Worker existente.
- La fotografía orbital `ISS072-E-807123` se convirtió a WebP (59 kB). [Crédito NASA/JSC · City Lights Glow Along Moonlit Waters](https://eol.jsc.nasa.gov/Collections/EarthObservatory/articles/CityLightsGlowAlongMoonlitWaters.htm).

## Archivos

| Archivo | Cambio |
| --- | --- |
| [HomePage.tsx](../../frontend/src/app/HomePage.tsx) | Bienvenida y accesos a los cuatro módulos en React y Material UI. |
| [App.tsx](../../frontend/src/app/App.tsx) | Montaje de Inicio en `#/`. |
| [AppShell.tsx](../../frontend/src/app/AppShell.tsx) | Disposición de Inicio y encabezado con el mismo identificador y comportamiento de foco que las demás rutas. |
| [home-orbit.webp](../../frontend/src/assets/home-orbit.webp) | Fotografía orbital optimizada. |
| [PROGRESS.md](../PROGRESS.md) | Registro de avance L10-A y enlace a este informe. |

## Pruebas

| Verificación | Resultado |
| --- | --- |
| `npm run check`, `npm run build` y `git diff --check` | Pasaron. |
| Pruebas de API, PWA, asistencia y J03/J04 | 18 aprobadas. API 11, PWA 3, asistencia 2 y J03/J04 2. |
| Edge con el build de producción | A 1440, 375 y 320 px se verificaron la carga de la fotografía, los cuatro enlaces, la activación por teclado, el foco al navegar y regresar, y la ausencia de desbordamiento horizontal y solicitudes API desde Inicio. |
| Edge offline a 375 px | El Service Worker sirvió la recarga y se conservaron la bienvenida y los accesos. La fotografía decorativa queda fuera del inventario del Service Worker existente. |
| Regresión existente J03/J04 en Edge | Pasó a 1440, 375 y 320 px con respuestas sintéticas. Incluyó Tripulación, Detalle, Monitoreo, Asistencia y Alertas. |

## Evidencia visual

Capturas completas de Inicio desde el build de producción en Edge.

- [Escritorio · 1440 px](evidence/L10-A/inicio-1440.webp)
- [Móvil · 375 px](evidence/L10-A/inicio-375.webp)
- [Móvil · 320 px](evidence/L10-A/inicio-320.webp)

Se comprobó el diff y las rutas protegidas. El cambio queda en el árbol de trabajo para revisión humana.
