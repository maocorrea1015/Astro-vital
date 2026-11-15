# L08 · Ensayo y preparación de la demostración

**Rama:** `feature/frontend-demo`. **HEAD inicial:** `2c84061`. **Fecha:** 15 de noviembre de 2026. **Dictamen:** recorrido local verificado con respuestas sintéticas rotuladas y PWA de producción verificada en loopback, incluida la apertura standalone. La demostración integral con Flask sigue pendiente.

## Línea base y acceso

El árbol inicial estaba limpio y contenía L01–L07. Se revisaron las instrucciones, arquitectura, alcance, integración, política médica, ficha L08 e informes L04-B a L07. La aplicación estándar crea el cliente L03 sin prefijo protegido. En Tripulación y Monitoreo aparece «API no configurada» y las operaciones se detienen antes de usar la red. La inspección del código y el escaneo de patrones del frontend y el build no detectaron claves privadas.

La [referencia de API](../../Backend/docs/API.md) y el código de Flask coinciden en las operaciones pertinentes. Health es público. Listado, detalle e histórico son lecturas protegidas. `POST /api/readings` pertenece al emisor. Flask también tiene rutas de alertas, reconocimiento y notas, que quedan fuera del recorrido demostrado.

| Operación comprobada en código | Uso en esta etapa |
| --- | --- |
| `GET /api/health` | Existencia comprobada. Las pruebas red/offline usaron un sustituto local para verificar la exclusión de caché. |
| `GET /api/astronauts` | Composición y validación con respuesta sintética. |
| `GET /api/astronauts/{id}/status` | Detalle con identidad, estado reportado, conexión, contacto y lecturas sintéticas. |
| `GET /api/astronauts/{id}/readings` | Histórico sintético y validación por ID. El contrato predeterminado usa 24 h y hasta 100 registros. |

No se encontró un mecanismo de acceso de mismo origen autorizado para activar desde el frontend. No se consultó Flask ni se simuló una conexión real.

## Recorridos y resultados

| Recorrido | Resultado y evidencia |
| --- | --- |
| Tripulación | En Edge, con «Datos sintéticos · ensayo local» visible, Inicio → Tripulación → selección por teclado → detalle → retorno. Se comprobaron identidad, estado reportado, conexión, contacto, valor, unidad disponible, hora, calidad, recarga y respuesta tardía descartada. |
| Monitoreo | Selección, histórico, recarga con ID conservado, cambio de astronauta y cancelación. Se comprobó que cero se conserve, una cifra pequeña distinta de cero siga visible y se distinga calidad degradada y fallo de sensor. Una unidad desconocida se indica como tal. |
| Fallo y recuperación | En el ensayo, HTTP 500 seguido de reintento y recuperación, JSON inválido, contrato inválido y listas vacías. El corte de red ocultó el dato sintético anterior, estabilizó el foco y al reconectar se obtuvieron datos por una nueva consulta. No se simuló un fallo real del emisor. |
| PWA de producción | Servida en loopback. Se comprobaron manifiesto, tamaños de iconos, scope, registro, seis recursos estáticos y recarga sin red servida por el worker. JSON sintético bajo API y bajo un prefijo protegido quedó fuera de caché y falló offline. Una segunda revisión sintética esperó al cierre, mantuvo la página y eliminó la caché anterior al activarse. |
| Instalación y apertura | Edge informó cero errores de instalabilidad en perfil temporal normal. El primer lanzamiento automatizado abrió en modo navegador. Al seleccionar explícitamente el modo de apertura standalone en ese perfil, se lanzó la PWA instalada con DevTools, se comprobó `display-mode: standalone` y se navegó por Tripulación y Monitoreo hasta `#/monitoreo`. Se desinstaló la copia temporal. No se usó un icono del sistema operativo ni el equipo final de demo. |
| Alertas | La ruta muestra «Integración pendiente». La tarjeta aislada representó severidades y estado de acuse ficticios en el ensayo de componentes. El flujo estándar no presenta alertas conectadas ni acciones clínicas, guías o reconocimiento real. |

**Resoluciones:** 1440, 768, 375 y 320 px. Se comprobaron foco, teclado, selección, reintento, cancelación, navegación y recarga. No hubo desbordamiento horizontal ni errores de consola en los recorridos finales. El navegador no realizó solicitudes de datos reales durante el ensayo de UI. El servidor local de la prueba PWA sirvió únicamente las respuestas sintéticas de verificación; sus datos no se incorporaron al producto.

**Comandos ejecutados desde `frontend/`:** `npm run check`, `npm run build`, `npm run test:api` (10 pruebas) y `node --test tests/pwa.test.mjs` (3 pruebas después del build). Todos pasaron. `git diff --check` y la comprobación de espacios del informe nuevo también pasaron. Lint sin script configurado. La variante sintética de navegador usó el Playwright del entorno y Vite sin instalar dependencias. El aviso del cargador nativo futuro de Vite en ese ensayo no se reprodujo como error del build ni de consola.

## Guion para la persona que presenta

1. **Preparación.** Desde `frontend/`, ejecuta `npm run build` y `npm run preview -- --host 127.0.0.1 --strictPort`. Usa la URL que muestre el comando en una ventana normal de Edge. Deja que el worker tome control antes del ensayo offline.
2. **Si el acceso real ya fue acordado y verificado.** Usa el entorno autorizado y confirma una muestra de referencia con Mauricio y simulación. Recorre Inicio → Tripulación → astronauta → detalle → Monitoreo. Compara el mismo ID, hora de muestra, valor, unidad, calidad y procedencia autorizada en emisor, API y pantalla. El contacto del nodo tiene su propio timestamp. Registra resultado y revisión sin datos personales ni credenciales. Si faltan esas evidencias, usa la contingencia.
3. **Contingencia inmediata.** En la URL estándar, muestra «API no configurada». Explica que la composición existe y el acceso autenticado está pendiente. Desde el navegador, emula offline tras la primera carga válida y recarga Tripulación. Navega a Monitoreo, constata que los datos permanecen ocultos y reconecta. Para ilustrar el catálogo y las mediciones, usa el ensayo rotulado del apéndice. Mantén visible la etiqueta y anuncia la procedencia sintética. Si falla, conserva la demo del shell y omite el segmento de datos.
4. **PWA.** Si el navegador ofrece instalación, abre la app instalada en modo ventana y recorre las dos secciones. La URL estándar es la alternativa para el navegador sin instalación. Explica que el modo offline conserva navegación y recursos estáticos, y que las consultas de datos requieren acceso disponible.
5. **Cierre.** Si se muestra Alertas, indica su estado pendiente. Expón la diferencia entre conectividad del navegador, disponibilidad de Flask y contacto del nodo. Evita describir calidad, antigüedad o estado reportado como diagnósticos.

## Dependencias y criterio de cierre integral

- **Mauricio y líder:** acordar revisión desplegada, acceso autenticado del mismo origen y configuración autorizada. Verificar listado, detalle e histórico desde el navegador sin poner claves en el frontend. Acordar procedencia, unidad de actividad y criterio de frescura.
- **Simulación:** proveer emisor y una lectura consentida y trazable, con reloj y marcas acordadas. Ensayar interrupción de emisor y de API por separado en el entorno autorizado.
- **Equipo de presentación:** confirmar equipo, navegador y origen de demo. Si se va a lanzar desde un icono del sistema, comprobar ese acceso en el equipo final. La apertura standalone local está verificada.
- **Alcance:** el flujo sensor o simulador → Flask → API → React queda sin validar hasta completar la prueba real. L09 no se inició.

## Apéndice · Ensayo sintético reproducible

En PowerShell 7, desde `frontend/`, ejecuta el bloque. Levanta Vite solo en loopback e inyecta la entrada en memoria. Abre la URL impresa con `?fixture=ok#/tripulacion`. Para repetir el fallo y reintento usa `?fixture=retry#/tripulacion`, y para catálogo vacío usa `?fixture=empty#/tripulacion`. Se verificó el arranque de este bloque y la aparición del catálogo con su etiqueta. Detén el servidor con Ctrl+C. Usa el preview de producción para probar la PWA.

~~~powershell
@'
import {createServer} from 'vite';
const fixture = "import {createRoot} from 'react-dom/client';\nimport {ThemeProvider} from '@mui/material/styles';\nimport CssBaseline from '@mui/material/CssBaseline';\nimport {App} from './app/App';\nimport {theme} from './app/theme';\nimport {createAstronautApi} from './services/api/astronauts';\nimport {AlertCard} from './features/alerts/components';\nconst mode=new URLSearchParams(location.search).get('fixture');\nconst row=(id,nombre,estado_conexion)=>({astronaut_id:id,nombre,estado_general:'normal',estado_conexion,ultimo_contacto:1712345700});\nconst crew=[row('astro-01','Prueba A '+ 'EtiquetaSinEspacios'.repeat(12),'offline'),row('astro-02','Prueba B','online')];\nconst measurements=[{variable:'temperature',valor:0.00004,ts:1712345678,calidad:'degraded'},{variable:'radiation_cpm',valor:0,ts:1712345678,calidad:'sensor_fault'},{variable:'activity',valor:0,ts:1712345678,calidad:'ok'}];\nlet tries=0;\nconst api=createAstronautApi({protectedPathPrefix:'/fixture',fetchImpl:async(url,init)=>{\n const p=new URL(String(url),location.origin).pathname;\n if(p.endsWith('/astronauts')){\n   await new Promise(r=>setTimeout(r,150));\n   if(mode==='retry'&&++tries===1)return new Response(null,{status:500});\n   if(mode==='invalid-json')return new Response('<html>');\n   if(mode==='invalid-contract')return Response.json({});\n   return Response.json(mode==='empty'?[]:crew);\n }\n const first=p.includes('/astro-01/');\n if(first){init.signal.addEventListener('abort',()=>{window.fixtureAborted=true},{once:true});await new Promise(r=>setTimeout(r,550));}\n const lecturas=first?[]:measurements;\n return Response.json(p.endsWith('/readings')?lecturas.map((item,i)=>({...item,astronaut_id:'astro-02',id:i+1})):{...crew[first?0:1],lecturas,alertas_activas:[],linea_base:[],guia_actual:null});\n}});\nconst app=mode==='alertas'?<main><h2>Avisos sintéticos</h2>{['info','warning','critical','unknown'].map((severity,i)=><AlertCard key={severity} id={i+1} severity={severity} message={'Aviso sintético '+i} acknowledged={i===0?true:i===1?false:undefined} timeFormatted=\"5 abr 2024 UTC\" isSimulated/>)}</main>:<App crewApi={mode?api:undefined}/>;\ncreateRoot(document.getElementById('root')).render(<ThemeProvider theme={theme}><CssBaseline/>{mode && <p role=\"note\">Datos sintéticos · ensayo local</p>}{app}</ThemeProvider>);\n";
const server = await createServer({
  server: {host:'127.0.0.1',port:0},
  plugins: [{
    name:'l08-demo-fixture',
    enforce:'pre',
    transform(_code,id){if(id.replaceAll('\\','/').endsWith('/src/main.tsx'))return fixture;}
  }]
});
await server.listen();
console.log('Ensayo local con datos sintéticos: http://127.0.0.1:' + server.httpServer.address().port + '/?fixture=ok#/tripulacion');
'@ | node --input-type=module -
~~~

## Alcance del diff

Se modificaron únicamente este informe y `PROGRESS.md`. Los hashes de los archivos existentes fuera de esas rutas coincidieron. `Backend/`, `junior-workstream/`, componentes, dependencias y configuración se conservaron. No se hicieron commits, push, merges ni despliegues.
