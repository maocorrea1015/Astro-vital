#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

// ==========================================
// CONFIGURACIÓN DE RED Y CREDENCIALES
// ==========================================
const char* WIFI_SSID     = "TU_SSID_WIFI";
const char* WIFI_PASSWORD = "TU_PASSWORD_WIFI";

// Dirección del backend y token generado mediante python generate_api_key.py --name "esp32-suit"
const char* BACKEND_URL   = "http://192.168.1.100:5000/api/readings";
const char* API_KEY       = "TU_API_KEY_AQUI";
const char* ASTRONAUT_ID  = "astro-01";

// Servidor NTP para sincronizar la marca de tiempo UNIX en UTC
const char* NTP_SERVER    = "pool.ntp.org";
const long  gmtOffset_sec = 0;       // UTC estricto para evitar desfases temporales
const int   daylightOffset_sec = 0;

// Configuración de pines o estados de sensores (ejemplo para pines de expansión/actuadores)
const int LED_STATUS_PIN  = 2;       // LED integrado del ESP32 para estatus de conexión

// Variables de control de tiempo para envío periódico (cada 5 segundos)
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 5000; 

// ==========================================
// FUNCIÓN DE SINCRONIZACIÓN DE TIEMPO UNIX
// ==========================================
unsigned long getUnixTime() {
    time_t now;
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        return 0; // Retorna 0 si el reloj aún no está sincronizado
    }
    time(&now);
    return (unsigned long)now;
}

void setup() {
    Serial.begin(115200);
    pinMode(LED_STATUS_PIN, OUTPUT);
    digitalWrite(LED_STATUS_PIN, LOW);

    // 1. Conexión Wi-Fi
    Serial.printf("\n[ASTRA-VITAL] Conectando a Wi-Fi: %s\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    unsigned long wifiStartAttempt = millis();
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        // Timeout de seguridad si no conecta en 30 segundos
        if (millis() - wifiStartAttempt > 30000) {
            Serial.println("\n[Error] No se pudo conectar a Wi-Fi. Reiniciando módulo...");
            ESP.restart();
        }
    }
    Serial.println("\n[ASTRA-VITAL] ¡Conectado a Wi-Fi exitosamente!");
    digitalWrite(LED_STATUS_PIN, HIGH); // LED encendido indica red OK

    // 2. Sincronización de Reloj por NTP (Crítico para evitar rechazo 400 por timestamp futuro o desfasado)
    Serial.println("[ASTRA-VITAL] Sincronizando reloj NTP (UTC)...");
    configTime(gmtOffset_sec, daylightOffset_sec, NTP_SERVER);
    
    unsigned long ntpStartAttempt = millis();
    while (getUnixTime() == 0) {
        Serial.print(".");
        delay(1000);
        if (millis() - ntpStartAttempt > 15000) {
            Serial.println("\n[Advertencia] Sincronización NTP lenta, se reintentará en el loop.");
            break;
        }
    }
    Serial.println("\n[ASTRA-VITAL] Sincronización inicial completada.");
}

void loop() {
    // Verificar estado de la red Wi-Fi de forma continua
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[Advertencia] Conexión Wi-Fi perdida. Reconectando...");
        digitalWrite(LED_STATUS_PIN, LOW);
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        delay(5000);
        return;
    } else {
        digitalWrite(LED_STATUS_PIN, HIGH);
    }

    // Gestionar intervalo de envío sin bloquear el hilo principal (Non-blocking delay)
    if (millis() - lastSendTime >= sendInterval) {
        lastSendTime = millis();

        unsigned long currentTs = getUnixTime();
        if (currentTs == 0) {
            Serial.println("[Error] Reloj no sincronizado aún (Timestamp inválido). Omitiendo ciclo.");
            return;
        }

        // ==========================================
        // ADQUISICIÓN DE SENSORES (Simulación / Lectura física)
        // ==========================================
        // En una implementación real, aquí leerías el MAX30102, AD8232, SHT31, etc.
        float heartRate     = 78.5;  // Variable: "heart_rate" (Rango: 0.0 - 300.0)
        float spo2          = 98.0;  // Variable: "spo2" (Rango: 0.0 - 100.0)
        float temperature   = 36.6;  // Variable: "temperature" (Rango: 25.0 - 45.0)
        float radiationCpm  = 12.4;  // Variable: "radiation_cpm" (Rango: 0.0 - 10000.0)
        float activityVal   = 15.2;  // Variable: "activity" (Rango: 0.0 - 1000.0)

        // ==========================================
        // CONSTRUCCIÓN DEL PAYLOAD JSON (ArduinoJson v6/v7)
        // ==========================================
        // Usamos memoria dinámica estricta acorde al tamaño del lote
        StaticJsonDocument<1024> doc;
        doc["astronaut_id"] = ASTRONAUT_ID;
        
        JsonArray readings = doc.createNestedArray("readings");

        // 1. Frecuencia Cardíaca (MAX30102 / AD8232)
        JsonObject r1 = readings.createNestedObject();
        r1["ts"] = currentTs;
        r1["variable"] = "heart_rate";
        r1["value"] = heartRate;
        r1["quality"] = "ok";  // Cambiar a "sensor_fault" si el sensor falla para evitar falsas alarmas

        // 2. Saturación de Oxígeno (MAX30102)
        JsonObject r2 = readings.createNestedObject();
        r2["ts"] = currentTs;
        r2["variable"] = "spo2";
        r2["value"] = spo2;
        r2["quality"] = "ok";

        // 3. Temperatura Corporal (MLX90614)
        JsonObject r3 = readings.createNestedObject();
        r3["ts"] = currentTs;
        r3["variable"] = "temperature";
        r3["value"] = temperature;
        r3["quality"] = "ok";

        // 4. Radiación Ionizante (Contador Geiger)
        JsonObject r4 = readings.createNestedObject();
        r4["ts"] = currentTs;
        r4["variable"] = "radiation_cpm";
        r4["value"] = radiationCpm;
        r4["quality"] = "ok";

        // 5. Aceleración / Actividad (MPU6050)
        JsonObject r5 = readings.createNestedObject();
        r5["ts"] = currentTs;
        r5["variable"] = "activity";
        r5["value"] = activityVal;
        r5["quality"] = "ok";

        String jsonPayload;
        serializeJson(doc, jsonPayload);

        // ==========================================
        // TRANSMISIÓN HTTP POST AL BACKEND
        // ==========================================
        HTTPClient http;
        http.begin(BACKEND_URL);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("X-API-Key", API_KEY);

        // Opcional: Configurar timeouts de conexión HTTP
        http.setTimeout(4000);

        int httpResponseCode = http.POST(jsonPayload);

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.printf("[HTTP Envíos] Código: %d | Respuesta: %s\n", httpResponseCode, response.c_str());
            
            if (httpResponseCode == 429) {
                Serial.println("[Alerta Rate Limit] Demasiadas peticiones. Espere antes de reintentar.");
            }
        } else {
            Serial.printf("[Error HTTP] Fallo en la transmisión: %s\n", http.errorToString(httpResponseCode).c_str());
        }
        
        http.end();
    }
}