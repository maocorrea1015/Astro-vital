# Plan y recorrido mínimo

| ID | Entrega | Dependencias principales |
| --- | --- | --- |
| [L01](deliverables/L01-foundation.md) | Base React/Vite/TypeScript/MUI verificable | Autorización técnica, gestor y entorno definidos |
| [L02](deliverables/L02-shell.md) | Shell y navegación | L01 verificado |
| [L03](deliverables/L03-api.md) | Contrato de consumidor y acceso seguro | L01, revisión de Mauricio, topología y credenciales |
| [L04](deliverables/L04-crew.md) | Tripulación y detalle con una lectura | L02, L03 y J01–J02 para integración final |
| [L05](deliverables/L05-telemetry.md) | Mediciones, histórico y alertas | L04, contrato confirmado, J01/J03/J04 para integración final |
| [L06](deliverables/L06-pwa.md) | Instalación y conectividad | L01–L02, origen y política de caché. Pruebas de API con L03–L04 |
| [L07](deliverables/L07-quality.md) | Pruebas y accesibilidad de integración | Recorrido compuesto y evidencia del junior |
| [L08](deliverables/L08-demo.md) | Ensayo final y evidencia reproducible | Recorrido mínimo verificado y simulación preparada |
| [L09](deliverables/L09-assistance.md) | Asistencia interactiva condicionada | Alcance y contenido aprobados, modelo y persistencia si aplican |

## Recorte y orden

Primero L01 y L02. Negocia L03 desde el inicio. La primera rebanada de L04 debe probar **una lectura entregada por la API** con identidad, unidad, fecha, calidad y procedencia acordadas. Si J01/J02 aún no están disponibles, puede verificarse el transporte y la adaptación y, si se autoriza, mostrar la muestra en una salida textual de diagnóstico de la página L04. Esa salida es temporal y carece de tarjetas o composición asignadas al junior. L04 integrado permanece pendiente hasta montar sus componentes.

Después incorpora histórico y alertas, prueba PWA y prepara el ensayo. Si el plazo exige recortar, conserva aplicación navegable, acceso seguro y lectura de extremo a extremo. Pasa a la demo solo las ampliaciones verificadas. Aplaza sincronización, vistas extra y asistencia sin aprobación. Registra el recorte y su impacto con el equipo.

El agente puede avanzar en trabajo independiente autorizado cuando las dependencias estén verificadas. Fallos esenciales impiden verificar el entregable afectado. Usa scripts reales del manifiesto y registra comando, revisión, entorno y resultado. Si faltan scripts, herramienta, contrato o evidencia, escribe el bloqueo y el siguiente paso. La aprobación de revisión se registra separada de la verificación técnica.
