# ADR 004: Prevalencia Jerárquica de Reglas Médicas Absolutas sobre Reglas de Desviación

- **Fecha**: 2026-11-14
- **Estado**: Aceptado

## Contexto
El motor clínico evalúa dos familias de reglas:
1. **Reglas absolutas**: Umbrales biológicos fijos (ej. FC > 130 BPM, SpO2 < 90%).
2. **Reglas por desviación de línea base**: Discrepancias estadísticas individuales (Z-Score > 2 o Z > 4).

Existía el riesgo de que una lectura anómala grave detonara simultáneamente una alerta absoluta y una alerta por desviación (ej. frecuencia cardíaca de 150 BPM con línea base en 70 BPM dispararía ambas), inundando la interfaz de alarmas repetitivas.

## Decisión
Se estableció una **política de precedencia estricta**: si una lectura transgrede una regla médica absoluta, se genera la alerta correspondiente y **se omite completamente la evaluación de desviación estadística** para esa muestra.

## Alternativas Consideradas
1. **Generación concurrente de múltiples alertas**:
   - *Por qué se descartó*: Provoca fatiga de alarmas (*alarm fatigue*) en el astronauta, saturando la pantalla de la Raspberry Pi con múltiples avisos sobre el mismo evento fisiológico.
2. **Priorizar la regla de desviación sobre la absoluta**:
   - *Por qué se descartó*: La desviación estadística requiere un modelo matemático de confianza; ante una emergencia aguda con riesgo inminente para la vida (ej. hipoxia fulminante), las guías clínicas estandarizadas de contingencia absoluta deben primar sin depender de cálculos estadísticos.

## Consecuencias
### Ventajas:
- **Claridad cognitiva para la tripulación**: El astronauta recibe una única directiva clara y prioritaria de actuación inmediata.
- **Reducción de ruido en bitácora**: Evita duplicidad de registros en la tabla `alertas`.

### Desventajas y Riesgos:
- **Pérdida de metadatos estadísticos en el registro de alerta**: La alerta no almacena el valor Z-Score cuando se dispara la regla absoluta, requiriendo análisis forense posterior si se desea conocer la magnitud exacta de la desviación.

## Referencias
- NASA Human Research Program: Behavioral Health and Performance Human Factors.
- Joint Commission Sentinel Event Alert: Medical device alarm safety in hospitals.
