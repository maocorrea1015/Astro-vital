# ASTRO-VITAL — PROMPT MAESTRO J01
## Implementación de componentes visuales reutilizables del frontend

**Proyecto:** Astro-vital — NASA Space Apps Challenge 2026  
**Equipo:** Ada Lovelace  
**Rol:** Desarrollador Frontend Junior  
**Entregable:** J01 — Componentes visuales de monitoreo  
**Rama:** Rama de feature asignada al desarrollador junior  
**Estado:** Autorizado para implementación dentro del alcance definido

---

# 1. Tu rol y responsabilidad

Actúa como desarrollador frontend especializado en React, TypeScript, Material UI, diseño responsive y accesibilidad.

Formas parte del equipo de desarrollo de Astro-vital. Tu responsabilidad consiste en implementar componentes visuales reutilizables que posteriormente serán integrados en la aplicación principal por el líder frontend.

Este es tu primer entregable de implementación.

Debes trabajar de forma autónoma dentro de los límites asignados, respetando las decisiones documentadas en el repositorio.

**No tienes autorización para modificar la arquitectura general, los contratos de API ni los archivos del backend.**

Tu trabajo debe poder revisarse, probarse e integrarse sin interferir innecesariamente con las tareas que está desarrollando el líder frontend en otra rama.

# 2. Contextualización obligatoria

Ya realizaste una primera contextualización del proyecto.

Antes de implementar, verifica nuevamente las instrucciones relevantes:

- `AGENTS.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/MVP_SCOPE.md`
- `docs/DECISIONS.md`
- `docs/INTEGRATION_GUIDELINES.md`
- `docs/MEDICAL_CONTENT_POLICY.md`
- `docs/roles/frontend-junior.md`
- `frontend/AGENTS.md`
- `frontend/docs/README.md`

Consulta la documentación del backend únicamente cuando necesites comprender la procedencia y naturaleza de las mediciones o alertas.

No modifiques `Backend/`.

Los archivos de documentación compartida son referencias obligatorias, no archivos que puedas reescribir por iniciativa propia.

Si encuentras diferencias entre este prompt y la documentación, prioriza los acuerdos vigentes y reporta la contradicción.

# 3. Verificación de la rama de trabajo

Antes de escribir código:

1. Identifica la rama Git activa.
2. Confirma que no estás en `main`.
3. Comprueba el estado del árbol de trabajo.
4. Identifica si hay modificaciones previas que no pertenecen a esta tarea.
5. Confirma que la estructura existente coincide con la documentación.

**Debes trabajar exclusivamente en la rama de feature que fue asignada al junior.**

No cambies de rama automáticamente.

No realices commits, push, merges, rebases ni modificaciones del historial Git.

Si detectas que estás en `main`, en una rama ajena o que existen cambios desconocidos que podrían sobrescribirse, detén la implementación e informa el problema.

# 4. Objetivo general del entregable

Desarrollar un conjunto inicial de componentes visuales reutilizables para representar información de monitoreo de astronautas.

El objetivo es entregar componentes independientes que puedan incorporarse posteriormente al dashboard principal sin necesidad de reescribir su lógica de presentación.

Los componentes deberán:

- Utilizar React y TypeScript.
- Utilizar Material UI.
- Ser reutilizables.
- Recibir información mediante propiedades tipadas.
- Adaptarse a escritorio y dispositivos móviles.
- Ser accesibles.
- Mostrar correctamente datos disponibles, faltantes o desconocidos.
- Evitar interpretaciones clínicas no aprobadas.
- No conectarse directamente al backend.

# 5. Dependencia inicial: configuración del frontend

Antes de implementar, inspecciona la carpeta `frontend/`.

Determina si el líder frontend ya incorporó la configuración base de React, Vite, TypeScript y Material UI.

### Si la base ya existe

Utiliza las dependencias, tipos, configuración y convenciones existentes.

No reemplaces ni vuelvas a inicializar el proyecto.

### Si la base todavía no existe

No inicialices Vite.

No crees `package.json`.

No instales React ni Material UI.

No modifiques archivos globales.

En ese caso, puedes desarrollar los componentes como archivos TypeScript/TSX autocontenidos, siempre que las dependencias e interfaces necesarias puedan definirse sin inventar contratos compartidos.

Documenta claramente que todavía no es posible ejecutar el build completo.

Si la ausencia de una configuración compartida o de un contrato de propiedades impide desarrollar componentes correctamente, detente y entrega un informe de bloqueo con los archivos y decisiones necesarios.

**Está prohibido fabricar una configuración provisional incompatible con la que prepara el líder frontend.**

# 6. Alcance funcional del entregable J01

Debes implementar los siguientes componentes presentacionales.

## J01.1 — Tarjeta de astronauta

Crear un componente reutilizable para representar un integrante de la tripulación.

Ubicación propuesta:

`frontend/src/features/crew/components/`

### Información que debe poder representar

- Nombre o identificador del astronauta.
- Estado general recibido mediante propiedades.
- Estado de conexión del nodo o dispositivo.
- Momento del último contacto, cuando esté disponible.
- Resumen breve de información relevante, cuando exista.
- Acción opcional para seleccionar o visualizar detalles.

### Requisitos visuales

- Diseño limpio y consistente con Material UI.
- Jerarquía visual clara.
- Diferenciación entre estado de salud reportado y estado de conexión.
- Texto comprensible y legible.
- Adaptación responsive.
- Soporte para navegación mediante teclado cuando existan acciones.

### Estados que debe contemplar

- Información completa.
- Información parcial.
- Estado desconocido.
- Nodo desconectado.
- Sin último contacto disponible.

No debes interpretar que un astronauta está saludable simplemente porque el backend indique un estado general normal.

El estado de conexión tampoco debe confundirse con el estado fisiológico.

## J01.2 — Indicador de medición

Crear un componente reutilizable para representar una medición o indicador de monitoreo.

Ubicación propuesta:

`frontend/src/features/crew/components/`

### Información que debe poder representar

- Nombre de la variable.
- Valor recibido.
- Unidad, cuando esté confirmada.
- Fecha u hora de la medición.
- Calidad del dato.
- Estado de disponibilidad.

### Comportamiento esperado

- Presentar valores numéricos con formato legible.
- Distinguir la ausencia de un valor del valor numérico cero.
- Mostrar de forma clara cuándo no hay datos.
- Permitir indicar que una lectura está desactualizada, cuando esa información sea proporcionada mediante propiedades.
- Permitir representar calidad desconocida o degradada.
- Evitar colores que sugieran diagnósticos no validados.

No definas umbrales médicos.

No calcules reglas de alerta.

No inventes unidades para variables sin una unidad confirmada.

No conviertas automáticamente datos de sensores en diagnósticos.

## J01.3 — Tarjeta de alerta

Crear un componente reutilizable para representar una alerta informada por el sistema.

Ubicación propuesta:

`frontend/src/features/alerts/components/`

### Información que debe poder representar

- Identificador de la alerta.
- Título o mensaje.
- Severidad recibida.
- Momento de generación.
- Estado de reconocimiento.
- Descripción complementaria, cuando exista.

### Comportamiento esperado

- Diferenciar visualmente las severidades conocidas.
- Acompañar los colores con texto e iconografía accesible.
- Manejar severidades desconocidas.
- Mostrar claramente si una alerta ya fue reconocida.
- Permitir una acción opcional de reconocimiento mediante callback, sin realizar peticiones HTTP.

### Restricciones clínicas

No inventes procedimientos médicos.

No conviertas mensajes del backend en instrucciones de primeros auxilios.

No crees nuevas severidades por iniciativa propia.

No interpretes que reconocer una alerta significa que la situación médica quedó resuelta.

# 7. Tipos e interfaces

Utiliza interfaces TypeScript claras y mantenibles.

Los componentes deben recibir sus datos mediante props.

Antes de definir interfaces nuevas, comprueba si existen tipos compartidos creados por el líder.

Si existen, reutilízalos.

Si todavía no existen, puedes definir tipos locales orientados exclusivamente a las necesidades de presentación, sin atribuirles la condición de contrato oficial de API.

No modifiques `frontend/src/services/api/`.

No copies innecesariamente modelos completos del backend.

Evita estructuras incompatibles entre los componentes.

Registra los contratos de props utilizados para que el líder pueda revisarlos antes de integrar tu trabajo.

# 8. Diseño y experiencia de usuario

Los componentes deben seguir una identidad visual coherente con Astro-vital.

### Principios

- Claridad.
- Legibilidad.
- Sobriedad.
- Presentación ordenada de información.
- Uso moderado del color.
- Coherencia entre componentes.
- Accesibilidad.
- Adaptación a diferentes resoluciones.

### Material UI

Utiliza los componentes y mecanismos de estilización de Material UI.

No introduzcas otra biblioteca visual sin aprobación.

No definas un tema global propio.

No modifiques el tema creado por el líder frontend.

Utiliza los tokens existentes cuando estén disponibles.

### Responsive

Diseña los componentes para que funcionen tanto en tarjetas de escritorio como en distribuciones de una sola columna en móvil.

Evita anchuras fijas innecesarias y desbordamientos horizontales.

# 9. Accesibilidad

Aplica como mínimo:

- Etiquetas comprensibles.
- Contraste suficiente.
- Estados identificables sin depender exclusivamente del color.
- Navegación mediante teclado.
- Foco visible.
- Botones con nombres accesibles.
- Mensajes claros cuando falten datos.
- Estructura semántica razonable.

No utilices iconos como único medio para comunicar estados importantes.

# 10. Rutas autorizadas

Puedes crear o modificar archivos exclusivamente dentro de:

- `frontend/src/features/crew/components/`
- `frontend/src/features/alerts/components/`

También puedes crear pruebas directamente asociadas a esos componentes dentro de sus propias carpetas, si el entorno existente permite ejecutarlas.

Si necesitas un componente compartido, un tipo global, una configuración de pruebas o una dependencia adicional, debes justificarlo e informarlo antes de modificar rutas externas.

### Rutas protegidas

No modifiques:

- `Backend/`
- `docs/`
- `AGENTS.md`
- `frontend/AGENTS.md`
- `frontend/docs/`
- `frontend/src/app/`
- `frontend/src/services/api/`
- `frontend/src/pwa/`
- `frontend/src/main.tsx`
- Configuraciones de Vite y TypeScript.
- `package.json`.
- Archivos de otros desarrolladores.

No sobrescribas cambios existentes.

# 11. Datos de demostración

Para verificar los componentes, puedes utilizar ejemplos mínimos de propiedades locales, claramente identificados como datos de prueba.

No presentes esas propiedades como lecturas reales ni como respuestas oficiales del backend.

No inventes historiales clínicos, diagnósticos ni umbrales.

Cuando el proyecto disponga de fixtures aprobados, los componentes deberán poder utilizarlos mediante el adaptador correspondiente.

No implementes simuladores, servidores falsos ni clientes HTTP.

# 12. Pruebas y verificación

Cuando el entorno técnico lo permita:

1. Ejecuta la comprobación de TypeScript.
2. Ejecuta el build existente.
3. Ejecuta las pruebas correspondientes.
4. Verifica la presentación con datos completos.
5. Verifica la presentación con datos faltantes.
6. Verifica valores cero y estados desconocidos.
7. Comprueba el comportamiento responsive.
8. Comprueba accesibilidad básica.
9. Revisa que no existan errores visibles en consola.
10. Revisa el diff y los archivos modificados.

Si no existe un entorno ejecutable, no declares que el build fue exitoso.

Identifica explícitamente qué comprobaciones no pudieron ejecutarse y por qué.

No añadas dependencias ni configuraciones globales solo para superar una prueba.

# 13. Documentación de la implementación

Cada componente debe quedar documentado de forma que el líder frontend pueda integrarlo.

Incluye información sobre:

- Propósito.
- Archivo de implementación.
- Propiedades aceptadas.
- Propiedades opcionales.
- Estados contemplados.
- Callbacks disponibles.
- Dependencias.
- Limitaciones.
- Ejemplo mínimo de uso, cuando sea posible.

Puedes documentar esta información mediante comentarios claros o documentación local a los componentes, dentro de las rutas autorizadas.

No reescribas la documentación general del proyecto.

# 14. Criterios obligatorios de finalización

El entregable J01 solo podrá considerarse técnicamente completado cuando:

1. Los tres componentes solicitados estén implementados.
2. Cada componente tenga responsabilidades claras.
3. No existan solicitudes HTTP dentro de ellos.
4. No se hayan implementado reglas médicas.
5. Los componentes reciban sus datos mediante props.
6. Los estados faltantes y desconocidos estén contemplados.
7. El diseño sea responsive y accesible.
8. Se hayan ejecutado satisfactoriamente las verificaciones disponibles.
9. Las comprobaciones no realizadas estén justificadas.
10. La documentación local sea suficiente para integrarlos.
11. El diff esté limitado a las rutas autorizadas.
12. No se haya modificado `Backend/`.
13. No se hayan realizado operaciones Git no autorizadas.
14. Se haya entregado un informe técnico completo.

Si hay bloqueos, entrega el trabajo efectivamente realizado y señala los criterios no satisfechos.

No declares terminado un criterio que no hayas verificado.

# 15. Informe técnico final obligatorio

Al finalizar, entrega un informe organizado así:

## A. Resumen ejecutivo
Qué se desarrolló y cuál es su utilidad.

## B. Componentes implementados
Descripción de cada componente y sus funcionalidades.

## C. Archivos modificados
Lista completa de archivos creados y modificados, con sus rutas.

## D. Contratos de propiedades
Interfaces TypeScript y explicación de las props importantes.

## E. Estados visuales
Cómo se representan información completa, faltante, desconocida, degradada y desconectada.

## F. Diseño y accesibilidad
Decisiones de presentación, responsive y accesibilidad.

## G. Pruebas realizadas
Comandos ejecutados, resultados y verificaciones manuales.

## H. Pruebas pendientes
Comprobaciones no ejecutadas y su justificación.

## I. Restricciones verificadas
Confirmación de rama, rutas autorizadas y protección del backend.

## J. Bloqueos y dependencias
Qué necesita resolverse para integrar los componentes.

## K. Instrucciones de integración
Cómo puede utilizar estos componentes el líder frontend.

## L. Estado del entregable
Clasifica el resultado como:

- **COMPLETADO Y VERIFICADO:** todos los criterios correspondientes están satisfechos.
- **IMPLEMENTADO CON VERIFICACIONES PENDIENTES:** el código está escrito, pero faltan pruebas necesarias.
- **PARCIAL:** hay funcionalidades incompletas.
- **BLOQUEADO:** no es posible continuar sin resolver una dependencia.

No uses la primera clasificación si faltan verificaciones relevantes.

# 16. Condición final

Cuando termines, detén tu trabajo.

No continúes con otras funcionalidades.

No crees el dashboard completo.

No integres el backend.

No hagas commits ni push.

No abras un Pull Request.

Entrega el informe técnico al desarrollador junior para que lo revise y posteriormente lo comparta con el líder frontend.

**La implementación de J01 no queda aprobada automáticamente por Codex. El líder frontend revisará los resultados y determinará si se autoriza su integración.**
