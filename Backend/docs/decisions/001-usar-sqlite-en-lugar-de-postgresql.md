# ADR 001: Usar SQLite en Lugar de PostgreSQL

- **Fecha**: 2026-11-14
- **Estado**: Aceptado

## Contexto
El sistema ASTRA HEALTH debe operar en hábitats espaciales y módulos de tripulación sin acceso a Internet, desplegado en hardware embebido de recursos limitados (laptops de misión o Raspberry Pi 4/5). Se evaluó el motor de persistencia relacional adecuado para almacenar telemetría de alta frecuencia, alertas clínicas y perfiles de tripulantes.

## Decisión
Se eligió **SQLite 3** como motor de base de datos relacional principal, configurado con `PRAGMA journal_mode = WAL` y `PRAGMA foreign_keys = ON`.

## Alternativas Consideradas
1. **PostgreSQL**:
   - *Por qué se descartó*: Requiere un proceso demonio dedicado, consumo elevado de memoria RAM (~100-200 MB base), administración de servicios del sistema operativo, puertos de red abiertos y mantenimiento de sockets. Innecesario y riesgoso para un sistema embebido mononodo.
2. **Bases de datos NoSQL / Documentales (MongoDB, TinyDB)**:
   - *Por qué se descartó*: Las relaciones e integridad referencial estricta (nodos -> lecturas -> alertas) son críticas en un entorno de salud de soporte vital. Las restricciones relacionales (`FOREIGN KEY`, `CHECK`, `UNIQUE`) previenen estados huérfanos.

## Consecuencias
### Ventajas:
- **Cero administración**: La base de datos es un único archivo en disco (`data/astra_health.db`).
- **Resiliencia ante cortes eléctricos**: Con el modo WAL, las transacciones atómicas evitan la corrupción del archivo ante cortes repentinos de energía.
- **Rendimiento**: Acceso directo en memoria/disco mediante biblioteca C embebida, sin latencia TCP de red.

### Desventajas y Riesgos:
- **Escritor único**: SQLite solo admite un escritor simultáneo. Aunque el modo WAL permite lectores concurrentes, escrituras simultáneas intensas pueden provocar contención (`database is locked`), requiriendo reintentos exponenciales en código.
- **Escalabilidad horizontal limitada**: No está diseñado para clusters distribuidos entre múltiples servidores físicos.

## Referencias
- SQLite WAL Mode Documentation: https://www.sqlite.org/wal.html
- Appropriate Uses For SQLite: https://www.sqlite.org/whentouse.html
