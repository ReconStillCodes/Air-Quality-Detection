// ----------------------------------
// LIBRARIES
// ----------------------------------
#include <ESP8266WiFi.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <TimeLib.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>

// ----------------------------------
// TELEGRAM BOT CONFIGURATION
// ----------------------------------
#define BOT_TOKEN "YOUR_BOT_TOKEN"
#define CHAT_ID "YOUR_CHAT_ID"
WiFiClientSecure clientSecure;
UniversalTelegramBot bot(BOT_TOKEN, clientSecure);

// ----------------------------------
// WIFI & TIME CONFIGURATION
// ----------------------------------
char ssid[] = "YOUR_WIFI_NAME";
char pass[] = "YOUR_WIFI_PASSWORD";
const long utcOffsetInSeconds = 25200;
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", utcOffsetInSeconds);

// ----------------------------------
// PIN & SENSOR CONFIGURATION
// ----------------------------------
#define DHTPIN D5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define MQ7_PIN A0
#define BUZZER_PIN D6
#define ACTUATOR_PIN D7 // Relay pin for fan

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 32
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ----------------------------------
// GLOBAL VARIABLES & CONSTANTS
// ----------------------------------
const float R0_CALIBRATED = 2.4599; // <-- PASTE YOUR OWN CALIBRATED VALUE

unsigned long previousSensorReadMillis = 0;
const long sensorReadInterval = 5000;

unsigned long previousScreenSwitchMillis = 0;
const long screenSwitchInterval = 7000;
bool showQualityScreen = false;

float lastTemp = 0.0, lastHum = 0.0, lastCO = 0.0;
String currentQuality = "Waiting...";
String currentControlStatus = "auto";

unsigned long lastTelegramAlertMillis = 0;
const long TELEGRAM_ALERT_COOLDOWN = 60000;

String activeAlertState = "NONE";
unsigned long alertStartTime = 0;
unsigned long lastBuzzerToggleTime = 0;
unsigned long lastDisplayBlinkTime = 0;
bool buzzerOn = false;
bool displayInverted = false;

// --- Actuator Control Variables ---
const long ACTUATOR_ON_DURATION = 10000; 
const long ACTUATOR_COOLDOWN = 30000; 
unsigned long lastActuatorOnTime = 0;
bool isActuatorOn = false;
unsigned long actuatorCooldownUntil = 0; // Timer to manage auto-mode cooldown

// ----------------------------------
// FORWARD DECLARATIONS
// ----------------------------------
void updateDisplay();
void updateDisplayNormal(float temp, float hum, float coPPM);
void updateDisplayQuality();
void handleAlerts(String quality);
void manageActiveAlerts();
void manageActuator();
void sendTelegramAlert(float temp, float hum, float coPPM);

// ----------------------------------
// SETUP FUNCTION
// ----------------------------------
void setup() {
    Serial.begin(115200);
    clientSecure.setInsecure();
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW); // Buzzer is active HIGH, so LOW is off
    
    // Setup Actuator Pin
    pinMode(ACTUATOR_PIN, OUTPUT);
    digitalWrite(ACTUATOR_PIN, HIGH); // Relay is Active LOW, so HIGH is OFF
    
    dht.begin();

    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println(F("SSD1306 allocation failed"));
        for (;;);
    }

    // --- Boot Screen ---
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(WHITE);
    display.setCursor(25, 2);
    display.print("System Booting...");
    display.drawRect(4, 18, 120, 10, WHITE);
    display.display();
    for (int i = 0; i < 118; i++) {
        display.fillRect(5, 19, i, 8, WHITE);
        display.display();
        delay(10);
    }
    delay(500);

    // --- WiFi Connection ---
    WiFi.begin(ssid, pass);
    Serial.print("Connecting to WiFi...");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println(" Connected!");

    display.clearDisplay();
    display.setTextSize(2);
    display.setCursor(30, 8);
    display.print("READY");
    display.display();
    delay(2000);
    
    timeClient.begin();
}

// ----------------------------------
// MAIN LOOP
// ----------------------------------
void loop() {
    timeClient.update();
    unsigned long currentMillis = millis();

    // Manage non-blocking alerts and animations
    manageActiveAlerts();
    
    // Manage the actuator based on control_status
    manageActuator();

    // Timer for sensor reading
    if (currentMillis - previousSensorReadMillis >= sensorReadInterval) {
        previousSensorReadMillis = currentMillis;
        processSensorData();
    }

    // Timer for screen switching
    if (currentMillis - previousScreenSwitchMillis >= screenSwitchInterval) {
        previousScreenSwitchMillis = currentMillis;
        showQualityScreen = !showQualityScreen;
    }
    
    // Always call updateDisplay to handle screen content and animations
    updateDisplay();
}

// ----------------------------------
// CUSTOM FUNCTIONS
// ----------------------------------
float getPPM(int rawValue) {
    float sensor_volt = (float)rawValue / 1023.0 * 5.0;
    float RS_gas = (5.0 - sensor_volt) / sensor_volt;
    float ratio = RS_gas / R0_CALIBRATED;
    return 100.0 * pow(ratio, -1.521);
}

void sendDataToServer(float temp, float hum, float coPPM) {
    if (WiFi.status() == WL_CONNECTED) {
        WiFiClient client;
        HTTPClient http;
        http.begin(client, "http://52.77.118.58/api/data");
        http.addHeader("Content-Type", "application/json");

        StaticJsonDocument<200> doc;
        doc["temperature"] = temp;
        doc["humidity"] = hum;
        doc["co"] = round(coPPM * 100.0) / 100.0;

        String jsonPayload;
        serializeJson(doc, jsonPayload);
        Serial.println("\nSending data to server...");
        Serial.println(jsonPayload);
        int httpResponseCode = http.POST(jsonPayload);

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.printf("HTTP Response: %d, %s\n", httpResponseCode, response.c_str());

            StaticJsonDocument<256> responseDoc;
            DeserializationError error = deserializeJson(responseDoc, response);

            if (error) {
                Serial.printf("deserializeJson() failed: %s\n", error.c_str());
                currentQuality = "Waiting..."; 
                currentControlStatus = "auto"; // Default to auto on error
                handleAlerts(currentQuality);
                return;
            }

            // Get Quality
            if (responseDoc.containsKey("quality") && !responseDoc["quality"].isNull()) {
                currentQuality = responseDoc["quality"].as<String>();
            } else {
                Serial.println("WARN: 'quality' key missing. Defaulting to Waiting...");
                currentQuality = "Waiting..."; 
            }
            
            // Get Control Status
            if (responseDoc.containsKey("control_status") && !responseDoc["control_status"].isNull()) {
                currentControlStatus = responseDoc["control_status"].as<String>();
            } else {
                Serial.println("WARN: 'control_status' key missing. Defaulting to auto.");
                currentControlStatus = "auto";
            }
            
            Serial.printf("Received Quality: %s, Control: %s\n", currentQuality.c_str(), currentControlStatus.c_str());
            
            handleAlerts(currentQuality); 
        } else {
            Serial.printf("Error on sending POST: %d\n", httpResponseCode);
            currentQuality = "Waiting..."; 
            currentControlStatus = "auto";
            handleAlerts(currentQuality);
        }
        http.end();
    }
}

void processSensorData() {
    delay(10);
    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (isnan(h) || isnan(t)) {
        Serial.println("Failed to read from DHT sensor!");
        return;
    }
    lastHum = h;
    lastTemp = t;
    lastCO = getPPM(analogRead(MQ7_PIN));
    Serial.printf("Time: %s, Temp: %.2f *C, Humi: %.0f %%, CO PPM: %.2f\n",
                  timeClient.getFormattedTime().c_str(), t, h, lastCO);
    sendDataToServer(t, h, lastCO);
}

void updateDisplay() {
    if (showQualityScreen) {
        updateDisplayQuality();
    } else {
        updateDisplayNormal(lastTemp, lastHum, lastCO);
    }
}

void updateDisplayNormal(float temp, float hum, float coPPM) {
    display.clearDisplay();
    display.invertDisplay(false);
    display.setTextSize(1);
    display.setTextColor(WHITE);
    char buffer[20];
    sprintf(buffer, "Temp: %.2f C", temp);
    display.setCursor(0, 0); display.print(buffer);
    sprintf(buffer, "Humi: %.0f %%", hum);
    display.setCursor(0, 8); display.print(buffer);
    sprintf(buffer, "CO:   %.2f ppm", coPPM);
    display.setCursor(0, 16); display.print(buffer);
    display.setCursor(0, 24);
    display.print("Time:  ");
    display.print(timeClient.getFormattedTime());
    display.display();
}

void updateDisplayQuality() {
    display.clearDisplay();
    display.setTextColor(WHITE);
    display.setTextSize(1);
    display.setCursor(28, 0);
    display.print("Air Quality");

    String qualityText;
    int16_t x1, y1;
    uint16_t w, h;

    if (currentQuality == "Good") {
        qualityText = "GOOD";
        display.setTextSize(2);
        display.getTextBounds(qualityText, 0, 0, &x1, &y1, &w, &h);
        display.setCursor((SCREEN_WIDTH - w) / 2, 14);
        display.print(qualityText);
        
        // Draw Smily Face
        display.drawCircle(22, 21, 6, WHITE);
        display.fillCircle(19, 19, 1, WHITE); 
        display.fillCircle(25, 19, 1, WHITE); 
        display.drawPixel(20, 24, WHITE); display.drawPixel(21, 25, WHITE); display.drawPixel(22, 25, WHITE); display.drawPixel(23, 25, WHITE); display.drawPixel(24, 24, WHITE);

        display.drawCircle(106, 21, 6, WHITE);
        display.fillCircle(103, 19, 1, WHITE);
        display.fillCircle(109, 19, 1, WHITE);
        display.drawPixel(104, 24, WHITE); display.drawPixel(105, 25, WHITE); display.drawPixel(106, 25, WHITE); display.drawPixel(107, 25, WHITE); display.drawPixel(108, 24, WHITE);

    } else if (currentQuality == "Moderate") {
        qualityText = "MODERATE";
        display.setTextSize(2);
        display.getTextBounds(qualityText, 0, 0, &x1, &y1, &w, &h);

        display.setCursor(16, 14); 
        display.print(qualityText);

        // Draw Flat Face
        display.drawCircle(6, 21, 6, WHITE);  
        display.fillCircle(3, 19, 1, WHITE);   
        display.fillCircle(9, 19, 1, WHITE);   
        display.drawFastHLine(4, 24, 5, WHITE); 

        display.drawCircle(121, 21, 6, WHITE); 
        display.fillCircle(118, 19, 1, WHITE); 
        display.fillCircle(124, 19, 1, WHITE); 
        display.drawFastHLine(119, 24, 5, WHITE); 

    } else if (currentQuality == "Poor") {
        qualityText = "POOR";
        display.setTextSize(2);
        display.getTextBounds(qualityText, 0, 0, &x1, &y1, &w, &h);
        display.setCursor((SCREEN_WIDTH - w) / 2, 14);
        display.print(qualityText);

        display.setTextSize(2);
        display.setCursor(15, 14); display.print("!");
        display.setCursor(105, 14); display.print("!");

    } else if (currentQuality == "Hazardous") {
        qualityText = "HAZARD";
        display.setTextSize(2);
        display.getTextBounds(qualityText, 0, 0, &x1, &y1, &w, &h);
        display.setCursor((SCREEN_WIDTH - w) / 2, 14);
        display.print(qualityText);

        display.drawTriangle(8, 16, 2, 28, 14, 28, WHITE);
        display.drawTriangle(120, 16, 114, 28, 126, 28, WHITE);

    } else {
        qualityText = currentQuality; 
        display.setTextSize(2);
        display.getTextBounds(qualityText, 0, 0, &x1, &y1, &w, &h);
        display.setCursor((SCREEN_WIDTH - w) / 2, 14);
        display.print(qualityText);
    }

    display.invertDisplay(displayInverted);
    display.display();
}

void handleAlerts(String quality) {
    String newState = "NONE";
    if (quality == "Poor") newState = "POOR";
    else if (quality == "Hazardous") newState = "HAZARDOUS";

    if (activeAlertState != newState) {
        activeAlertState = newState;
        alertStartTime = millis(); 
        Serial.printf("Alert state changed to: %s\n", newState.c_str());
        
        if (newState == "HAZARDOUS") {
            unsigned long currentMillis = millis();
            if (currentMillis - lastTelegramAlertMillis >= TELEGRAM_ALERT_COOLDOWN) {
                lastTelegramAlertMillis = currentMillis;
                sendTelegramAlert(lastTemp, lastHum, lastCO);
            }
        }
    }
}

void manageActiveAlerts() {
    if (!showQualityScreen) {
        if (buzzerOn) noTone(BUZZER_PIN);
        if (displayInverted) display.invertDisplay(false);
        buzzerOn = false;
        displayInverted = false;
        return; 
    }

    if (activeAlertState == "NONE") {
        displayInverted = false;
        return;
    }

    unsigned long currentMillis = millis();

    if (activeAlertState == "POOR") {
        if (currentMillis - alertStartTime > 3000) {
            handleAlerts("Good"); return;
        }
        if (currentMillis - lastBuzzerToggleTime > 400) {
            lastBuzzerToggleTime = currentMillis;
            buzzerOn = !buzzerOn;
            if (buzzerOn) tone(BUZZER_PIN, 1500, 150);
            else noTone(BUZZER_PIN);
        }
        if (currentMillis - lastDisplayBlinkTime > 300) {
            lastDisplayBlinkTime = currentMillis;
            displayInverted = !displayInverted;
        }
    } 
    else if (activeAlertState == "HAZARDOUS") {
        if (currentMillis - alertStartTime > 5000) {
            handleAlerts("Good"); return;
        }
        if (currentMillis - lastBuzzerToggleTime > 150) {
            lastBuzzerToggleTime = currentMillis;
            buzzerOn = !buzzerOn;
            if (buzzerOn) tone(BUZZER_PIN, 600, 100);
            else tone(BUZZER_PIN, 1200, 100);
        }
        if (currentMillis - lastDisplayBlinkTime > 80) {
            lastDisplayBlinkTime = currentMillis;
            displayInverted = !displayInverted;
        }
    }
}

void manageActuator() {
    if (currentControlStatus == "on") {
        // Manual ON: Turn relay ON (LOW)
        digitalWrite(ACTUATOR_PIN, LOW);
        isActuatorOn = true;
        actuatorCooldownUntil = 0; // Reset auto-mode timer
    } 
    else if (currentControlStatus == "off") {
        // Manual OFF: Turn relay OFF (HIGH)
        digitalWrite(ACTUATOR_PIN, HIGH);
        isActuatorOn = false;
        actuatorCooldownUntil = 0; // Reset auto-mode timer
    }
    else if (currentControlStatus == "auto") {
        // Auto Mode Logic
        unsigned long currentMillis = millis();

        if (isActuatorOn) {
            // Actuator is currently ON (in its 10-sec auto-cycle)
            if (currentMillis - lastActuatorOnTime > ACTUATOR_ON_DURATION) {
                digitalWrite(ACTUATOR_PIN, HIGH); // Turn OFF
                isActuatorOn = false;
                actuatorCooldownUntil = currentMillis + ACTUATOR_COOLDOWN; // Start 30s cooldown
                Serial.println("Auto-Actuator: OFF, starting 30s cooldown.");
            }
        } else {
            // Actuator is currently OFF
            if (currentMillis > actuatorCooldownUntil) {
                // Cooldown is over
                if (currentQuality == "Hazardous") {
                    digitalWrite(ACTUATOR_PIN, LOW); // Turn ON
                    isActuatorOn = true;
                    lastActuatorOnTime = currentMillis;
                    Serial.println("Auto-Actuator: Hazardous! Turning ON for 10s.");
                }
            }
        }
    }
}

void sendTelegramAlert(float temp, float hum, float coPPM) {
    String message = "🚨 *Hazardous Air Quality Alert!* 🚨\n\n";
    message += "A hazardous air quality event has been detected.\n\n";
    message += "🌡️ *Temperature:* " + String(temp, 1) + " C\n";
    message += "💧 *Humidity:* " + String(hum, 0) + " %\n";
    message += "💨 *CO Level:* " + String(coPPM, 2) + " ppm\n";
    message += "🕒 *Timestamp:* " + timeClient.getFormattedTime();
    Serial.println("Sending Telegram alert...");
    bot.sendMessage(CHAT_ID, message, "Markdown");
}
