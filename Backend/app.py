"""
Punto de Entrada y Factoría de la Aplicación Flask para ASTRA HEALTH Backend.

Propósito:
    Implementa el patrón Application Factory (create_app) para configurar e instanciar
    el servidor de la API REST de ASTRA HEALTH.
    Integra control de CORS, endurecimiento de seguridad perimetral, registro estructurado,
    manejadores globales de errores, inicialización de base de datos y blueprints modulares.

Autor: Equipo de Ingeniería de ASTRA HEALTH
Versión: 1.0.0
Dependencias: flask, flask_cors, config, database, logging_config, security, routes
Advertencias de seguridad:
    - Las trazas de error internas jamás se exponen en las respuestas HTTP hacia los clientes.
    - El endpoint /api/health es el único accesible sin autenticación por API Key.
"""

import os
from typing import Any, Dict, Optional
from flask import Flask, jsonify, Response
from flask_cors import CORS

from config import get_config, Config
from database import init_db, close_db_connection
from logging_config import setup_logging
from security import register_security_headers
from routes import readings_bp, astronauts_bp, alerts_bp, notes_bp


def create_app(
    config_name: Optional[str] = None,
    config_override: Optional[Dict[str, Any]] = None,
) -> Flask:
    """Crea y configura una instancia de la aplicación web Flask (Application Factory).

    Args:
        config_name (Optional[str]): Nombre del entorno ('development', 'testing', 'production').
        config_override (Optional[Dict[str, Any]]): Diccionario de configuraciones para sobreescribir.

    Returns:
        Flask: Instancia completamente inicializada y lista para recibir solicitudes.

    Example:
        >>> app = create_app("testing")
        >>> client = app.test_client()
        >>> res = client.get("/api/health")
        >>> res.status_code
        200

    Security Note:
        Todos los manejadores de error capturan excepciones inesperadas y devuelven respuestas
        JSON estandarizadas sin filtrar volcados de memoria ni detalles de arquitectura interna.
    """
    app = Flask(__name__)

    # 1. Carga de configuración base y sobreescrituras
    config_class = get_config(config_name)
    app.config.from_object(config_class)

    if config_override:
        app.config.update(config_override)

    # 2. Configuración de CORS para permitir consumo seguro desde la app de Raspberry Pi
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # 3. Inicialización del subsistema de logging
    logger = setup_logging(app)

    # 4. Inicialización de la base de datos relacional SQLite
    with app.app_context():
        try:
            init_db(app.config["DATABASE_PATH"])
            logger.info(f"Base de datos inicializada en: {app.config['DATABASE_PATH']}")
        except Exception as exc:
            logger.error(f"Fallo crítico al inicializar la base de datos: {exc}", exc_info=True)
            if not app.config.get("TESTING", False):
                raise

    # 5. Registro de cabeceras de seguridad HTTP
    register_security_headers(app)

    # 6. Limpieza de conexiones de base de datos al finalizar cada contexto de solicitud
    app.teardown_appcontext(close_db_connection)

    # 7. Endpoint público de Healthcheck
    @app.route("/api/health", methods=["GET"])
    def health_check() -> Response:
        """Endpoint público de comprobación de salud del servicio.

        Returns:
            Response: JSON con confirmación del servicio activo {"status": "ok", "service": "astra-health-backend"}.
        """
        return jsonify({
            "status": "ok",
            "service": "astra-health-backend",
        }), 200

    # 8. Registro de Blueprints de rutas funcionales
    app.register_blueprint(readings_bp)
    app.register_blueprint(astronauts_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(notes_bp)

    # 9. Manejadores globales de errores HTTP
    @app.errorhandler(400)
    def handle_bad_request(error: Any) -> Response:
        msg = getattr(error, "description", "Solicitud malformada o parámetros inválidos")
        return jsonify({"error": msg}), 400

    @app.errorhandler(401)
    def handle_unauthorized(error: Any) -> Response:
        return jsonify({"error": "API key inválida o ausente"}), 401

    @app.errorhandler(403)
    def handle_forbidden(error: Any) -> Response:
        msg = getattr(error, "description", "Acceso denegado: permisos insuficientes")
        return jsonify({"error": msg}), 403

    @app.errorhandler(404)
    def handle_not_found(error: Any) -> Response:
        return jsonify({"error": "Recurso no encontrado"}), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(error: Any) -> Response:
        return jsonify({"error": "Método HTTP no permitido"}), 405

    @app.errorhandler(429)
    def handle_too_many_requests(error: Any) -> Response:
        return jsonify({"error": "Rate limit excedido"}), 429

    @app.errorhandler(500)
    def handle_internal_server_error(error: Any) -> Response:
        # Se registra la traza completa internamente en logs para diagnóstico
        app.logger.error(f"Error interno no controlado: {error}", exc_info=True)
        # Seguridad: Al cliente solo se le entrega un mensaje genérico sin filtrar el stack trace
        return jsonify({"error": "Error interno del servidor"}), 500

    @app.errorhandler(Exception)
    def handle_unexpected_exception(error: Any) -> Response:
        app.logger.error(f"Excepción inesperada capturada en runtime: {error}", exc_info=True)
        return jsonify({"error": "Error interno del servidor"}), 500

    return app


if __name__ == "__main__":
    application = create_app()
    host = application.config.get("HOST", "0.0.0.0")
    port = application.config.get("PORT", 5000)
    application.logger.info(f"Iniciando ASTRA HEALTH Backend en http://{host}:{port}")
    application.run(host=host, port=port, debug=application.config.get("DEBUG", False))
