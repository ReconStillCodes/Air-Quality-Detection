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
// TELEGRAM BOT CONFIGURATION using @BotFather
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

// Setup for Network Time Protocol (NTP)
const long utcOffsetInSeconds = 25200; // UTC+7 for WIB (7 hours * 3600 seconds)
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

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 32
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ----------------------------------
// GLOBAL VARIABLES & CONSTANTS
// ----------------------------------
const float TEMP_THRESHOLD = 27.00;
const float R0_CALIBRATED = 2.4599; // R0 that have been obtained previously from calibration through 'mq7_calibration.ino'

// Variables for timing sensor reads without blocking
unsigned long previousMillis = 0;
const long sensorReadInterval = 5000; // Read sensors every 5 seconds

// Variables for smart alert timing
const unsigned long ALERT_COOLDOWN = 30000; // 30 seconds in milliseconds
unsigned long lastAlertTime = 0;

// ----------------------------------
// SETUP FUNCTION - Runs once
// ----------------------------------
void setup() {
  Serial.begin(115200);
  clientSecure.setInsecure(); // Telegram HTTPS Connection
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  dht.begin();

  // Initialize OLED display
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for (;;); // Don't proceed, loop forever
  }
  
  // --- Animated Boot Screen ---
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

  // Connect to Wi-Fi
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
  // --- End of Boot Screen ---
  
  timeClient.begin();
}

// ----------------------------------
// MAIN LOOP - Runs repeatedly
// ----------------------------------
void loop() {
  timeClient.update();

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= sensorReadInterval) {
    previousMillis = currentMillis;
    processSensorData();
  }
}

// ----------------------------------
// CUSTOM FUNCTIONS
// ----------------------------------

/**
 * @brief Calculates the PPM of CO from the raw analog sensor value.
 * This formula is explained on the documentation/report
 */
float getPPM(int rawValue) {
  float sensor_volt = (float)rawValue / 1023.0 * 5.0;
  float RS_gas = (5.0 - sensor_volt) / sensor_volt;
  float ratio = RS_gas / R0_CALIBRATED;
  float ppm = 100.0 * pow(ratio, -1.521);
  return ppm;
}

/**
 * @brief NEW: Sends sensor data to the web server via HTTP POST.
 */
void sendDataToServer(float temp, float hum, float coPPM) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    // Server endpoint
    http.begin(client, "http://52.77.118.58/api/data");
    http.addHeader("Content-Type", "application/json");

    // Create JSON object
    StaticJsonDocument<200> doc;
    doc["temperature"] = temp;
    doc["humidity"] = hum;
    float coPPM_rounded = round(coPPM * 100.0) / 100.0; // Rounded to 2 decimal value
    doc["co"] = coPPM_rounded;

    // Serialize JSON to string
    String jsonPayload;
    serializeJson(doc, jsonPayload);

    // Send the POST request
    Serial.println("\nSending data to server...");
    Serial.println(jsonPayload);
    int httpResponseCode = http.POST(jsonPayload);

    // Check the response
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      Serial.print("Response from server: ");
      Serial.println(response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("WiFi Disconnected. Cannot send data.");
  }
}

/**
 * @brief Reads all sensors and triggers other functions.
 */
void processSensorData() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int coValue = analogRead(MQ7_PIN);
  float coPPM = getPPM(coValue);

  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // Print to Serial Monitor for debugging
  Serial.print("Time: "); Serial.print(timeClient.getFormattedTime());
  Serial.print(", Temp: "); Serial.print(t);
  Serial.print(" *C, Humi: "); Serial.print(h);
  Serial.print(" %, CO PPM: "); Serial.println(coPPM);

  // --- Send data to the server ---
  sendDataToServer(t, h, coPPM);

  // Check for local alerts
  checkAlerts(t, h, coPPM);
}

/**
 * @brief Checks for alerts and handles display logic.
 */
void checkAlerts(float temp, float hum, float coPPM) {
  if (temp >= TEMP_THRESHOLD && (millis() - lastAlertTime > ALERT_COOLDOWN)) {
    lastAlertTime = millis();
    sendTelegramAlert(temp, hum, coPPM);
    runAlertSequence(temp);
  }
  
  updateDisplayNormal(temp, hum, coPPM);
}

/**
 * @brief Updates the OLED with standard sensor data.
 */
void updateDisplayNormal(float temp, float hum, float coPPM) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);

  display.setCursor(0, 0);
  display.print("Temp: ");
  display.print(temp, 2);
  display.print(" C");

  display.setCursor(0, 8);
  display.print("Humi: ");
  display.print(hum, 0);
  display.print(" %");
  
  display.setCursor(0, 16);
  display.print("CO:   ");
  display.print(coPPM, 2);
  display.print(" ppm");

  display.setCursor(0, 24);
  display.print("Time:  ");
  display.print(timeClient.getFormattedTime());

  display.display();
}

/**
 * @brief Updates the OLED with a "HOT!" alert message,
 * now including warning triangle symbols.
 */
void updateDisplayDanger(float temp) {
  display.clearDisplay();

  display.drawTriangle(20, 1, 13, 15, 27, 15, WHITE);
  display.drawTriangle(108, 1, 101, 15, 115, 15, WHITE);
  
  display.setTextSize(2);
  display.setTextColor(WHITE);
  display.setCursor(43, 0);
  display.print("HOT!");
  
  display.setTextSize(1);
  display.setCursor(19, 20);
  display.print(temp, 2);
  display.print("C > ");
  display.print(TEMP_THRESHOLD, 2);
  display.print("C");
  
  display.display();
}

/**
 * @brief Runs the full 8-second visual and audible alert sequence.
 */
void runAlertSequence(float temp) {
  long sequenceStartTime = millis();

  // Part 1: Animated "DANGER!" with buzzer for 3 seconds
  while (millis() - sequenceStartTime < 3000) {
    display.clearDisplay();
    display.setTextSize(2);
    display.setCursor(22, 8);
    display.print("DANGER!");
    display.display();
    tone(BUZZER_PIN, 600, 100);
    delay(150);

    display.clearDisplay();
    for(int i=0; i < SCREEN_WIDTH; i+=4) {
      display.drawLine(i, 0, i, SCREEN_HEIGHT, WHITE);
    }
    display.display();
    tone(BUZZER_PIN, 1200, 100);
    delay(150);
  }

  // Part 2: Static "HOT!" screen for the last 5 seconds (no buzzer)
  while (millis() - sequenceStartTime < 8000) {
    updateDisplayDanger(temp);
  }
  
  noTone(BUZZER_PIN);
}

/**
 * @brief NEW: Composes and sends a high-temperature alert to Telegram.
 */
void sendTelegramAlert(float temp, float hum, float coPPM) {
  // Construct the message
  String message = "🔥 *Hot Temperature Alert!* 🔥\n\n";
  message += "A high temperature event has been detected.\n\n";
  message += "🌡️ *Temperature:* " + String(temp, 2) + " °C\n";
  message += "💧 *Humidity:* " + String(hum, 0) + " %\n";
  message += "💨 *CO Level:* " + String(coPPM, 2) + " ppm\n";
  message += "🕒 *Timestamp:* " + timeClient.getFormattedTime();

  // Send the message
  Serial.println("Sending Telegram alert...");
  if (bot.sendMessage(CHAT_ID, message, "Markdown")) {
    Serial.println("Telegram alert sent successfully!");
  } else {
    Serial.println("Failed to send Telegram alert.");
  }
}