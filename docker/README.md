# Ejecución integrada con Docker Compose

Compose inicia los tres servicios en un solo servidor. Solo el frontend publica el puerto `8080`; backend y simulador no publican puertos y se comunican por la red interna de Docker. SQLite persiste en el volumen `backend-data`.

## Inicio

Desde la raíz del repositorio, solo hace falta ejecutar:

```powershell
docker compose up --build -d
docker compose ps
```

Abre `http://localhost:8080`. El simulador envía cinco variables al backend cada 5 segundos. Compose usa claves públicas de demostración predeterminadas, así que no necesitas crear `.env` ni configurar secretos para el MVP.

El frontend se construye desde su propia carpeta y contexto, así que también puedes construir su imagen por separado:

```powershell
docker build -t astro-vital-frontend ./FrontEnd
```

Para ver los logs y detener todo:

```powershell
docker compose logs -f frontend backend simulator
docker compose down
```

El servicio `simulator` usa `http://backend:5000` en la red interna de Compose. Nginx sirve la PWA y reenvía `/gateway/api/*` al backend; la clave de demostración del frontend se agrega en el servidor y su cliente solo tiene permiso GET. El simulador usa su propia clave de demostración para ingesta. El backend persiste únicamente los hashes de ambas claves. La red `edge` conecta solo el frontend con el exterior; backend y simulador quedan aislados.

Las claves predeterminadas son públicas y sirven únicamente para una demo local/MVP. Si se despliega fuera del entorno del reto, se pueden reemplazar con variables `BACKEND_SECRET_KEY`, `ASTRA_API_KEY` y `FRONTEND_API_KEY` en `.env`.

## Configuración

En `.env` se pueden ajustar `ASTRA_SIMULATOR_INTERVAL` (segundos, por defecto 5), `ASTRA_SIMULATOR_MODE` y `ASTRA_ASTRONAUT_ID`.

`docker compose down` detiene y elimina los contenedores, pero conserva SQLite. `docker compose down -v` elimina también la base de datos persistida.

El firmware físico de `Modulo-ASTRA-VITAL/` no se ejecuta en Docker. El tercer contenedor ejecuta `script/simulator.py`, que emula la ESP32.
