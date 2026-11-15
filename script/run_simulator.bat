@echo off
title ASTRA-VITAL ESP32 Telemetry Simulator
echo ==============================================================================
echo Iniciando Simulador Telemétrico ESP32 para ASTRA HEALTH Backend...
echo ==============================================================================
python "%~dp0simulator.py" %*
pause
