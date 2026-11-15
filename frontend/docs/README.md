# Guía técnica del frontend

La PWA de Astro-vital permitirá consultar tripulación, mediciones y alertas con fecha, calidad y procedencia. El prototipo prioriza escritorio y admite pantallas pequeñas. El alcance y los estados de aprobación viven en [MVP_SCOPE.md](../../docs/MVP_SCOPE.md). La revisión actual contiene documentación y directorios de organización.

## Stack confirmado

| Tecnología | Papel previsto |
| --- | --- |
| React | Componer vistas, estados y componentes por funcionalidad. |
| Vite | Entorno de desarrollo y build. La configuración y las versiones se decidirán al inicializar la aplicación. |
| TypeScript | Declarar modelos internos y propiedades de componentes. Validar JSON en tiempo de ejecución antes de confiar en sus tipos. |
| Material UI | Controles, tema y layout con convenciones compartidas de foco, espaciado, tipografía y contraste. |
| PWA | Instalación y shell de aplicación. Manifest, iconos, service worker, navegador objetivo y política de caché siguen pendientes. |

## Estructura y convenciones propuestas

| Ruta existente | Propiedad prevista |
| --- | --- |
| `src/app/` | Composición, tema y configuración de navegación según alcance. |
| `src/components/` | Estados visuales, controles o patrones que usan varias funcionalidades. |
| `src/features/crew/` | Vistas, lógica de presentación y pruebas de tripulación, selección, lecturas y tendencias. |
| `src/features/alerts/` | Presentación, filtros y eventual reconocimiento de alertas. |
| `src/services/api/` | Transporte, validación de respuestas, tipos de frontera y adaptación. |
| `src/pwa/` | Registro y actualización del service worker y política del shell, cuando se autoricen. |
| `public/icons/` | Recursos de instalación aprobados. |
| `tests/fixtures/` | Ejemplos versionados y sanitizados, con procedencia y revisión de proveedor. |

Usa PascalCase para componentes y camelCase para funciones y valores internos. Mantén los campos de transporte con su nombre de contrato dentro del adaptador. Coloca UI local junto a la funcionalidad y eleva patrones repetidos a componentes compartidos con revisión del líder. Para añadir una función, indica su requisito, dependencias, propietario y prueba. Usa estado local de consulta y composición simple como punto de partida. Nuevos módulos o dependencias requieren una necesidad concreta y alcance autorizado.

## Flujo de consulta y estados

**Selección → adaptador HTTP → validación → modelo de interfaz → presentación.** La vista solicita el dato vinculado al ID seleccionado. El adaptador valida campos requeridos, nulos y tipos, transforma tiempo, unidad y calidad según [la guía de integración](../../docs/INTEGRATION_GUIDELINES.md) y devuelve resultados distinguibles. La vista debe descartar actualizaciones tardías de selecciones anteriores.

| Estado | Comportamiento y verificación |
| --- | --- |
| Carga | Muestra progreso en el área solicitada y conserva la identidad seleccionada. Verifica una respuesta lenta. |
| Vacío | Explica qué falta y conserva navegación. Comprueba array vacío y valor cero por separado. |
| Error | Identifica consulta, permiso, recurso ausente o servicio según el resultado. Verifica 401, 404, 429 y respuesta mal formada con fixtures. |
| API inaccesible | Identifica pérdida de acceso y permite recuperación según política. Mantén fecha visible si hay un resultado anterior. |
| Nodo offline | Presenta último contacto sin confundirlo con acceso al backend. |
| Lectura obsoleta | Marca antigüedad por hora de medición, aunque siga online el nodo. |
| Calidad degradada o fallo | Indica calidad de la muestra con texto. Evita apariencia de medición normal. |
| Demo | Etiqueta datos y alertas simulados de forma visible y verificable. Un fallo real conserva su estado y queda separado de un modo demo elegido. |

## Presentación y accesibilidad

En escritorio destaca astronauta, fecha, disponibilidad y avisos antes del desplazamiento principal cuando el layout lo permita. En pantallas pequeñas conserva el mismo orden semántico y evita desbordamiento en textos y controles. Usa tokens de tema para jerarquía y severidad. Combina color, icono y texto. Verifica nombre accesible, navegación con teclado, foco visible, contraste y lectura de mensajes de estado. Si hay gráficas, ofrece unidad, intervalo y una representación textual de los datos relevantes.

## PWA, seguridad y revisión

Probar instalación y recarga en el navegador objetivo sobre HTTPS o localhost. Comprobar por separado el shell offline, el acceso a la API y cualquier persistencia autorizada. Mantener el caché propuesto en recursos estáticos aprobados y respetar las directivas del proveedor. Las credenciales privadas quedan fuera del bundle, variables `VITE_*`, fixtures y logs.

Para revisar un cambio, vincula requisito, ejemplos y estados cubiertos. Prueba adaptador con respuestas válidas, vacías e inválidas. Prueba componentes con teclado, pantallas pequeñas y estados excepcionales. Sigue una lectura simulada en integración y comprueba corte y recuperación. Registra resultado, limitaciones y pendientes de revisión, especialmente el [contenido médico](../../docs/MEDICAL_CONTENT_POLICY.md). Presentación y composición se sustentan en la definitiva §§9, 15–17 y 20–21.
