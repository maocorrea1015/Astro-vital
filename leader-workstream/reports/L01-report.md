# L01 · Informe de inicialización técnica

**Rama:** `feature/frontend-foundation`. **HEAD inicial:** `6e3109e`. **Estado:** implementado y verificado técnicamente, pendiente de revisión humana.

## Resultado

`frontend/` contiene la aplicación React/Vite con TypeScript estricto. La entrada instala `ThemeProvider` y `CssBaseline`. El tema oscuro de Material UI define tipografía de sistema, una escala de 8 px, colores de fondo y texto y foco visible para controles basados en MUI. La pantalla inicial identifica Astro-vital y comunica que la integración del monitoreo está pendiente. No contiene datos de astronautas ni llama a un proveedor.

La composición y el tema viven en `src/app/`. Los componentes usan PascalCase, archivos TSX para vistas, propiedades tipadas e imports desde los módulos públicos de MUI. El tema centraliza la presentación compartida. El junior conserva sus carpetas y podrá usar el mismo proveedor y el tema sin inicializar otra aplicación. Los servicios y la navegación se incorporarán cuando se autoricen sus entregables; las firmas de props del junior se acordarán al integrar.

## Archivos

- Nuevos en `frontend/`: `.gitignore`, `index.html`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `src/vite-env.d.ts`, `src/main.tsx`, `src/app/App.tsx` y `src/app/theme.ts`.
- Seguimiento: se actualizó `leader-workstream/PROGRESS.md` y se creó este informe. El resto de L00 y los documentos de frontend se conservaron.
- `node_modules/` y `dist/` son salidas locales ignoradas. npm es el único gestor con lockfile.

## Entorno y comandos

Validado con Node 24.22.1 y npm 11.19.0 en Windows. El manifiesto declara Node 20.19.x o superior dentro de 20, o Node 22.12 o superior, siguiendo el rango de Vite. Node debe estar disponible en `PATH` para ejecutar los scripts. Desde `frontend/`:

~~~sh
npm ci
npm run dev
npm run typecheck
npm run check
npm run build
npm run preview
~~~

El árbol instalado incluye React y React DOM 19.3.1, Material UI 9.5.0, Emotion React 11.14.0 y Styled 11.14.1, Vite 8.3.8, plugin React 6.3.0 y TypeScript 5.9.3. Tipos instalados: React y React DOM 19.3.0, Node 24.19.2. Se eligió TypeScript 5.9.3 para una base de compilación estable y sencilla. El lockfile fija las resoluciones.

## Verificaciones y resultados

| Comprobación | Resultado |
| --- | --- |
| `npm install --save-exact --no-fund` | Instalación completada. npm reportó cero vulnerabilidades en esa ejecución. |
| `npm run check` | Correcto. Ejecuta `npm run typecheck`, con `tsc --noEmit`. |
| `npm run build` | Correcto. Tipos y build Vite de producción. |
| Render de desarrollo con Vite en loopback y Edge mediante Playwright | HTTP 200 a 1440, 375 y 320 px. El H1 y el aviso se montaron, el fondo calculado coincidió con el tema, el título pasó de 72 px a 44 px en móvil y no hubo desbordamiento horizontal ni errores de consola en la repetición final. |
| Lint | No configurado. El script de calidad disponible es la comprobación de tipos. |
| Diff y archivos protegidos | `git diff --check` y comprobación de archivos nuevos. Los archivos preexistentes conservaron su contenido salvo `PROGRESS.md`. `Backend/` y las rutas del junior quedaron intactos. |

La primera prueba de consola detectó una solicitud automática de favicon que devolvía 404. El HTML ahora declara un icono vacío para esta base y la repetición pasó. La verificación del navegador cubrió el render de desarrollo; no incluye una auditoría completa de accesibilidad, que corresponde a L07.

## Traspaso

El junior ya puede usar React, TypeScript, Material UI y el tema, y ejecutar tipos y build cuando reciba la revisión que contiene L01. Aún debe acordar props y confirmar con el líder un entorno de pruebas de componentes. El repositorio queda preparado para revisión humana. L02 requiere un nuevo encargo técnico y la decisión sobre navegación mínima. API y seguridad quedan en L03. Instalación PWA, manifest y caché quedan en L06.
