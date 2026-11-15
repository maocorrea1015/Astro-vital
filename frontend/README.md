# Astro-vital — Frontend & PWA Dashboard
## Consola de Cabina y Telemetría Médica para Hábitats Espaciales

[![NASA Space Apps Challenge](https://img.shields.io/badge/NASA_Space_Apps-Challenge_2026-blue.svg)](https://www.spaceappschallenge.org/)
[![Framework](https://img.shields.io/badge/Framework-React_18_%2B_Vite-61DAFB.svg)](https://react.dev/)
[![Language](https://img.shields.io/badge/Language-TypeScript_5-3178C6.svg)](https://www.typescriptlang.org/)
[![UI Library](https://img.shields.io/badge/UI-Material_UI_v5-007FFF.svg)](https://mui.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](../LICENSE)

> Aplicación Web Progresiva (PWA) de alta disponibilidad diseñada para operar en la cabina o terminal del astronauta (Raspberry Pi / Laptop de Misión). Permite la supervisión en tiempo real de constantes vitales, calidad del aire en cabina, historial telemétrico y gestión táctica de alertas clínicas.

---

## Características Principales

- **Diseño de Cabina para Misión:** Interfaz optimizada con tema oscuro de alto contraste, foco visible y navegación con teclado conforme a principios de ergonomía espacial.
- **Diferenciación de Disponibilidad:** Distingue visual y semánticamente entre:
  - Pérdida de enlace con el nodo sensor/traje (nodo *offline* vs *online*).
  - Pérdida de conexión con el backend central (API inaccesible).
  - Antigüedad de la muestra (frescura temporal basada en timestamp UTC).
  - Degradación de hardware o transductor (`sensor_fault` o `degraded`).
- **Arquitectura PWA Offline-First:** Capacidad de mantener en caché el shell de la aplicación para consulta de datos históricos almacenados localmente ante cortes temporales de red.
- **Supervisión de Alertas Médicas:** Panel de contingencias con categorización por severidad (`critical`, `warning`, `info`) y flujo de acuse de recibo (*acknowledge*).
- **Bitácora y Notas del Tripulante:** Registro de síntomas subjetivos y observaciones de misión saneadas contra XSS.

---

## Estructura del Código Frontend

```
FrontEnd/
├── public/                 # Iconos, manifest PWA y recursos estáticos
├── src/
│   ├── app/                # Configuración global, providers y tema Material UI
│   ├── components/         # Componentes reutilizables de UI (tarjetas, medidores, badges)
│   ├── features/
│   │   ├── crew/           # Vistas de tripulación, selección y telemetría en vivo
│   │   └── alerts/         # Panel de alertas clínicas y reconocimiento
│   ├── services/
│   │   └── api/            # Cliente HTTP, adaptadores y validación de esquemas JSON
│   └── pwa/                # Configuración de Service Worker y registro de caché
├── docs/
│   └── README.md           # Guía técnica detallada del frontend
├── package.json            # Dependencias y scripts de construcción
├── tsconfig.json           # Configuración del compilador TypeScript
└── vite.config.ts          # Configuración del bundler Vite
```

Para consultar la guía técnica completa de arquitectura, contratos y convenciones del frontend, consulte [docs/README.md](docs/README.md).

---

## Puesta en Marcha Rápida

### Contenedor

El [Dockerfile](Dockerfile) construye la PWA y la sirve con Nginx en el puerto `8080`. Para ejecutar el frontend integrado con el backend y el simulador, consulta [los comandos de Docker Compose](../docker/README.md). Desde la raíz puedes construir solo su imagen con `docker build -t astro-vital-frontend ./FrontEnd`.

### 1. Requisitos Previos
* **Node.js** v18 o superior.
* Gestor de paquetes **npm** o **pnpm**.

### 2. Instalación de Dependencias
```bash
cd FrontEnd
npm install
```

### 3. Ejecución en Modo Desarrollo
```bash
npm run dev
```
La aplicación iniciará en `http://localhost:5173`.

### 4. Construcción para Producción
```bash
npm run build
```

---

## Licencia y Reconocimientos

Proyecto desarrollado en el marco del **NASA Space Apps Challenge 2026** por el **Equipo Ada Lovelace**.

- **Código fuente:** Licenciado bajo la [Licencia Apache 2.0](../LICENSE).
- **Documentación y diseño:** Licenciados bajo [Creative Commons Atribución 4.0 Internacional (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/deed.es).
