# Estrategia y Ejecución de Pruebas Automatizadas - ASTRA HEALTH

Este documento describe la suite de pruebas unitarias, de integración y de seguridad del backend de ASTRA HEALTH implementada con `pytest`.

---

## 1. Ejecución de las Pruebas

Para ejecutar la suite completa de pruebas:

```bash
# Ejecución detallada con información de cada prueba
python -m pytest -v

# Ejecución de un archivo de prueba específico
python -m pytest tests/test_security.py -v

# Ejecución con reporte de cobertura (si pytest-cov está instalado)
python -m pytest --cov=. --cov-report=term-missing
```

---

## 2. Cobertura de la Suite de Pruebas

La suite comprende 18 pruebas automatizadas distribuidas en cuatro módulos especializados:

### 2.1 `tests/test_readings.py` (Ingesta de Telemetría)
- **`test_ingestion_idempotence`**: Verifica que enviar exactamente el mismo lote dos veces no genere duplicados en la base de datos (0 duplicadas en el primer envío, 100% detectadas como duplicadas en el segundo).
- **`test_ingestion_payload_validation_errors`**: Verifica el rechazo con código 400 ante payloads no JSON, omisión de `astronaut_id`, inyección SQL en el identificador o lotes que exceden las 500 muestras.
- **`test_mixed_batch_fault_tolerance`**: Verifica que un lote con lecturas válidas e inválidas procese las válidas y reporte las inválidas en `"invalidas": N` sin abortar el lote.
- **`test_sensor_fault_handling`**: Verifica que lecturas con `calidad = 'sensor_fault'` se almacenen para diagnóstico pero no disparen alertas médicas.

### 2.2 `tests/test_astronauts.py` (Estado y Tripulantes)
- **`test_list_astronauts_and_status_calculation`**: Verifica la transición de conectividad (`offline` -> `online`) y del estado clínico consolidado (`normal` -> `critical`).
- **`test_astronaut_status_contract`**: Valida que el endpoint principal `/api/astronauts/<id>/status` devuelva exactamente todas las claves y formatos del contrato requerido.
- **`test_astronaut_readings_history_and_filters`**: Valida el filtrado del histórico de telemetría por variable (`heart_rate`), ventana de horas y límite de registros.
- **`test_astronaut_notes_flow_and_sanitization`**: Verifica la creación y consulta de notas clínicas, demostrando que etiquetas `<script>` se escapan como `&lt;script&gt;`.

### 2.3 `tests/test_alerts.py` (Motor Clínico y Reglas)
- **`test_absolute_rules_all_thresholds`**: Verifica la generación de alertas para los 8 umbrales absolutos (críticos y de advertencia para FC, SpO2, temperatura y radiación).
- **`test_deviation_rule_requires_50_samples`**: Demuestra que valores atípicos con Z > 4 NO disparan alertas si la variable tiene menos de 50 muestras en la línea base.
- **`test_deviation_rule_triggers_with_at_least_50_samples`**: Verifica el disparo de alertas `warning` (Z > 2) y `critical` (Z > 4) cuando existen >= 50 muestras consolidadas.
- **`test_alert_acknowledgement_flow`**: Verifica que el endpoint `/api/alerts/<id>/acknowledge` marque la alerta como confirmada y que el estado general del astronauta retorne a `normal`.

### 2.4 `tests/test_security.py` (Defensa Perimetral)
- **`test_authentication_enforcement`**: Valida que peticiones sin API Key o con claves falsas retornen 401, mientras que `/api/health` permanezca accesible.
- **`test_revoked_api_key`**: Verifica que revocar una clave (`activa = 0`) bloquee de inmediato el acceso con 401.
- **`test_rate_limiting_enforcement`**: Verifica que sobrepasar las 100 peticiones en la ventana deslizante retorne 429 con cabecera `Retry-After`.
- **`test_security_headers_presence`**: Comprueba la inyección de `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy` y `Cache-Control`.
- **`test_sql_injection_resistance`**: Valida que cargas maliciosas de escape SQL sean neutralizadas por los validadores.
- **`test_api_keys_are_never_stored_in_plaintext`**: Inspecciona la base de datos para certificar que solo se almacenen resúmenes SHA-256.

---

## 3. Limitaciones Conocidas de las Pruebas

- **Concurrencia Física Extrema**: Las pruebas se ejecutan en un entorno de prueba secuencial; no simulan 100 hilos escribiendo simultáneamente al archivo SQLite (aunque la lógica de WAL y reintentos transaccionales está testeada).
- **Desincronización de Hardware**: Se prueban desfases temporales mediante mocks y fixtures, pero no variaciones de latencia en la capa física de radiofrecuencia del traje espacial.

---

## 4. Plantilla para Agregar Nuevas Pruebas

Para agregar una nueva prueba unitaria o de integración, añade una función en el módulo correspondiente siguiendo este patrón:

```python
"""
Plantilla de Prueba para ASTRA HEALTH.
"""
from typing import Dict
from flask.testing import FlaskClient

def test_nueva_funcionalidad(client: FlaskClient, auth_headers: Dict[str, str]) -> None:
    # 1. Preparación del payload o estado
    payload = {
        "astronaut_id": "astro-01",
        "readings": [
            {"ts": 1712345678, "variable": "heart_rate", "value": 75, "quality": "ok"}
        ]
    }
    
    # 2. Ejecución de la solicitud HTTP mediante el cliente de prueba
    response = client.post("/api/readings", json=payload, headers=auth_headers)
    
    # 3. Aserciones de estado y contenido
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"
```

---

## 5. Cómo Interpretar Fallos

- **`AssertionError: assert 401 == 200`**: La prueba falló en la autenticación. Verifica que el fixture `auth_headers` esté inyectando una clave debidamente persistida en la base de datos de pruebas.
- **`AssertionError: assert data["duplicadas"] == 0`**: La base de datos temporal no fue limpiada adecuadamente o el timestamp de prueba coincide con una lectura previa.
- **`sqlite3.OperationalError: no such table`**: El esquema `schema.sql` no se ejecutó en la base de datos temporal. Asegúrate de invocar `init_db(db_path=path)`.
