# ADR 003: Rate Limiting en Memoria sin Dependencias Externas

- **Fecha**: 2026-11-14
- **Estado**: Aceptado

## Contexto
El sistema corre en una laptop de misión o Raspberry Pi con recursos de CPU y memoria acotados. Para evitar que un bucle infinito en el firmware del ESP32 o un ataque de denegación de servicio (DoS) sature el servidor web, era indispensable limitar la frecuencia de solicitudes entrantes.

## Decisión
Se implementó un **limitador de tasa (Rate Limiter) basado en ventana deslizante en memoria** utilizando estructuras de datos nativas de Python (`dict` y `list`) sincronizadas con `threading.Lock`.

## Alternativas Consideradas
1. **Redis con Flask-Limiter**:
   - *Por qué se descartó*: Requiere instalar, configurar y mantener un servicio demonio Redis en segundo plano, violando el principio de arquitectura embebida y aumentando los puntos únicos de fallo del sistema.
2. **Persistencia de marcas de tiempo en SQLite**:
   - *Por qué se descartó*: Escribir y leer en la base de datos por cada solicitud HTTP para verificar el rate limit aumentaría drásticamente la contención de escritura en SQLite, degradando el rendimiento de ingesta.

## Consecuencias
### Ventajas:
- **Cero dependencias externas**: No requiere servicios adicionales en el sistema operativo.
- **Rendimiento ultrarrápido**: La verificación de la ventana deslizante se ejecuta en microsegundos en RAM.
- **Thread-safe**: El cerrojo `threading.Lock` previene condiciones de carrera entre hilos concurrentes de Flask.

### Desventajas y Riesgos:
- **Pérdida de estado ante reinicios**: Si el backend se reinicia, los contadores de solicitudes vuelven a cero.
- **Consumo de memoria no acotado sin purga**: Si millones de IPs distintas atacaran el sistema, el diccionario crecería. Sin embargo, en un entorno cerrado con 2 o 3 dispositivos fijos, el consumo de memoria es insignificante (< 10 KB).

## Referencias
- RFC 6585: Additional HTTP Status Codes (429 Too Many Requests).
- Leaky Bucket / Sliding Window Rate Limiting Algorithms.
