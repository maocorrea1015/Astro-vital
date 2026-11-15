# L16 · Asistencia demostrativa en un despliegue protegido

## Diagnóstico

Rama `feature/medical-mvp-final`, base `b7b41c1`, árbol limpio al comenzar. El repositorio documenta Flask, `python app.py`, SQLite y la autenticación `X-API-Key`. El frontend declara Vite y `npm run build`. No se encontró configuración versionada del proveedor, enlace publicado, comando remoto, terminación TLS, origen upstream ni política de acceso del sitio. La guía describe los comandos del artefacto probado. Para aplicarlos al sitio existente, el administrador debe confirmar esos datos y si el servicio acepta Node o dispone de un proxy que pueda enrutar todo el origen protegido.

L15-C comprobaba `import.meta.env.DEV` para habilitar el modo y para incluir los imports dinámicos de Asistencia y Alertas. El build ordinario eliminaba el cuestionario, la interpretación y las guías. Una actualización de caché por sí sola no cambia ese resultado.

## Cambios

- `frontend/package.json`, `.gitignore`: comandos y salida de la compilación demostrativa, separada de `dist`.
- `frontend/deploy/demo-server.mjs`: sirve todo el origen demostrativo detrás de HTTP Basic. Protege HTML, JS, imágenes, manifest, worker, verificación de autorización y lecturas. El navegador autentica al usuario `jurado` con una contraseña que administra el servidor. El servidor usa una segunda credencial para enviar a Flask únicamente GET de catálogo, estado e histórico. La respuesta de autorización `/demo/session` no contiene credenciales. La clave de Flask queda fuera del navegador. El servicio rechaza operaciones de escritura y no ofrece rutas de inicialización.
- `main.tsx`, `observationEnvironment.ts`, `App.tsx`, `AssistancePage.tsx`, `AlertsPage.tsx` y `AppShell.tsx`: el build demostrativo comprueba autorización antes de montar la aplicación. Usa API del mismo origen y conserva el hash y el ID de la alerta. Muestra la etiqueta sintética. L15-C local mantiene su opt-in en loopback. El build operativo conserva el catálogo pendiente y excluye los módulos documentales.
- `pwaPlugin.ts` y `demo-worker.js`: la demo conserva manifest e instalación donde el navegador lo permita, con navegación dependiente de la red. Su servidor marca todo como `private, no-store` y el worker de demo limpia solo el caché del shell de Astro-vital de su propio ámbito al activarse. El worker operativo sigue versionando y sirviendo el shell sin conexión.
- `tests/deployed-demo.browser.mjs`: verificación HTTP y Edge del artefacto productivo protegido con API Flask. Las preguntas, las seis guías y su estado médico se conservan tal como estaban en L15-C.

## Publicación para el administrador

1. Confirma quién administra el dominio, el proveedor y el comando de inicio real. Conserva la configuración y el artefacto operativos para revertir. En el entorno de demostración, confirma un Flask con SQLite **exclusivamente sintética** y credenciales válidas. Mantén separados los datos operativos. Si ya existe un control de acceso de plataforma, puede proteger el origen además del servidor probado. Servir `dist-demo` como carpeta estática pública expondría el material empaquetado.
2. En el servicio frontend, desde `frontend/` y con Node de la versión indicada en `package.json`, ejecuta `npm ci` y `npm run build:demo`. Para el modo operativo usa `npm run build` y conserva el mecanismo de publicación vigente.
3. Define estas variables **en el servicio de ejecución**, mediante el gestor de secretos del proveedor cuando corresponda.

   | Variable | Uso |
   | --- | --- |
   | `ASTRO_DEMO_PASSWORD` | Secreto del jurado, aleatorio, al menos 24 caracteres ASCII visibles. Usuario fijo `jurado`. Revoca el acceso compartido cambiando este secreto y reiniciando el servicio. |
   | `ASTRO_DEMO_FLASK_API_KEY` | Secreto de servidor distinto del anterior. Clave de Flask emitida para el entorno sintético. |
   | `ASTRO_DEMO_FLASK_URL` | Origen de Flask, sin ruta, credenciales ni query. Admite HTTPS y HTTP en loopback. |
   | `HOST` | Dirección de escucha del gateway. Predeterminada `127.0.0.1`. Ajusta solo si el proxy HTTPS de la plataforma requiere alcanzar el proceso por una red privada. |
   | `PORT` | Puerto que asigna el proveedor, o `8080` si se omite. |

4. Arranca el frontend con `npm run start:demo`. Configura el dominio actual para que HTTPS termine en la infraestructura de confianza y **todas** las rutas del origen de demo lleguen al gateway, incluidos `/assets/`, `/sw.js` y `/demo/`. Conserva `Authorization` hasta Node y evita que el proxy o CDN lo registre, cachee respuestas o sirva archivos fuera del gateway. Mantén el Flask accesible a través del canal administrativo previsto y sus lecturas anónimas desactivadas. El arranque Flask documentado desde `Backend/` es `python app.py`; conserva el comando WSGI real si ya existe. El gateway no requiere cambiar Flask ni sus contratos.
5. Mauricio debe preparar cinco IDs en la base sintética acordada. Puede reutilizar el [procedimiento de emisión de claves](../../Backend/docs/DEPLOYMENT.md) y ejecutar el simulador original contra el **origen administrativo Flask**, con su credencial de ingesta suministrada por el gestor de secretos como `ASTRA_API_KEY`. Para cada fila, ejecutar desde la raíz `python script/simulator.py --host <ORIGEN_FLASK_DEMO> --astronaut-id <ID> --mode <MODO> --interval 2 --count 2`. El portal del jurado carece de rutas de ingesta.

   | ID | Modo | Comprobación |
   | --- | --- | --- |
   | astro-01 | normal | Lecturas nominales |
   | astro-02 | tachycardia | Aviso de frecuencia cardíaca |
   | astro-03 | hypoxia | Aviso de SpO₂ |
   | astro-04 | radiation | Aviso de radiación en CPM |
   | astro-05 | sensor_fault | Fallo de calidad del sensor |

6. En un perfil nuevo del navegador de **otro dispositivo**, abre el enlace HTTPS. Verifica que rechace el acceso sin credenciales a la portada, `/demo/session`, `/demo/api/astronauts` y un chunk. Entra como `jurado`, verifica cinco perfiles y recorre Alertas → astro-02 → Iniciar asistencia → A-01 → Resultado → guía. Comprueba que la pestaña de red identifica el JS de `ObservationWorkspace`, la consulta de sesión autorizada y las lecturas sin `X-API-Key` desde el navegador. Las observaciones del cuestionario también se deben declarar como ficticias.
7. Para un navegador que ya tenga instalada la PWA en ese origen, cierra todas sus ventanas cuando se ofrezca la actualización, vuelve a abrir y confirma que el worker activo sea el de demo y que Cache Storage ya no contenga `astro-vital-shell:` para ese ámbito. Si una instalación sigue usando el artefacto anterior, confirma primero el build servido en un perfil nuevo. Si es necesario, desvincula el worker obsoleto desde las herramientas del navegador y recarga. El acceso al shell operativo anterior no otorga acceso a `/demo/session` ni a los chunks demostrativos.
8. Para revertir, retira el enrutamiento al gateway y recupera la configuración y el artefacto operativos anteriores. Revoca las credenciales de la demo si se retira el acceso. Tras reactivar el worker operativo, verifica su caché e instalación con las ventanas antiguas cerradas. La base operativa permanece ajena a la preparación de perfiles.

## Evidencia

- TypeScript, build operativo y build demostrativo correctos. **26 pruebas automatizadas** de API, Asistencia, J03/J04, PWA y observación.
- Edge probó el servidor Node de demo y una instancia temporal del Flask del repositorio con configuración de producción, SQLite sintética y cinco perfiles generados por el simulador. Flask rechazó GET y POST anónimos con 401. Node rechazó acceso anónimo a la sesión, los datos y un chunk incluso con el parámetro de demo, rechazó credenciales inválidas y denegó escrituras. El arranque sin secretos falló cerrado.
- La prueba con acceso autorizado recorrió una alerta real de Flask, el cuestionario A-01, su resultado y la apertura automática, avance, cierre y reapertura del modal. Confirmó solicitudes GET del navegador sin la clave Flask, ausencia de estos secretos en ambos bundles y ausencia de caché del shell demostrativo. En escritorio comprobó que las preguntas y el cuerpo del modal cabían sin desplazamiento vertical.
- El build operativo se verificó en un servidor local de estáticos mediante Vite preview, con el proxy de laboratorio desactivado. Un parámetro, localStorage, una variable de ventana y la recarga directa del hash no habilitaron A-01. Se comprobó navegación offline del shell. La prueba de demo utilizó el servidor Node preparado para publicación y no Vite Dev Server.
- Capturas: [1440×900](evidence/L16/guia-produccion-1440.png) · [1366×768](evidence/L16/guia-produccion-1366.png) · [375 px](evidence/L16/guia-produccion-375.png) · [320 px](evidence/L16/guia-produccion-320.png).

`git diff --check` correcto. Permanece el aviso previo de Vite sobre la futura resolución nativa de una importación sin extensión. Queda pendiente la comprobación del dominio remoto, sus reglas HTTPS y el acceso desde otro dispositivo con la configuración real. La contraseña es compartida y se debe administrar como acceso temporal del jurado. El contenido educativo sigue pendiente de revisión médica. No hubo cambios en Flask, en el simulador ni en el servicio publicado.
