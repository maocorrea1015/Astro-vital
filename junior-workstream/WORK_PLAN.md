# Plan secuencial del junior

Entrega UI desacoplada que el líder pueda montar con sus datos adaptados y callbacks. Este plan asigna el orden y los límites de la ejecución posterior. Cada ficha es la fuente de entradas, salidas, archivos, estados, accesibilidad, aceptación, evidencias y bloqueos. Consulta [propiedad](OWNERSHIP.md) para límites transversales.

| Orden | Objetivo | Dependencia de avance y evidencia |
| --- | --- | --- |
| [J01](deliverables/J01-components.md) | Tres componentes básicos reutilizables | Revisar base y tipos del líder. Evidencia de render, estados y callbacks. |
| [J02](deliverables/J02-crew-view.md) | Vista visual de tripulación | J01 verificado. Demostrar carga, vacío, error y selección con tarjetas. |
| [J03](deliverables/J03-measurements.md) | Indicadores e histórico legible | J02 verificado. Confirmar modelos y unidades disponibles. Evidencia de casos de series y alternativa textual. |
| [J04](deliverables/J04-alerts.md) | Lista, filtros y eventos de alertas | J03 verificado. Acordar mensajes y semántica de props con el líder. |
| [J05](deliverables/J05-quality.md) | Verificación transversal e instrucciones de integración | J01–J04 verificados. Evidencia de build, tipos, pruebas y revisión accesible. |

## Base y verificaciones

Inspecciona el manifiesto y lockfile si existen, los scripts y configuraciones aprobados, los tipos de UI y los medios de render y prueba. Usa el gestor y comandos del proyecto con sus dependencias disponibles. Si falta la base, registra la dependencia del líder. Puedes preparar UI autocontenida dentro de la lista de rutas cuando el alcance se pueda satisfacer con props locales y sin asumir interfaces ajenas. El build, el chequeo de tipos y el render quedan pendientes hasta disponer de la base. Si falta una herramienta indispensable, solicita al líder la decisión. Evita inicializaciones paralelas, instalación automática y herramientas que descarguen paquetes para suplir una verificación.

Verifica tipos, build y pruebas locales mediante los comandos reales de la copia. Comprueba estados manualmente cuando haya un entorno aprobado para renderizar. Registra comando exacto, entorno y resultado. Si el build genera artefactos, comprueba antes que su destino sea el previsto por el proyecto y revisa después el estado de Git. Revisa diff, archivos nuevos y rutas protegidas. Una verificación esencial fallida o sin ejecutar impide declarar el entregable verificado.

## Seguimiento

| Estado | Criterio |
| --- | --- |
| NO INICIADO | Sin evidencia de implementación. Puede tener dependencias registradas. |
| EN CURSO | Trabajo parcial identificado y siguiente paso definido. |
| IMPLEMENTADO | Código presente y criterios funcionales cubiertos en inspección. Faltan verificaciones para el siguiente estado. |
| VERIFICADO | Criterios técnicos satisfechos con evidencia de las verificaciones esenciales. |
| BLOQUEADO | Una dependencia o decisión impide avanzar en el alcance afectado. Registra evidencia y estado técnico previo. |
| PENDIENTE DE REVISIÓN DEL LÍDER | Revisión humana solicitada o lista para solicitar. Registrar por separado del estado técnico. |
| APROBADO POR EL LÍDER | Revisión explícita con evidencia. Registrar en la columna de revisión. |

Guarda un [informe](reports/README.md) por entregable realizado y actualiza [progreso](PROGRESS.md) con enlaces a informes existentes. Solo inicia la siguiente entrega secuencial si la anterior está técnicamente verificada, ambas están cubiertas por el encargo activado y las dependencias de la siguiente están disponibles. Ante un bloqueo, puedes avanzar en una parte independiente ya autorizada sin saltar el criterio de avance. La verificación técnica habilita el avance; la aprobación del líder habilita la integración según su revisión.
