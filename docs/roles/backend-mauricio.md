# Coordinación con Mauricio

Mauricio es el responsable del backend central y el punto de contacto para ingesta, persistencia, procesamiento y referencia REST. Esta ficha orienta al consumidor sobre las dependencias de coordinación.

| Frontera | Coordinación |
| --- | --- |
| Sensores o simulación → API de ingesta | Confirmar emisor, identidad, reloj, variables, unidades y cómo verificar lotes y reenvíos. |
| API → PWA | Confirmar revisión, rutas de lectura para demo, calidad, límites, origen, alertas, ejemplos y errores. |
| PWA → API | Confirmar si se usarán notas o acuses. Si se requiere un evento estructurado, documentar la necesidad y acordar su significado. |
| Navegador y despliegue | Acordar alcance de acceso, autenticación, origen, CORS, HTTPS o localhost y cuota aplicable. |

La referencia contractual es [API.md](../../Backend/docs/API.md). Consulta [README](../../Backend/README.md), [arquitectura](../../Backend/docs/ARCHITECTURE.md), [seguridad](../../Backend/docs/SECURITY.md), [despliegue](../../Backend/docs/DEPLOYMENT.md) y [ADR](../../Backend/docs/decisions/) para detalles de proveedor. La [guía compartida](../INTEGRATION_GUIDELINES.md) describe qué evidencia envía el líder para discrepancias, cómo se acuerdan ejemplos y cómo se verifica una revisión con simulación. La propiedad técnica y la documentación interna corresponden a Mauricio.
