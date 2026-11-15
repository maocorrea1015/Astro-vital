# Motor de Reglas Médicas, Umbrales y Guías Clínicas - ASTRA HEALTH

Este documento describe la base científica, médica y aeroespacial del motor de reglas clínicas implementado en [rules.py](file:///d:/proyectos/Astro-vital/Backend/rules.py). Todas las directivas se alinean con los protocolos del **Human Research Program (HRP)** de la NASA.

---

## 1. Jerarquía de Evaluación y Prevalencia

El motor aplica una estricta jerarquía de decisión:
1. **Filtro de Integridad de Hardware**: Si una lectura posee calidad `calidad = 'sensor_fault'`, se almacena para registro técnico pero **no evalúa ninguna regla médica**.
2. **Prioridad de Reglas Absolutas**: Si una lectura viola un umbral absoluto, se genera la alerta correspondiente y **se detiene la evaluación**.
3. **Reglas de Desviación Individual (Z-Score)**: Solo se evalúan si:
   - La lectura no activó ninguna regla absoluta.
   - La línea base acumulada del astronauta para esa variable cuenta con **al menos 50 muestras** válidas.

---

## 2. Reglas Absolutas

### 2.1 Frecuencia Cardíaca (`heart_rate`)

#### Regla Crítica (`heart_rate > 130 BPM`)
- **Severidad**: `critical`
- **Mensaje**: `"Frecuencia cardíaca crítica (>130 BPM)"`
- **Guía al Astronauta**: `"Detén toda actividad. Siéntate. Contacta al equipo médico en Tierra inmediatamente."`
- **Justificación Médica**:
  En reposo o actividad moderada en microgravedad, una frecuencia cardíaca sostenida superior a 130 BPM compromete severamente el llenado diastólico ventricular y eleva el consumo miocárdico de oxígeno.
- **Riesgo de NASA (HRP)**:
  *Risk of Cardiac Rhythm Problems* y *Risk of Adverse Cognitive or Behavioral Conditions and Psychiatric Disorders*.
- **Consecuencia de No Actuar**:
  Isquemia miocárdica aguda, arritmias ventriculares malignas o síncope inducido por hipotensión refleja.
- **Limitaciones**:
  No discrimina taquicardia fisiológica durante ejercicio cardiovascular intenso programado (para lo cual se correlaciona con la variable `activity`).

#### Regla de Advertencia (`100 < heart_rate <= 130 BPM`)
- **Severidad**: `warning`
- **Mensaje**: `"Frecuencia cardíaca elevada"`
- **Guía al Astronauta**: `"Siéntate y descansa 5 minutos. Vuelve a medir. Si persiste, contacta al cirujano de vuelo."`
- **Justificación Médica**:
  Indica taquicardia sinusal leve que puede ser consecuencia temprana de deshidratación, estrés térmico, dolor o desacondicionamiento cardiovascular.
- **Riesgo de NASA (HRP)**:
  *Risk of Orthostatic Intolerance during and following Spaceflight*.
- **Consecuencia de No Actuar**:
  Progresión a deshidratación severa, fatiga aguda o fallo circulatorio durante actividades extravehiculares (EVA).
- **Limitaciones**:
  Puede activarse transitoriamente tras maniobras físicas breves.

---

### 2.2 Saturación de Oxígeno (`spo2`)

#### Regla Crítica (`spo2 < 90%`)
- **Severidad**: `critical`
- **Mensaje**: `"Saturación de oxígeno crítica (<90%)"`
- **Guía al Astronauta**: `"Siéntate, respira profundo. Verifica el ajuste de la mascarilla. Contacta al equipo médico."`
- **Justificación Médica**:
  Una SpO2 inferior al 90% corresponde a una presión arterial de oxígeno (PaO2) inferior a 60 mmHg, umbral por debajo del cual la curva de disociación de la hemoglobina desciende abruptamente.
- **Riesgo de NASA (HRP)**:
  *Risk of Hypoxia during Space Operations* y *Risk of Acute Hypoxia from Life Support System Anomalies*.
- **Consecuencia de No Actuar**:
  Deterioro cognitivo inmediato, pérdida de conciencia ("time of useful consciousness" menor a 2 minutos en despresurizaciones rápidas) y eventual muerte por hipoxia anóxica.
- **Limitaciones**:
  La hipotermia periférica en extremidades o la mala perfusión digital pueden falsear lecturas mediante pletismografía de pulso.

#### Regla de Advertencia (`90 <= spo2 < 94%`)
- **Severidad**: `warning`
- **Mensaje**: `"Saturación de oxígeno baja (90-93%)"`
- **Guía al Astronauta**: `"Respira profundo, verifica mascarilla. Mide de nuevo en 5 minutos."`
- **Justificación Médica**:
  Indica hipoxia moderada o hipoventilación alveolar, frecuente ante acumulación de dióxido de carbono ($CO_2$) en bolsas de aire no mezcladas en microgravedad.
- **Riesgo de NASA (HRP)**:
  *Risk of Adverse Health Effects from Toxic Exposures and Elevated Carbon Dioxide Levels*.
- **Consecuencia de No Actuar**:
  Cefalea incapacitante, letargo y reducción del rendimiento operativo de la misión.
- **Limitaciones**:
  Movimiento vigoroso de la mano portadora del sensor que cause artefactos de movimiento.

---

### 2.3 Temperatura Corporal (`temperature`)

#### Regla Crítica (`temperature > 38.5°C`)
- **Severidad**: `critical`
- **Mensaje**: `"Temperatura corporal crítica (>38.5°C)"`
- **Guía al Astronauta**: `"Bebe agua, descansa. Contacta al equipo médico. No realices actividad física."`
- **Justificación Médica**:
  La disipación convectiva de calor está impedida en microgravedad y trajes espaciales presurizados. Una temperatura > 38.5°C sugiere un fallo del circuito de refrigeración por agua sublimada o golpe de calor inminente.
- **Riesgo de NASA (HRP)**:
  *Risk of Performance Decrement and Injury Due to Inadequate Thermal Control*.
- **Consecuencia de No Actuar**:
  Rabdomiólisis, convulsiones por golpe de calor o fallo multiorgánico.
- **Limitaciones**:
  No detecta hipotermia (valores por debajo de 35°C no contemplados en esta regla crítica).

#### Regla de Advertencia (`37.5 < temperature <= 38.5°C`)
- **Severidad**: `warning`
- **Mensaje**: `"Temperatura corporal elevada (37.6-38.5°C)"`
- **Guía al Astronauta**: `"Posible fiebre. Bebe agua, descansa, mide de nuevo en 30 minutos."`
- **Justificación Médica**:
  Febrícula que puede indicar síndrome de adaptación espacial, infección respiratoria incipiente o sobrecarga metabólica.
- **Riesgo de NASA (HRP)**:
  *Risk of Host-Microorganism Interactions and Immune System Dysregulation*.
- **Consecuencia de No Actuar**:
  Brote infeccioso dentro del hábitat cerrado.

---

### 2.4 Radiación Ionizante (`radiation_cpm`)

#### Regla Crítica (`radiation_cpm > 100 CPM`)
- **Severidad**: `critical`
- **Mensaje**: `"Nivel de radiación ionizante crítico (>100 CPM)"`
- **Guía al Astronauta**: `"Dirígete al módulo de mayor blindaje. Registra el evento. Contacta a Tierra."`
- **Justificación Médica**:
  Indica un evento de partículas solares (SPE - *Solar Particle Event*) o fallo del apantallamiento electromagnético/material del módulo.
- **Riesgo de NASA (HRP)**:
  *Risk of Acute Radiation Syndromes Due to Solar Particle Events* y *Risk of Radiation Carcinogenesis*.
- **Consecuencia de No Actuar**:
  Síndrome de irradiación aguda (destrucción hematopoyética, eritema cutáneo, daño gastrointestinal).
- **Limitaciones**:
  Los detectores de CPM no discriminan energía ni tipo específico de partícula (iones pesados HZE vs. protones).

#### Regla de Advertencia (`50 < radiation_cpm <= 100 CPM`)
- **Severidad**: `warning`
- **Mensaje**: `"Nivel de radiación ionizante elevado (50-100 CPM)"`
- **Guía al Astronauta**: `"Limita el tiempo en zonas expuestas. Monitorea la dosis acumulada."`
- **Justificación Médica**:
  Tránsito por la Anomalía del Atlántico Sur (SAA) o incremento de radiación de fondo en órbita/superficie lunar.
- **Riesgo de NASA (HRP)**:
  *Risk of Space Radiation-Induced Cardiovascular Disease*.
- **Consecuencia de No Actuar**:
  Incremento del exceso de riesgo relativo de cáncer a lo largo de la vida.

---

## 3. Reglas de Desviación por Línea Base (Z-Score)

### Algoritmo
La desviación estandarizada se calcula como:
$$z = \frac{|x - \mu|}{\sigma}$$
Donde:
- $x$ es el valor de la lectura telemétrica actual.
- $\mu$ es el promedio histórico acumulado de ese astronauta para esa variable.
- $\sigma$ es la desviación estándar poblacional acumulada (si $\sigma = 0$, se sustituye por $1.0$).

### Umbrales de Desviación
- **Z > 4.0** (Severidad: `critical`):
  - *Mensaje*: `"{variable} muy fuera de tu línea base"`
  - *Guía*: `"Contacta al equipo médico en Tierra inmediatamente. Guarda reposo y monitorea tus síntomas."`
- **Z > 2.0 y Z <= 4.0** (Severidad: `warning`):
  - *Mensaje*: `"{variable} fuera de tu línea base"`
  - *Guía*: `"Descansa 5 minutos y vuelve a medir. Si persiste, notifica al cirujano de vuelo."`

### Justificación de las 50 Muestras
En series fisiológicas, estimar la media y la varianza con muestras reducidas ($N < 50$) genera intervalos de confianza inestables por variabilidad biológica natural (ciclo circadiano, digestión, respiración). Exigir 50 muestras asegura que la varianza sea representativa del estado basal real del astronauta antes de generar alarmas estadísticas.
