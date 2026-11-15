"""
Módulo del Motor de Reglas Médicas y Guías Clínicas para ASTRA HEALTH.

Propósito:
    Evalúa la telemetría biomédica y ambiental contra umbrales clínicos absolutos
    y modelos estadísticos de línea base individual. Genera alertas tempranas y
    guías de mitigación para la tripulación según protocolos aeroespaciales.

Autor: Equipo de Ingeniería Biomédica de ASTRA HEALTH
Versión: 1.0.0
Dependencias: math, sqlite3, typing
Advertencias clínicas y operativas:
    - Las reglas absolutas siempre prevalecen sobre las reglas por desviación.
    - Las lecturas marcadas con calidad 'sensor_fault' NUNCA deben detonar alertas fisiológicas.
    - Este módulo es una herramienta de soporte a la decisión, no reemplaza el criterio del cirujano de vuelo.
"""

import math
import time
from typing import Dict, Any, Optional, Tuple


def evaluate_absolute_rule(variable: str, value: float) -> Optional[Tuple[str, str, str]]:
    """Evalúa umbrales médicos absolutos independientes del historial del astronauta.

    Args:
        variable (str): Nombre de la métrica telemétrica ('heart_rate', 'spo2', etc.).
        value (float): Magnitud cuantitativa actual.

    Returns:
        Optional[Tuple[str, str, str]]: Tupla con (severidad, mensaje, guia) si se activa un umbral,
        o None si el valor se encuentra dentro de límites seguros.

    Medical Rationale & NASA HRP Risks:
        - heart_rate: Aborda el riesgo de arritmias y colapso cardiovascular por desacondicionamiento
          (NASA Risk of Cardiac Rhythm Problems). FC > 130 bpm en reposo compromete el gasto cardíaco.
        - spo2: Aborda el riesgo de hipoxia hipóxica por fallo de presurización o traje (NASA Risk of Hypoxia).
          Saturación < 90% causa pérdida de conciencia y deterioro cognitivo agudo.
        - temperature: Aborda el riesgo de hipertermia por fallo en el circuito de refrigeración líquida
          del traje espacial (NASA Risk of Thermal Stress / Impaired Performance).
        - radiation_cpm: Aborda eventos de partículas solares (SPE) y radiación ionizante acumulada
          (NASA Risk of Radiation Carcinogenesis and Acute Radiation Syndromes).
    """
    if variable == "heart_rate":
        if value > 130.0:
            return (
                "critical",
                "Frecuencia cardíaca crítica (>130 BPM)",
                "Detén toda actividad. Siéntate. Contacta al equipo médico en Tierra inmediatamente.",
            )
        elif 100.0 < value <= 130.0:
            return (
                "warning",
                "Frecuencia cardíaca elevada",
                "Siéntate y descansa 5 minutos. Vuelve a medir. Si persiste, contacta al cirujano de vuelo.",
            )

    elif variable == "spo2":
        if value < 90.0:
            return (
                "critical",
                "Saturación de oxígeno crítica (<90%)",
                "Siéntate, respira profundo. Verifica el ajuste de la mascarilla. Contacta al equipo médico.",
            )
        elif 90.0 <= value < 94.0:
            return (
                "warning",
                "Saturación de oxígeno baja (90-93%)",
                "Respira profundo, verifica mascarilla. Mide de nuevo en 5 minutos.",
            )

    elif variable == "temperature":
        if value > 38.5:
            return (
                "critical",
                "Temperatura corporal crítica (>38.5°C)",
                "Bebe agua, descansa. Contacta al equipo médico. No realices actividad física.",
            )
        elif 37.5 < value <= 38.5:
            return (
                "warning",
                "Temperatura corporal elevada (37.6-38.5°C)",
                "Posible fiebre. Bebe agua, descansa, mide de nuevo en 30 minutos.",
            )

    elif variable == "radiation_cpm":
        if value > 100.0:
            return (
                "critical",
                "Nivel de radiación ionizante crítico (>100 CPM)",
                "Dirígete al módulo de mayor blindaje. Registra el evento. Contacta a Tierra.",
            )
        elif 50.0 < value <= 100.0:
            return (
                "warning",
                "Nivel de radiación ionizante elevado (50-100 CPM)",
                "Limita el tiempo en zonas expuestas. Monitorea la dosis acumulada.",
            )

    return None


def evaluate_deviation_rule(
    variable: str,
    value: float,
    baseline: Optional[Dict[str, Any]],
) -> Optional[Tuple[str, str, str]]:
    """Evalúa la variación estadística respecto a la línea base individual (Z-Score).

    Solo opera si la línea base cuenta con un mínimo de 50 muestras consolidadas.

    Args:
        variable (str): Métrica analizada.
        value (float): Valor numérico de la lectura.
        baseline (Optional[Dict[str, Any]]): Registro de la línea base con 'promedio',
            'desviacion' y 'muestras'.

    Returns:
        Optional[Tuple[str, str, str]]: Tupla (severidad, mensaje, guia) si z > 2 o z > 4,
        o None si no hay suficiente historial o el valor está dentro de rangos normales.

    Medical Rationale:
        Permite detectar anomalías insidiosas personalizadas (ej. astronauta con frecuencia
        habitual en reposo de 50 BPM que sube a 95 BPM; no viola el umbral absoluto de 100 BPM
        pero representa un Z-Score severo indicativo de infección o estrés hemodinámico).
    """
    if baseline is None:
        return None

    samples = baseline.get("muestras", 0)
    # Requisito estricto: mínimo 50 muestras históricas para otorgar significancia estadística
    if samples < 50:
        return None

    mean = baseline.get("promedio", 0.0)
    std_dev = baseline.get("desviacion", 0.0)
    # Prevención de división por cero: si la desviación es 0, se utiliza 1.0 como salvaguarda
    effective_std = std_dev if std_dev > 0.0 else 1.0

    z_score = abs(value - mean) / effective_std

    if z_score > 4.0:
        return (
            "critical",
            f"{variable} muy fuera de tu línea base",
            "Contacta al equipo médico en Tierra inmediatamente. Guarda reposo y monitorea tus síntomas.",
        )
    elif z_score > 2.0:
        return (
            "warning",
            f"{variable} fuera de tu línea base",
            "Descansa 5 minutos y vuelve a medir. Si persiste, notifica al cirujano de vuelo.",
        )

    return None


def evaluate_reading_alert(
    astronaut_id: str,
    reading: Dict[str, Any],
    baseline: Optional[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    """Aplica la jerarquía completa de reglas clínicas sobre una lectura telemétrica.

    Args:
        astronaut_id (str): Identificador del astronauta.
        reading (Dict[str, Any]): Lectura validada con ts, variable, value y quality.
        baseline (Optional[Dict[str, Any]]): Línea base histórica para esa variable.

    Returns:
        Optional[Dict[str, Any]]: Diccionario estructurado de alerta listo para inserción en BD,
        o None si la lectura es fisiológicamente normal o proviene de un sensor averiado.

    Security & Reliability Note:
        - Si quality == 'sensor_fault', se descarta inmediatamente la generación de alertas.
        - Las reglas absolutas se evalúan primero; si se disparan, la regla de desviación se omite
          para evitar ruido y duplicación innecesaria de alertas.
    """
    quality = reading.get("quality", "ok")
    if quality == "sensor_fault":
        return None

    variable = reading["variable"]
    value = float(reading["value"])
    ts = int(reading["ts"])

    # 1. Evaluación de reglas absolutas prioritarias
    abs_result = evaluate_absolute_rule(variable, value)
    if abs_result is not None:
        severidad, mensaje, guia = abs_result
        return {
            "astronaut_id": astronaut_id,
            "ts": ts,
            "variable": variable,
            "valor": value,
            "severidad": severidad,
            "mensaje": mensaje,
            "guia": guia,
        }

    # 2. Evaluación de reglas por desviación estadística personalizada
    dev_result = evaluate_deviation_rule(variable, value, baseline)
    if dev_result is not None:
        severidad, mensaje, guia = dev_result
        return {
            "astronaut_id": astronaut_id,
            "ts": ts,
            "variable": variable,
            "valor": value,
            "severidad": severidad,
            "mensaje": mensaje,
            "guia": guia,
        }

    return None


def recalculate_baseline(
    db_conn: Any,
    astronaut_id: str,
    variable: str,
) -> Dict[str, Any]:
    """Recalcula y persiste la línea base estadística para una variable de un astronauta.

    Calcula la media aritmética y la desviación estándar poblacional a partir de todas
    las lecturas válidas almacenadas (excluyendo 'sensor_fault').

    Args:
        db_conn: Conexión activa a la base de datos SQLite.
        astronaut_id (str): Identificador del tripulante.
        variable (str): Parámetro biométrico a recalcular.

    Returns:
        Dict[str, Any]: Diccionario con las estadísticas consolidadas.

    Security Note:
        Utiliza consultas parametrizadas para evitar cualquier vector de inyección SQL.
    """
    cursor = db_conn.cursor()
    # Selección de todos los valores válidos históricos para la variable
    cursor.execute(
        """
        SELECT valor 
        FROM lecturas 
        WHERE astronaut_id = ? AND variable = ? AND calidad != 'sensor_fault'
        ORDER BY ts ASC
        """,
        (astronaut_id, variable),
    )
    rows = cursor.fetchall()
    count = len(rows)

    if count == 0:
        promedio = 0.0
        desviacion = 0.0
    else:
        values = [float(r["valor"]) for r in rows]
        promedio = sum(values) / count
        # Cálculo de desviación estándar poblacional: sqrt( sum((x - mean)^2) / N )
        variance = sum((x - promedio) ** 2 for x in values) / count
        desviacion = math.sqrt(variance)

    # Redondeo clínico para consistencia
    promedio_round = round(promedio, 2)
    desviacion_round = round(desviacion, 2)
    now_ts = int(time.time())

    # Inserción o actualización segura en linea_base
    cursor.execute(
        """
        INSERT INTO linea_base (astronaut_id, variable, promedio, desviacion, muestras, actualizado_en)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(astronaut_id, variable) DO UPDATE SET
            promedio = excluded.promedio,
            desviacion = excluded.desviacion,
            muestras = excluded.muestras,
            actualizado_en = excluded.actualizado_en
        """,
        (astronaut_id, variable, promedio_round, desviacion_round, count, now_ts),
    )

    return {
        "astronaut_id": astronaut_id,
        "variable": variable,
        "promedio": promedio_round,
        "desviacion": desviacion_round,
        "muestras": count,
    }
