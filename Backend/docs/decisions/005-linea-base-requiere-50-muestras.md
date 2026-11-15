# ADR 005: Requisito de un Mínimo de 50 Muestras para Reglas de Línea Base

- **Fecha**: 2026-11-14
- **Estado**: Aceptado

## Contexto
El cálculo del Z-Score ($Z = |x - \mu| / \sigma$) permite detectar anomalías insidiosas específicas para cada tripulante. Sin embargo, en las fases tempranas de la misión o cuando un nuevo sensor se conecta, el número de muestras acumuladas es pequeño. Estimar la media y la desviación estándar con muestras reducidas ($N < 30$) sufre de alta variabilidad muestral, lo que provocaría que fluctuaciones biológicas normales generen falsas alarmas críticas.

## Decisión
Se estableció como requisito estricto que la tabla `linea_base` cuente con **al menos 50 muestras válidas** (`muestras >= 50`) para una variable antes de habilitar la evaluación de reglas por desviación de Z-Score.

## Alternativas Consideradas
1. **Activar Z-Score desde la primera muestra ($N \ge 2$)**:
   - *Por qué se descartó*: Con 2 o 3 muestras, la desviación estándar es prácticamente cero o muy estrecha, causando que cualquier variación cardíaca menor (ej. ponerse de pie) genere Z > 4 y desate alertas críticas falsas.
2. **Utilizar una línea base fija estándar para toda la tripulación**:
   - *Por qué se descartó*: Ignora la fisiología individual de cada astronauta (un atleta puede tener FC basal de 48 BPM y otro de 75 BPM). La personalización es el principio clave de ASTRA HEALTH.
3. **Requerir 200 o más muestras**:
   - *Por qué se descartó*: A una tasa de muestreo de 1 lectura por segundo o por minuto, 200 muestras retrasaría excesivamente la disponibilidad de la detección estadística individual. 50 muestras ofrece un balance óptimo entre significancia estadística inicial y rapidez de activación.

## Consecuencias
### Ventajas:
- **Estabilidad estadística**: Con 50 muestras, según el Teorema del Límite Central y la ley de los grandes números, la varianza muestral se estabiliza suficientemente para detectar valores verdaderamente atípicos ($Z > 2$ y $Z > 4$).
- **Eliminación de falsos positivos en el arranque**: Durante los primeros minutos de calibración no se emite ruido innecesario a la tripulación.

### Desventajas y Riesgos:
- **Período de ceguera estadística inicial**: Durante las primeras 49 muestras, el sistema depende exclusivamente de las reglas médicas absolutas para detectar problemas en esa variable.

## Referencias
- Central Limit Theorem in Physiological Time Series.
- NIST/SEMATECH e-Handbook of Statistical Methods: Sample Size Considerations.
