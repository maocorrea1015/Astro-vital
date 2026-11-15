# L06 · Instalación PWA y conectividad

## Objetivo y alcance

Instalar la aplicación en el entorno objetivo y comunicar disponibilidad de shell y datos. La ejecución requiere el encargo técnico correspondiente.

## Arquitectura y dependencias

Manifest, service worker y ciclo de actualización del shell. Estado de red del navegador como señal auxiliar.

**Dependencias.** L01/L02, navegador, origen seguro y política aprobada. L03/L04 para pruebas API.

## Rutas de escritura previstas

frontend/src/pwa/, frontend/public/icons/, frontend/public/manifest.webmanifest si se elige manifiesto estático, frontend/vite.config.ts, frontend/package.json y su lockfile solo si se autoriza tooling, frontend/src/main.tsx y frontend/tests/pwa.integration.test.tsx.

Registra `leader-workstream/PROGRESS.md` y `leader-workstream/reports/L06-report.md`. Se protegen `Backend/`, `junior-workstream/`, los componentes y pruebas colocalizadas del junior, y cualquier ruta ajena a esta lista. Aplica [propiedad](../OWNERSHIP.md).

## Secuencia

Acordar nombre, iconos, scope y origen; registrar worker y actualizar caché; comprobar que JSON autenticado queda excluido; probar cierre, recarga y actualización.

## Contratos y datos

Caché propuesta de recursos estáticos aprobados. La API utiliza no-store. Persistencia de datos y escrituras requiere decisión separada. Consulta [integración](../INTEGRATION_PLAN.md).

## Comportamiento y excepciones

Tras carga previa, el shell puede abrir offline si se verificó. Mostrar API inaccesible y fechas de datos disponibles; sin lectura viva mientras no responda. Prever salida por URL si instalación no disponible.

## Aceptación, pruebas y evidencias

Build de producción y prueba manual en HTTPS o localhost según entorno. Verificar instalación, recarga, actualización, corte y recuperación de emisor/API y contenido del caché. Registrar navegador y origen sanitizado. Usa los comandos reales del proyecto y registra skips con motivo. La aceptación exige evidencia de cada comportamiento aplicable y pruebas esenciales satisfactorias.

## Condiciones de bloqueo

Origen inseguro, caché de respuestas privadas, persistencia sin aprobación o navegador de demo sin confirmar. Registra evidencia, responsable y condición concreta de reanudación. Continúa solo en trabajo independiente autorizado.

## Informe

Usa [la plantilla](../reports/README.md) con los resultados de esta ficha, evidencia, archivos, riesgos y siguiente paso. Separa estado técnico y revisión humana.
