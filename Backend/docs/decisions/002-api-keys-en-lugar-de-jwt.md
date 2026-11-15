# ADR 002: Autenticación con API Keys Hasheadas en Lugar de JWT

- **Fecha**: 2026-11-14
- **Estado**: Aceptado

## Contexto
Los clientes del backend son componentes de hardware y software cerrados: un microcontrolador ESP32 integrado en el traje espacial y una aplicación táctil en Raspberry Pi. Se requería un esquema de autenticación perimetral robusto, simple y seguro para un sistema que opera estrictamente fuera de línea.

## Decisión
Se decidió implementar **API Keys criptográficas de alta entropía** (32 bytes urlsafe) transmitidas en el header `X-API-Key`, almacenadas en base de datos mediante su resumen **SHA-256**.

## Alternativas Consideradas
1. **JSON Web Tokens (JWT)**:
   - *Por qué se descartó*: JWT requiere sincronización de relojes entre clientes y servidores para validar el tiempo de expiración (`exp`), emisión de refresh tokens y manejo de rotación de claves criptográficas asimétricas. Si el RTC del ESP32 se desfasa por batería baja, los tokens expirarían prematuramente, interrumpiendo la telemetría vital.
2. **Autenticación Básica HTTP (Usuario / Contraseña)**:
   - *Por qué se descartó*: Los dispositivos de hardware no deben gestionar contraseñas memorizables por humanos ni sufrir ataques de diccionario.
3. **mTLS (Mutual TLS)**:
   - *Por qué se descartó*: Aunque ofrece la máxima seguridad, introduce una sobrecarga considerable de gestión de certificados X.509 y complejidad de negociación criptográfica para microcontroladores en una demo local fuera de línea.

## Consecuencias
### Ventajas:
- **Simplicidad y robustez para hardware embebido**: El ESP32 solo necesita inyectar una cabecera estática en sus peticiones HTTP.
- **Revocación inmediata**: Al consultar el hash en la tabla `api_keys` con la bandera `activa = 1`, una clave comprometida puede revocarse en tiempo real sin esperar a que expire un token.
- **Seguridad en reposo**: Las claves nunca se almacenan en texto plano en la base de datos.

### Desventajas y Riesgos:
- **Sin expiración temporal automática**: A menos que un operador revoque la clave, permanece válida indefinidamente.
- **Vulnerabilidad ante espionaje de red**: Si no se utiliza TLS en la capa física, la clave viaja visible en texto plano en la cabecera HTTP.

## Referencias
- OWASP API Security Top 10: API2:2023 Broken Authentication.
- RFC 7519: JSON Web Token (JWT) Limitations in IoT.
