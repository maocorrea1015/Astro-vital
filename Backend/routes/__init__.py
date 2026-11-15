"""
Módulo de Enrutamiento y Controladores HTTP para ASTRA HEALTH Backend.

Propósito:
    Agrupa y exporta los Blueprints de Flask correspondientes a los módulos de:
    - Ingesta de telemetría de sensores (readings_bp)
    - Estado consolidado y astronautas (astronauts_bp)
    - Gestión de alertas y confirmación médica (alerts_bp)
    - Bitácora de notas clínicas del astronauta (notes_bp)

Autor: Equipo de Ingeniería de ASTRA HEALTH
Versión: 1.0.0
"""

from .readings import readings_bp
from .astronauts import astronauts_bp
from .alerts import alerts_bp
from .notes import notes_bp

__all__ = ["readings_bp", "astronauts_bp", "alerts_bp", "notes_bp"]
