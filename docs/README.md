# Índice de Documentación General — Astro-vital
## Especificaciones, Arquitectura, Gobernanza y Políticas

[![NASA Space Apps Challenge](https://img.shields.io/badge/NASA_Space_Apps-Challenge_2026-blue.svg)](https://www.spaceappschallenge.org/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](../LICENSE)
[![Open Source](https://img.shields.io/badge/OSI-Approved-green.svg)](https://opensource.org/licenses/Apache-2.0)

Este directorio reúne los documentos normativos, arquitectónicos y de gobernanza técnica para el proyecto **Astro-vital** / **ASTRA-VITAL**, desarrollado por el **Equipo Ada Lovelace** para el **NASA Space Apps Challenge 2026**.

---

## Mapa de Documentos

| Documento | Enfoque Principal | Audiencia / Responsable |
| :--- | :--- | :--- |
| **[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)** | Visión del problema en misiones ICE, usuarios, valor y glosario operativo. | Todo el equipo y evaluadores |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Arquitectura compartida de extremo a extremo, degradación y flujo de telemetría. | Arquitectos y desarrolladores |
| **[MVP_SCOPE.md](MVP_SCOPE.md)** | Definición estricta del alcance mínimo viable, criterios de aceptación y exclusiones. | Gestión y líderes técnicos |
| **[INTEGRATION_GUIDELINES.md](INTEGRATION_GUIDELINES.md)** | Contratos de integración, serialización, tipado, normalización y manejo de errores. | Frontend y Backend |
| **[DECISIONS.md](DECISIONS.md)** | Registro de decisiones arquitectónicas y técnicas (ADRs) acordadas. | Equipo técnico |
| **[MEDICAL_CONTENT_POLICY.md](MEDICAL_CONTENT_POLICY.md)** | Política estricta sobre afirmaciones médicas, justificación NASA HRP y no prescripción. | Revisión clínica y UX |

---

## Fichas de Roles del Equipo

- **[roles/frontend-lead.md](roles/frontend-lead.md)**: Propiedad de arquitectura frontend, PWA, integración de contratos y revisión de calidad.
- **[roles/frontend-junior.md](roles/frontend-junior.md)**: Desarrollo de componentes, validaciones visuales y pruebas de interfaz.
- **[roles/backend-mauricio.md](roles/backend-mauricio.md)**: Persistencia SQLite, API REST, motor de reglas clínicas y seguridad perimetral.

---

## Subsistemas del Repositorio

- **Hardware y Firmware**: [Modulo-ASTRA-VITAL/README.md](../Modulo-ASTRA-VITAL/README.md) (Wearable `ASTRA-WBU-01`, Unidad Ambiental `ASTRA-EMU-01`, CPU ESP32 `ASTRA-CPU-01`).
- **Backend Central**: [Backend/README.md](../Backend/README.md) (API Flask, SQLite WAL, Reglas Clínicas).
- **Frontend y PWA**: [FrontEnd/README.md](../FrontEnd/README.md) y [FrontEnd/docs/README.md](../FrontEnd/docs/README.md) (React, TypeScript, Vite, Material UI).
- **Gestión de Entregables**: [leader-workstream/README.md](../leader-workstream/README.md) (Plan de trabajo, reportes y seguimiento).

---

## Licencia

Toda la documentación técnica y diagramas en esta carpeta están licenciados bajo la Licencia Internacional **[Creative Commons Atribución 4.0 (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/deed.es)**, en conformidad con las directrices de ciencia abierta del NASA Space Apps Challenge 2026. Consulte el archivo [LICENSE](../LICENSE) en la raíz del repositorio.
