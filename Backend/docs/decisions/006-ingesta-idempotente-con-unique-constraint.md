# ADR 006: Ingesta Idempotente Mediante Restricción UNIQUE en SQLite

- **Fecha**: 2026-11-14
- **Estado**: Aceptado

## Contexto
En entornos espaciales y transmisiones de radiofrecuencia (WiFi, Bluetooth o enlaces de radio de trajes EVA), las caídas momentáneas de señal y las pérdidas de paquetes son frecuentes. Los microcontroladores como el ESP32 implementan mecanismos de reintento automático: si envían un paquete y el acuse de recibo (ACK HTTP) se pierde, retransmiten el lote completo. Sin protección en el backend, esto generaría duplicación masiva de registros y distorsión de los promedios fisiológicos.

## Decisión
Se implementó **ingesta idempotente a nivel de base de datos relacional** mediante:
1. Una restricción única compuesta en la tabla `lecturas`:
   ```sql
   CONSTRAINT uq_lectura_idempotente UNIQUE(astronaut_id, ts, variable)
   ```
2. La instrucción de inserción segura:
   ```sql
   INSERT OR IGNORE INTO lecturas (astronaut_id, ts, variable, valor, calidad, creado_en)
   VALUES (?, ?, ?, ?, ?, ?)
   ```
3. La contabilidad en el controlador de las lecturas efectivamente insertadas mediante `cursor.rowcount`.

## Alternativas Consideradas
1. **Verificación manual en código (`SELECT COUNT(*) ...` antes de cada `INSERT`)**:
   - *Por qué se descartó*: Requiere dos consultas por cada muestra ($2N$ consultas por lote). En un lote de 100 lecturas, generaría 200 operaciones SQL, introduciendo latencia innecesaria y condiciones de carrera si dos hilos procesaran reintentos simultáneamente.
2. **Ignorar duplicados y limpiarlos periódicamente en segundo plano**:
   - *Por qué se descartó*: Durante el intervalo entre limpiezas, el cálculo de la línea base acumularía valores duplicados, alterando la media y la desviación estándar de forma incorrecta.

## Consecuencias
### Ventajas:
- **Garantía matemática de unicidad**: El propio motor SQLite previene la duplicación en el índice B-Tree sin costo extra de consultas.
- **Rendimiento óptimo**: `INSERT OR IGNORE` procesa lotes de cientos de lecturas en milisegundos.
- **Trazabilidad clara**: El backend reporta con exactitud al cliente cuántas lecturas fueron insertadas y cuántas fueron ignoradas por duplicadas (`"duplicadas": N`).

### Desventajas y Riesgos:
- **Sobrecarga de almacenamiento del índice**: El índice compuesto único consume espacio adicional en el archivo de base de datos.
- **Dependencia de la precisión del timestamp**: Si el reloj del sensor emite dos mediciones diferentes dentro del mismo segundo para la misma variable, la segunda será descartada (asume frecuencia máxima de 1 Hz por variable por tripulante).

## Referencias
- SQLite Documentation: ON CONFLICT Clause (`OR IGNORE`).
- Martin Fowler: Idempotent Receiver Pattern.
