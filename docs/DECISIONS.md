# Registro de decisiones

Usa los [estados documentales](PROJECT_CONTEXT.md#evolución-y-precedencia). Registra la procedencia de cada acuerdo. Las filas abiertas indican a quién corresponde resolverlas. Toda nueva decisión debe incluir evidencia, alcance y criterio para verificarla.

## Acuerdos vigentes

| ID | Tema y decisión | Estado y fuente | Responsable e impacto |
| --- | --- | --- | --- |
| DEC-01 | React, Vite y Material UI. PWA desktop-first con responsive y accesibilidad. | CONFIRMADO · acuerdos comunicados y Prompts 01–02. | Equipo. Base técnica y criterios de interfaz. Versiones y mecanismo PWA abiertos. |
| DEC-02 | TypeScript adoptado. La definitiva había planteado JavaScript como alternativa. | CONFIRMADO · Prompt 02. | Equipo frontend. Tipos internos y validación en el límite. |
| DEC-03 | JSON como frontera de integración. Referencia mantenida por Mauricio. | CONFIRMADO · acuerdos y Prompt 02. | Mauricio y líder. Consultar la revisión que se acuerde y resolver diferencias antes de integrar. |
| DEC-04 | Credenciales privadas fuera del bundle. | CONFIRMADO · Prompt 02. | Mauricio y líder. El canal de autenticación queda abierto. |
| DEC-05 | Backend bajo responsabilidad de Mauricio y protegido en encargos frontend y compartidos. | CONFIRMADO · Prompts 01–03. | Equipo. La coordinación se registra fuera de `Backend/`. |
| DEC-06 | Revisión médica antes de publicar condiciones, preguntas y orientación. | CONFIRMADO · Prompt 03 y alcance vigente. | Equipo y profesional designado. La evidencia de revisión controla publicación. |
| DEC-07 | Etapa 3 de documentación previa a PR. Implementación de frontend fuera del alcance autorizado. | CONFIRMADO · Prompt 03. | Usuario. El esqueleto es documental y de directorios. |

## Diferencias con evidencia del repositorio

| ID | Tema | Estado técnico e impacto | Fuente |
| --- | --- | --- | --- |
| OBS-01 | Stack de API | IMPLEMENTADO en Flask y SQLite. FastAPI/Pydantic y PostgreSQL permanecen como opciones históricas en la definitiva §6.2. Este registro describe el proveedor actual. | [Dependencias](../Backend/requirements.txt), [esquema](../Backend/schema.sql) |
| OBS-02 | Formato | IMPLEMENTADOS campos `ts` UNIX y `variable`, `valor`, `calidad` en consultas. El formato ISO, unidad y origen de la definitiva §7.1 es PROPUESTO. | [API](../Backend/docs/API.md), [consultas](../Backend/routes/astronauts.py) |
| OBS-03 | Escrituras | IMPLEMENTADOS notas y reconocimiento. Evento, preguntas y sincronización son PROPUESTOS. | [Notas](../Backend/routes/notes.py), [alertas](../Backend/routes/alerts.py), definitiva §§7–8, 12 |
| OBS-04 | Hardware | PROPUESTAS dos topologías en las fuentes. Emisor autónomo Raspberry Pi en la inicial, y ESP32 o simulador con Raspberry Pi cliente en documentación del backend. | Inicial §§1–2, [arquitectura del backend](../Backend/docs/ARCHITECTURE.md) |

## Pendientes de validación

| ID | Decisión pendiente | Responsable por función | Impacto |
| --- | --- | --- | --- |
| PEN-01 | Revisar rutas, muestras, unidades, origen y calidad. Acordar versión de API y cambios necesarios. | Mauricio, líder y simulación | Tipos, fixtures, etiquetas y demo. |
| PEN-02 | Elegir topología, anfitrión, emisor, acceso desde navegador, origen, CORS, HTTPS o localhost y credenciales. | Mauricio, líder y responsables de sensores/simulación | Prueba vertical y seguridad de la PWA. |
| PEN-03 | Acordar frescura, cadencia, latencia y presupuesto. Evaluar polling antes de introducir SSE/WebSocket. | Mauricio y líder | Consultas, reintentos y avisos de antigüedad. |
| PEN-04 | Cerrar P0, instalación, shell offline, historial, notas, acuses y eventos para la demo. | Equipo | Entregables y guion de prueba. |
| PEN-05 | Designar aprobación médica y cerrar variables prioritarias, escenarios, preguntas, reglas y guías. | Equipo y responsable médico | Contenido visible y asistencia. |
| PEN-06 | Acordar navegador, computadora, identidad pública y convenciones Git. | Equipo | Instalación, presentación y revisión de cambios. |

## ADR del backend

[001 SQLite](../Backend/docs/decisions/001-usar-sqlite-en-lugar-de-postgresql.md), [002 API keys](../Backend/docs/decisions/002-api-keys-en-lugar-de-jwt.md), [003 límite de tasa](../Backend/docs/decisions/003-rate-limiting-en-memoria.md), [004 prioridad absoluta](../Backend/docs/decisions/004-reglas-absolutas-prioritarias-sobre-desviacion.md), [005 línea base](../Backend/docs/decisions/005-linea-base-requiere-50-muestras.md) y [006 idempotencia](../Backend/docs/decisions/006-ingesta-idempotente-con-unique-constraint.md).
