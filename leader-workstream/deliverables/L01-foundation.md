# L01 · Inicialización técnica

## Objetivo y alcance

Crear una base React, Vite, TypeScript y Material UI reproducible para líder y junior. La ejecución requiere el encargo técnico correspondiente.

## Arquitectura y dependencias

Entrada Vite → raíz React → ThemeProvider → contenido mínimo de aplicación.

**Dependencias.** Autorización técnica, entorno Node, gestor y versiones compatibles acordados.

## Rutas de escritura previstas

frontend/package.json, el lockfile del gestor elegido, frontend/index.html, frontend/vite.config.ts, frontend/tsconfig*.json, frontend/.gitignore, frontend/src/main.tsx, frontend/src/vite-env.d.ts, frontend/src/app/App.tsx y frontend/src/app/theme.ts.

Registra `leader-workstream/PROGRESS.md` y `leader-workstream/reports/L01-report.md`. Se protegen `Backend/`, `junior-workstream/`, los componentes y pruebas colocalizadas del junior, y cualquier ruta ajena a esta lista. Aplica [propiedad](../OWNERSHIP.md).

## Secuencia

Verificar ausencia de base; confirmar gestor y versiones; inicializar en frontend sin sobrescribir documentación; definir tipos y build; montar un componente MUI y compartir instrucciones y revisión con el junior.

## Contratos y datos

Todavía sin modelos REST. Entregar rutas, scripts, forma de importar MUI y uso del tema. Consulta [integración](../INTEGRATION_PLAN.md).

## Comportamiento y excepciones

Arranque reproducible y error de build visible mediante el script. Estados de datos de carga, vacío y desconexión corresponden a L04.

## Aceptación, pruebas y evidencias

Ejecutar los scripts acordados de desarrollo, tipos y build de producción. Abrir la URL local y verificar render MUI y consola. Registrar versiones, scripts, entorno y captura o resultado. Usa los comandos reales del proyecto y registra skips con motivo. La aceptación exige evidencia de cada comportamiento aplicable y pruebas esenciales satisfactorias.

## Condiciones de bloqueo

Base concurrente, gestor sin decidir, instalación fuera de la autorización de ejecución o errores esenciales de tipos/build. Registra evidencia, responsable y condición concreta de reanudación. Continúa solo en trabajo independiente autorizado.

## Informe

Usa [la plantilla](../reports/README.md) con los resultados de esta ficha, evidencia, archivos, riesgos y siguiente paso. Separa estado técnico y revisión humana.
