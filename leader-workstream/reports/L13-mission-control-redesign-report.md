# L13 · Mission Health Control Center

**Rama** `feature/frontend-mission-control-redesign` · **Base** `17e7338` · **Estado** recorrido operativo verificado en navegador y laboratorio. Pendiente de revisión del líder.

## Diagnóstico y nueva composición

Inicio presentaba el proyecto y servía como catálogo de enlaces. Consultar la tripulación, las lecturas, las alertas y Asistencia requería varias rutas. El nuevo Inicio reúne el recorrido operativo y conserva las rutas secundarias para revisar los datos con mayor detalle. El diseño incorpora el objetivo del reto de recopilar indicadores y facilitar su evaluación visual. [Reto oficial de NASA Space Apps](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)

En escritorio, Tripulación y Estado con Asistencia ocupan la columna izquierda, la figura se mantiene en el centro y los indicadores y la tendencia breve ocupan la derecha. En tableta las zonas se distribuyen en dos columnas. En móvil se ordenan como Tripulación, Estado y Asistencia, figura, indicadores y tendencia. El panel completo cabe en el viewport de referencia 1440 × 900 con el catálogo y las lecturas comprobadas. La lista admite desplazamiento interno y la composición permite reflujo y desplazamiento de página al ampliar el texto.

| Zona | Interacción |
| --- | --- |
| Tripulación | Selección por ID con clic o teclado. Muestra nombre, conectividad y estado general reportado. Para otros astronautas, un estado de advertencia o crítico refleja la presencia reportada de avisos asociados. El recuento exacto procede del estado consolidado del seleccionado. `normal` no implica ausencia de avisos informativos. |
| Figura | SVG original de traje espacial de cuerpo completo. Cinco regiones activables con clic, Enter o Espacio. Los botones de la lista ofrecen una alternativa textual equivalente. El indicador y la tendencia comparten la selección. Radiación se sitúa fuera del cuerpo. Las zonas son un recurso de navegación. |
| Indicadores | Cinco filas compactas muestran valor, unidad confirmada, marca UTC con segundos, calidad y severidad cuando la informa una alerta activa de esa variable. Actividad conserva unidad desconocida. El cero y el fallo de sensor se presentan juntos si llegan así del proveedor. |
| Estado y alertas | Muestra el número de alertas activas y el aviso de mayor severidad reportada, con variable y hora. El empate se resuelve por la fecha más reciente. Conserva procedencia desconocida y distingue el error de consulta de un resultado sin alertas. Las rutas de detalle y alertas siguen disponibles. |
| Asistencia | Botón visible que abre la ruta contextual del astronauta. L09-B conserva avance, retorno, corrección y cancelación. La sesión vive en memoria en el nivel de aplicación y se conserva al navegar por hash, incluida la ida y vuelta a Inicio. Reemplazar una sesión con respuestas muestra un aviso. Si hay respuestas, una salida del documento usa el aviso estándar del navegador. |
| Histórico | Resumen de hasta 16 muestras de la variable seleccionada, ordenadas con el adaptador J03. Usa marcas discretas para evitar interpolar. Los fallos se señalan con cruces. La última muestra incluye valor, unidad, calidad y hora. El detalle enlaza al histórico completo con el ID actual. |

## Componentes y contrato

- [HomePage.tsx](../../frontend/src/app/HomePage.tsx) compone las zonas y reutiliza `useCrewQuery`, `QueryFeedback`, los adaptadores y el formateo J03. Las consultas de detalle e histórico se cancelan al cambiar de astronauta.
- [MissionFigure.tsx](../../frontend/src/app/MissionFigure.tsx) define la figura y sus regiones accesibles. [mission-control.css](../../frontend/src/app/mission-control.css) contiene la composición, el foco y las transiciones limitadas a movimiento permitido.
- [App.tsx](../../frontend/src/app/App.tsx), [AppShell.tsx](../../frontend/src/app/AppShell.tsx) y [AssistancePage.tsx](../../frontend/src/app/AssistancePage.tsx) conectan Inicio y preservan las sesiones locales. Las rutas y los componentes J01–J04 conservan sus interfaces. La navegación reduce márgenes en Inicio y mantiene los accesos secundarios existentes.
- Se conservan catálogo, estado e histórico mediante GET y los validadores de respuestas. No hay endpoints, credenciales, umbrales, clasificaciones clínicas ni escrituras nuevas. El trabajador de servicio usa el inventario estático existente. Sin conexión quedan visibles la estructura, la figura y las opciones de métrica, sin telemetría inventada.

## Verificaciones realizadas

| Verificación | Resultado |
| --- | --- |
| `npm run check`, `npm run build`, `git diff --check` | Pasaron. |
| Batería Node previa | **20/20**. API 11, PWA 3, J03/J04 2 y Asistencia 4. |
| [Nueva regresión de Inicio](../../frontend/tests/mission-control.browser.mjs) | Edge a **1440, 1024, 768, 375 y 320 px**. Pasaron las cinco regiones por teclado o clic, el selector de astronauta, la alternativa por indicador, la tendencia, los estados ausentes, alerta crítica, fallo de sensor, el destino contextual y la conservación de sesión en navegación. Se verificaron error/reintento y catálogo vacío. No hubo desbordamiento horizontal en los tamaños probados. El documento cupo en 900 px a 1440 de ancho. |
| [Regresión J03/J04](../../frontend/tests/j03-j04.browser.mjs) | Pasó en Edge a 1440, 375 y 320 px. Se mantuvieron las aserciones de interfaz. Se ajustó la respuesta de prueba porque Inicio ahora consulta el estado al cargar y consumía el fallo simulado que correspondía específicamente a Alertas. |
| PWA y accesibilidad | Edge a 1440, 375 y 320 px cargó la estructura y la figura sin conexión mediante el Service Worker. Se comprobó reflujo con tamaño de texto al 200 %, nombres de controles en el árbol de accesibilidad y ausencia de transiciones con movimiento reducido. Contrastes calculados de texto principal, texto secundario y botón principal contra sus fondos de **15,82:1**, **9,25:1** y **12,89:1**. |
| Flask y simulador | Laboratorio L10-B en un puerto temporal de loopback porque 5000 estaba ocupado. SQLite aislada, credencial efímera del emisor y proxy Vite orientado al puerto de prueba solo durante el ensayo. Dos lotes normales persistieron 10 lecturas y el lote anómalo elevó el total a 15. Flask devolvió dos alertas activas, incluida frecuencia cardíaca crítica de **142,8 bpm**, UNIX **1794738557**. El resumen reflejó el recuento, la métrica y tres muestras de histórico. Asistencia abrió con `astro-01`. Se observaron 14 GET y ningún POST ni `X-API-Key` desde React. |

En la primera revisión el panel excedía 900 px de alto. Se redujeron espacios internos y se amplió la figura dentro de la columna disponible. La condición de altura pasó después del ajuste. El ensayo de ingesta usa el recuento retornado por Flask porque un perfil puede generar más de un aviso. No se tocaron la base ni el proceso que ocupaban el puerto habitual.

## Capturas de Edge

Las imágenes provienen del navegador y muestran el panel con **respuestas sintéticas rotuladas**. Los datos de prueba y las preguntas del ensayo permanecen en la suite, fuera del bundle de producto.

[1440 × 900](evidence/L13/panel-1440.webp) · [1024 px](evidence/L13/panel-1024.webp) · [768 px](evidence/L13/panel-768.webp) · [375 px](evidence/L13/panel-375.webp) · [320 px](evidence/L13/panel-320.webp)

Para repetir la regresión desde `frontend/`, con Playwright y Edge disponibles:

```powershell
node tests/mission-control.browser.mjs '<ruta al módulo Playwright>' '<ruta a Edge>' '<directorio temporal para capturas>'
```

## Pendientes de aprobación y entorno

- El catálogo de Asistencia sigue pendiente de aprobación médica. El producto informa ese estado y no presenta preguntas de prueba ni guías. La conservación de sesión es local al documento y no añade persistencia.
- **Mauricio y líder** mantienen pendientes la política de antigüedad y la procedencia verificable de avisos individuales de L11, y el acceso autenticado compartido. La UI indica antigüedad sin clasificar y procedencia no informada.
- Pendientes de revisión humana la comprensión con usuarios nuevos, el ensayo con lector de pantalla, la instalación en el dispositivo final y la demostración en el equipo objetivo. Las pruebas de teclado y del árbol de accesibilidad no sustituyen esas comprobaciones.
- `Backend/`, `script/`, `junior-workstream/` y los componentes J01–J04 quedaron intactos. No hubo commits, push, merges ni despliegues.
