# L10-B · Validación integral y guion de demostración

**Rama** `feature/frontend-demo-validation` · **Base** `b73676d` · **Candidato con Inicio L10-A** `79c632d` · **Estado** laboratorio verificado, pendiente de revisión del líder.

El árbol inicial estaba limpio. Se ejecutaron las pruebas técnicas en la rama activa y se compiló el candidato L10-A desde una exportación temporal. Las pruebas integrales en Edge usaron esa exportación. La portada de L10-A sigue en `feature/frontend-home` y no está incorporada a la rama activa. Para el ensayo se usó el simulador Python de ESP32, con datos exclusivamente sintéticos.

## Laboratorio y seguridad

- Flask y Vite escucharon solo en loopback. Flask respondió en `127.0.0.1:5000`. Antes de sembrar la autorización del simulador y enviar lotes se comprobó la ruta efectiva de `l10b.sqlite`, creada dentro de un directorio temporal fuera del repositorio. El laboratorio copió código Python y SQL sin reutilizar la base ni el archivo de entorno del repositorio.
- La ingesta sin credencial devolvió **401**. El simulador usó una credencial efímera exclusiva del laboratorio. El arnés conserva el valor en memoria, registra únicamente su hash en SQLite temporal y suprime la salida del simulador que podría incluir un fragmento. La inspección de seis archivos JS/HTML de ambos builds no encontró la credencial efímera.
- La lectura local se habilitó con `VITE_LOCAL_ANONYMOUS_READ=true` y el proxy de desarrollo de L08-I. El navegador emitió **65 GET, cero POST**, con cero cabeceras `X-API-Key` y cero cookies en las solicitudes API observadas. Solo consultó catálogo, detalle y lecturas.
- Flask mantuvo la lectura anónima de producción deshabilitada. Aun con el interruptor en el entorno de preview, `/api/health` sirvió HTML y Tripulación indicó «API no configurada». El reconocimiento de alertas carece de acción disponible. Asistencia mantuvo el aviso de validación médica pendiente. Los validadores y adaptadores existentes procesaron las respuestas reales de Flask.

## Escenarios verificados

| Escenario | Evidencia |
| --- | --- |
| A · Normal | `normal`, dos lotes de cinco muestras para `astro-01`. Ambos POST del simulador devolvieron 200, sin duplicados ni inválidos. SQLite contenía diez lecturas. Se observaron diez evaluaciones de la regla y cero alertas. Catálogo, detalle e histórico visibles. La tabla de frecuencia cardíaca mostró 72,4 y 72,2 bpm, calidad nominal y hora UTC. |
| B · Anomalía | `tachycardia`, un lote de cinco muestras con HTTP 200. SQLite llegó a 15 lecturas. Se observaron cinco evaluaciones de reglas, una devolvió severidad crítica y el resultado de ingesta indicó una alerta generada. El histórico y el estado devolvieron HTTP 200. Monitoreo mostró 141,5 bpm con calidad nominal y Alertas presentó la alerta activa al elegir `astro-01` y filtrar por **Críticas**. |
| C · Resiliencia | Antes del primer lote, Monitoreo mostró histórico vacío para el astronauta de demo que siembra el esquema. `sensor_fault` agregó cinco lecturas, conservó el cero y la calidad de fallo, y el backend omitió las evaluaciones de reglas del lote. La anomalía anterior permaneció en el histórico y como alerta activa. Al detener Flask, Inicio siguió disponible y Tripulación mostró error con reintento. El proxy respondió 502 y el reintento recuperó el catálogo tras arrancar Flask sobre la misma base. |
| C · PWA | En preview, el Service Worker sirvió la recarga offline a 375 px. Se comprobaron seis recursos estáticos en caché, sin rutas API. La navegación y el contenido de Inicio siguieron disponibles. La telemetría necesita conexión. |

### Trazabilidad de la alerta del escenario B

| Tramo | Evidencia |
| --- | --- |
| Simulador | `astro-01`, `heart_rate`, **141,5**, calidad `ok`, marca UNIX **1794732821**. |
| SQLite y REST | 15 lecturas acumuladas. El histórico devolvió la lectura **11** con el mismo valor, tiempo y calidad. |
| Evaluación y generación | La función de reglas existente devolvió `critical` en una de las cinco evaluaciones. El POST devolvió `alertas_generadas: 1`. |
| Estado del astronauta | La consulta de `astro-01` devolvió la alerta activa **1**, severidad `critical`, variable, valor y marca temporal coincidentes. |
| React | La serie y la tabla mostraron la variación. La tarjeta **1** apareció bajo **Críticas**, con **15/11/2026, 8:53 a. m. UTC** y el aviso neutral de contenido pendiente. La interfaz muestra el tiempo con precisión de minuto. |

La procedencia sintética se identifica en Inicio y debe anunciarse durante el recorrido. Las respuestas REST carecen de un campo de procedencia y los módulos muestran esa limitación. El perfil del simulador y la severidad reportada describen el escenario de prueba. Los textos y guías clínicos de Flask quedan fuera de la interfaz.

## Pruebas, hallazgos y límites

- `npm run check`, `npm run build` y `git diff --check` pasaron. Pasaron **18 pruebas automatizadas** de API, PWA, asistencia y J03/J04. El candidato temporal pasó TypeScript y build.
- Edge a **1440, 375 y 320 px** recorrió Inicio, Tripulación, Detalle, Monitoreo, Alertas y Asistencia sin desbordamiento horizontal en las vistas comprobadas. La comprobación offline se repitió a 375 px.
- Se corrigieron dos supuestos del arnés. El esquema siembra `astro-01`, por lo que el vacío inicial se verifica en histórico. Las pruebas de navegación esperan el encabezado de destino antes de operar el selector. No hubo cambios en código de producto.
- Queda pendiente incorporar L10-A a la revisión acordada para la demo, verificar el equipo de presentación y acordar con Mauricio el acceso protegido para entornos compartidos. No se verificó un ESP32 físico, la instalación en un dispositivo físico ni el perfil de calidad degradada. El perfil `sensor_fault` sí se verificó de extremo a extremo.
- Los perfiles admitidos se revisaron en el simulador. Su CLI puede mostrar un fragmento de credencial y recurrir a un mecanismo de aprovisionamiento fuera del laboratorio si se llama sin clave. Se usó el arnés aislado. Mauricio debe revisar el CLI antes de operarlo fuera del ensayo.
- [Evidencia estructurada del ensayo](evidence/L10-B/resultado.json) · [Arnés local reproducible](evidence/L10-B/laboratorio.py).

## Preparación en PowerShell

Desde la raíz del repositorio. Los comandos exportan el candidato verificado fuera del árbol de trabajo. Si la revisión acordada ya incorpora L10-A, puede usarse su frontend directamente.

```powershell
$astroRepo = (Get-Location).Path
$astroDemo = Join-Path ([IO.Path]::GetTempPath()) ('astro-l10b-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $astroDemo | Out-Null
git archive --format=zip --output="$astroDemo\home.zip" 79c632d frontend
Expand-Archive -LiteralPath "$astroDemo\home.zip" -DestinationPath $astroDemo
python -m venv "$astroDemo\venv"
& "$astroDemo\venv\Scripts\python.exe" -m pip install Flask==3.1.3 flask-cors python-dotenv requests
& "$astroDemo\venv\Scripts\python.exe" "$astroRepo\leader-workstream\reports\evidence\L10-B\laboratorio.py" "$astroRepo"
```

Espera `ready: true`, `health: 200` y `post_sin_clave: 401` antes de enviar lotes. Escribe `normal` para enviar dos. En otra consola:

```powershell
Set-Location -LiteralPath '<directorio temporal exportado>\frontend'
npm ci
$env:VITE_LOCAL_ANONYMOUS_READ = 'true'
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Abre `http://127.0.0.1:5173/#/`. Para reproducir el escenario B, escribe `tachycardia` en el arnés y vuelve a consultar el histórico y Alertas. Para probar recuperación, escribe `stop`, reproduce el error y escribe `start` antes de pulsar **Reintentar**. `quit` detiene Flask y limpia su SQLite temporal. Al cerrar Vite, ejecuta `Remove-Item Env:VITE_LOCAL_ANONYMOUS_READ`.

## Guion de 5 minutos

| Tiempo | Acción |
| --- | --- |
| 0:00–0:30 | Abrir Inicio. Explicar el propósito y anunciar que toda la telemetría de la sesión es sintética. |
| 0:30–1:15 | Abrir Tripulación y seleccionar **Astronauta Demo**. Mostrar la conexión reportada tras enviar `normal`. Si transcurrió el tiempo de conexión, refrescar con un lote normal antes de presentar. |
| 1:15–2:30 | Mostrar las mediciones actuales en Detalle. En Monitoreo, elegir `astro-01`, abrir la gráfica de frecuencia cardíaca y cambiar a Tabla. Enviar `tachycardia`, recargar y mostrar la variación y la calidad reportada. |
| 2:30–3:45 | Si la ingesta informa una alerta generada, abrir Alertas, seleccionar `astro-01` y filtrar por **Críticas**. Mostrar severidad y hora. Si el resultado no es verificable, mostrar el estado disponible y omitir la demostración de la alerta. |
| 3:45–4:30 | Abrir Asistencia, confirmar el astronauta y mostrar el aviso de cuestionario pendiente de validación médica. |
| 4:30–5:00 | Cerrar con el recorrido simulador → Flask → SQLite → REST → React y las limitaciones de procedencia, acceso compartido y contenido médico. |

### Checklist del día de presentación

- [ ] Confirmar la revisión que reúne L10-A y los módulos integrados.
- [ ] Confirmar puertos libres, SQLite temporal, `health: 200` y rechazo de ingesta sin clave.
- [ ] Preparar lotes normales y comprobar catálogo, histórico y etiqueta de demo.
- [ ] Preparar el escenario anómalo y confirmar alerta por REST y en React antes de presentarla.
- [ ] Confirmar que la pestaña Red registra solo GET de datos y carece de `X-API-Key`.
- [ ] Ensayar recuperación y contingencia offline con el equipo final.
