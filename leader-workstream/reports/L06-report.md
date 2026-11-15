# L06 · PWA, instalación y funcionamiento offline

**Rama:** `feature/frontend-pwa`. **HEAD inicial:** `8a3a32c`. **Estado:** implementado y verificado localmente para shell, caché, actualización e instalación. Lanzamiento desde la ventana instalada y validación en el entorno de demo pendientes. Revisión humana pendiente.

## Base y cambios

El árbol inicial estaba limpio y contenía L01–L05, L04-A, L04-B y los componentes corregidos del junior. No había un Service Worker ni manifiesto previo. Monitoreo vive en `frontend/src/app/TelemetryPanel.tsx`; no se creó un directorio paralelo de funcionalidad.

| Rutas | Responsabilidad |
| --- | --- |
| `frontend/public/manifest.webmanifest` e `index.html` | Identidad, modo standalone, metadatos, tema y enlaces locales. |
| `frontend/public/icons/astro-vital-192.png`, `astro-vital-512.png` y `astro-vital-maskable-512.png` | Iconos originales, locales y de las dimensiones declaradas. |
| `frontend/src/pwa/pwaPlugin.ts` y `frontend/vite.config.ts` | Generan `sw.js` con inventario y revisión derivados del contenido del build. |
| `frontend/src/pwa/service-worker.js` | Precarga, lectura del shell, aislamiento por ámbito y limpieza de revisiones. |
| `frontend/src/pwa/PwaControls.tsx` | Registro en producción bajo contexto seguro, instalación nativa cuando el navegador la ofrece y aviso de actualización en espera. |
| `frontend/src/pwa/useBrowserOnline.ts` y `frontend/src/app/AppShell.tsx` | Señal del navegador, aviso accesible y suspensión de vistas que requieren datos durante la desconexión. |
| `frontend/tests/pwa.test.mjs` | Tres pruebas nativas del build y la estrategia de caché. |
| `leader-workstream/PROGRESS.md` y este informe | Seguimiento y evidencia. |

El manifiesto usa nombre corto y largo Astro-vital, `start_url: "./#/"`, `scope: "./"`, `display: "standalone"` y los colores del tema. La base pública de Vite gobierna los enlaces HTML y el ámbito efectivo del worker. Se verificó en raíz y con `--base=/astro-vital/`. No se añadieron dependencias o archivos de bloqueo.

## Caché y actualizaciones

El build incorpora una lista exacta de recursos. En el build verificado contiene seis entradas: `index.html`, el JavaScript versionado, el manifiesto y los tres PNG. Si el build emite CSS, se incorpora al inventario. La revisión cambia con el contenido, incluidos iconos, manifiesto y código del worker. La precarga solicita recursos sin credenciales y rechaza redirecciones, tipos inesperados y respuestas marcadas `private` o `no-store`. Solo se guarda el inventario durante la instalación. El manejo de solicitudes excluye métodos distintos de GET y cabeceras Authorization o X-API-Key, y se limita a navegaciones al shell y URLs estáticas incluidas en el inventario. Las rutas API, sus prefijos y los parámetros de consulta de archivos están fuera de la caché. La navegación del shell usa una clave fija sin parámetros ni fragmentos.

Las versiones activas sirven su propio shell. Una actualización queda esperando mientras haya ventanas controladas. El aviso indica cerrar las ventanas de Astro-vital y volver a abrir. Al activarse, la nueva versión elimina las cachés antiguas del mismo ámbito. El flujo carece de recargas forzadas, IndexedDB y sincronización de datos.

El botón de instalación solo aparece ante un evento nativo disponible. Se retira cuando se consume el evento o se instala la aplicación, y se suprime en standalone. El sitio mantiene navegación normal en navegadores o perfiles sin instalación.

## Conectividad y compatibilidad

El estado offline proviene de la señal del navegador. Durante ese estado el shell mantiene rutas hash y retira las vistas dependientes de datos, lo que cancela sus consultas. Al recuperar conexión, las vistas se montan con consultas nuevas. Un navegador en línea puede seguir mostrando API no configurada o un error de API. El estado del nodo y el contacto únicamente provienen de L03 y sus modelos. Se mantienen las rutas y estados de L04 y L05 y la integración J01/J02. Los contratos, servicios y credenciales no cambiaron.

## Pruebas y resultados reales

- `npm run check`, `npm run build` y `npm run test:api` pasaron antes y después; 10 pruebas de API.
- `node --test tests/pwa.test.mjs`, después del build, pasó 3 pruebas: manifiesto e iconos, límites de interceptación y rechazo de contenido privado.
- Edge en build de producción servido por loopback, a 1440, 375 y 320 px: ámbito, manifest y dimensiones PNG válidos; worker activo; foco visible y navegación por teclado; recarga offline servida por el worker; Tripulación y Monitoreo accesibles por hash; retorno a API no configurada al reconectar. Sin desbordamiento horizontal en el recorrido. Prueba adicional a 320 px con base `/astro-vital/`.
- Dos endpoints sintéticos de prueba, uno bajo `/api/` y otro bajo un prefijo de acceso, fueron accesibles en línea y fallaron sin red. La lista de entradas de caché permaneció igual. No se ejecutó una consulta real a Flask.
- Se entregó una segunda revisión sintética del worker sobre el build de producción. Confirmé espera, aviso, conservación de la página actual, activación tras el cierre y limpieza de la caché anterior. Los datos de prueba no se incorporaron a la aplicación.
- En perfil temporal normal, Edge reportó cero errores de instalabilidad y emitió el evento nativo. Se comprobó activación del botón mediante teclado. DevTools confirmó instalación y desinstalación en el perfil de prueba. El lanzador de la PWA no expuso una ventana al navegador automatizado headless, por lo que la navegación en una ventana instalada queda pendiente de prueba interactiva. En el perfil incógnito, Edge bloqueó instalación y el sitio funcionó sin el botón.
- Durante el ajuste se movió `alignItems` a `sx` por los tipos de MUI y se normalizó el fragmento antes de comprobar la navegación del worker. En la emulación de Edge, `navigator.onLine` llegó a volver a true al recargar; se verificó la recarga por separado con `fromServiceWorker()` y se reaplicó el estado offline para probar el aviso y el fallo de consultas.
- `git diff --check` y la comprobación de archivos nuevos pasaron. `Backend/`, `junior-workstream/`, componentes junior, contratos y lockfile quedaron intactos. No hubo commits, push, merges ni despliegues.

## Pendientes para revisión

Confirmar navegador, origen seguro, base y cabeceras del alojamiento de demo. Probar el lanzamiento interactivo desde el icono instalado y la navegación hash en esa ventana. El acceso autenticado y la prueba con telemetría real siguen dependiendo del acuerdo con Mauricio. El acceso directo por URL continúa disponible. L07 no se inició.

Referencias técnicas: [base pública de Vite](https://vite.dev/guide/build.html), [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) y [evento de instalación](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event).
