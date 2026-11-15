# L03 · Contratos, adaptadores y acceso seguro

## Objetivo y alcance

Conectar un consumidor validado al proveedor sin exponer la credencial privada. La ejecución requiere el encargo técnico correspondiente.

## Arquitectura y dependencias

Transporte → validación runtime → DTO del proveedor → modelo de presentación. La UI recibe modelos adaptados.

**Dependencias.** L01, revisión y ejemplos de Mauricio, topología y mecanismo de acceso confirmados.

## Rutas de escritura previstas

frontend/src/services/api/client.ts, contracts.ts, adapters.ts, astronauts.ts, frontend/tests/api.test.ts y frontend/tests/fixtures/api/ para ejemplos acordados. Un intermediario fuera de frontend requiere alcance aparte.

Registra `leader-workstream/PROGRESS.md` y `leader-workstream/reports/L03-report.md`. Se protegen `Backend/`, `junior-workstream/`, los componentes y pruebas colocalizadas del junior, y cualquier ruta ajena a esta lista. Aplica [propiedad](../OWNERSHIP.md).

## Secuencia

Acordar revisión, operaciones y autenticación; verificar acceso desde el navegador; definir errores tipados, timeout y cancelación; validar fixtures; adaptar identidades, fechas y calidades. Limitar superficie a operaciones necesarias.

## Contratos y datos

Usar GET de listado y status y ejemplos de API.md confirmados. ts en segundos, unidad y procedencia por acuerdo. Ver plan de integración para históricos y alertas. Consulta [integración](../INTEGRATION_PLAN.md).

## Comportamiento y excepciones

Distinguir respuesta válida vacía, datos inválidos, abortos, 401, 404, 429 y fallo de red. Informar carga al consumidor. Asegurar backoff según respuesta y ausencia de secretos.

## Aceptación, pruebas y evidencias

Probar adaptación de cero, nulos, fechas y calidad, errores y cancelación con tooling existente. Verificar una consulta de navegador autorizada y revisar bundle/configuración pública. Registrar revisión, evidencia sanitizada y presupuesto de consultas. Usa los comandos reales del proyecto y registra skips con motivo. La aceptación exige evidencia de cada comportamiento aplicable y pruebas esenciales satisfactorias.

## Condiciones de bloqueo

JSON o topología sin confirmar, credencial privada accesible al navegador, CORS/HTTPS incompatible, o llamada real sin entorno autorizado. Registra evidencia, responsable y condición concreta de reanudación. Continúa solo en trabajo independiente autorizado.

## Informe

Usa [la plantilla](../reports/README.md) con los resultados de esta ficha, evidencia, archivos, riesgos y siguiente paso. Separa estado técnico y revisión humana.
