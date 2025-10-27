# Real-Time AIoT Air Quality Monitoring & Control System

<p align="center">
  <img src="Project-Showcase-Assg2.jpg" width="350">
</p>

A comprehensive, AI-driven IoT solution for monitoring and actively responding to real-time air quality. This system, an evolution of a previous prototype, uses an ESP8266 to send sensor data (CO, Temp, Hum) to a cloud backend for AI classification. It receives a quality (Good, Moderate, Poor, Hazardous) and control_status (on, off, auto), enabling a closed-loop system that intelligently manages local alerts and an automated fan to improve air quality.

---

## ✨ Features

-   **Real-Time Monitoring**: Continuously measures CO concentration, ambient temperature, and relative humidity.
-   **AI-Driven Alerts:** Replaces local thresholds with cloud-based AI classification. The OLED display and buzzer now have four distinct feedback levels (Good, Moderate, Poor, Hazardous).
-   **Active Actuator Control:** An automated mini-fan (controlled by a 3.3V relay) responds to the AI's classification to improve air quality, demonstrating a complete "sense, decide, act" IoT loop.
-   **Remote Web Dashboard**: A user-friendly web interface allows for manual control of the fan (On, Off, Auto), displays live data, and read trend analytics.
-   **Telegram Notifications**: Automatically sends alert messages to a designated Telegram chat when hazardous conditions are detected, enabling swift remote warnings.
-   **Cloud Integration:** Leverages AWS for robust backend data processing, AI model inference, and hosting.

---

## 🏗️ System Architecture

The project is built on the standard Three-Layer IoT Architecture:

1.  **Perception Layer:** The physical layer consisting of the ESP8266 microcontroller, DHT11 sensor, MQ-7 sensor, OLED display, buzzer, 5V DC Fan, and a 3.3V relay module.
2.  **Network Layer:** Utilizes the ESP8266's built-in Wi-Fi to send sensor data as JSON payloads to the backend via HTTP POST requests and receive a JSON response.
3.  **Application Layer:** A cloud-based backend built with Python (Flask) running on AWS EC2 processes incoming data, runs it through an AI Classification Model, and stores the results. A React frontend visualizes data and provides user control.

---

## 🛠️ Tech Stack & Hardware

**Hardware Components:**
-   ESP8266 (NodeMCU) Microcontroller
-   MQ-7 Carbon Monoxide Sensor
-   DHT11 Temperature & Humidity Sensor
-   0.91" OLED Display (128x32)
-   Piezoelectric Buzzer
-   5V DC Fan (Mini-Fan)
-   3.3V 1-Channel LOW Level Trigger Relay Module
-   4.5V Battery Pack (for fan circuit)
-   Breadboard and Jumper Wires

**Software & Cloud Services:**
-   **IoT Firmware**: Arduino IDE (C++)
-   **Backend**: Python, Flask, AI Model
-   **Frontend**: JavaScript, React.js
-   **Cloud**: AWS EC2 (for backend hosting) & AWS S3 (for data storage and frontend hosting)
-   **Notifications**: Telegram Bot API

---

## 🚀 Getting Started: IoT Device Setup

This repository contains two primary firmware files for the ESP8266: one for calibration and one for main operation.

### Part 1: Calibrating the MQ-7 Sensor (See Main Branch)

A one-time calibration is **required** to establish the sensor's baseline resistance ($R_0$) in clean air.

1.  **Open the Calibration Code**: Load the `mq7_calibration.ino` file into your Arduino IDE.
2.  **Place the Sensor**: Put the MQ-7 sensor in a well-ventilated area with clean air (e.g., near an open window).
3.  **Upload the Sketch**: Upload the code to your ESP8266.
4.  **Monitor Calibration**: Open the Serial Monitor (baud rate `115200`). The device will first warm up for 3 minutes, then collect data for 5 minutes.
5.  **Get the R0 Value**: Once complete, the Serial Monitor will display the final calibrated `R0` value. **Copy this value.**

### Part 2: Main Monitoring Firmware

1.  **Open the Main Code**: Load the `IoT_airQuality_assg2.ino` file into your Arduino IDE.
2.  **Update Wi-Fi Credentials**: Change the `ssid` and `pass` variables to your Wi-Fi network's name and password.
    ```cpp
    char ssid[] = "YOUR_WIFI_NAME";
    char pass[] = "YOUR_WIFI_PASSWORD";
    ```
3.  **Update Calibrated R0 Value**: Find the `R0_CALIBRATED` constant and paste the value you obtained from the calibration step.
    ```cpp
    const float R0_CALIBRATED = 2.4599; // <-- PASTE YOUR VALUE HERE
    ```
4.  **Update Telegram Bot**: If you want to use your own Telegram bot, update the `BOT_TOKEN` and `CHAT_ID`.
5.  **Upload and Run**: Upload the sketch to your ESP8266. The device will boot up, connect to Wi-Fi, and begin sending data to the server.

---

## 📡 API Endpoints

The backend is hosted at `http://52.77.118.58`. The following endpoints are available for interacting with the system.

| Description | HTTP Method | Endpoint | Payload / Parameters |
| :--- | :--- | :--- | :--- |
| **Post Sensor Data** | `POST` | `/api/data` | **Body**: `{ "temperature": float, "humidity": float, "co": float }` |
| **Get Chart Data** | `GET` | `/api/data/chart` | **Query**: None. Returns the last 20 data points. |
| **Get Table Data** | `GET` | `/data/table` | **Query**: `?page=<int>&size=<int>` (e.g., `?page=1&size=20`) |

#### Example cURL Usage:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"temperature": 25.5, "humidity": 60.2, "co": 15.7}' \
  [http://52.77.118.58/api/data](http://52.77.118.58/api/data)
```

---

#### Example JSON Response:
The ESP8266 receives a JSON object from the server in response to the POST request. This response drives all actuator logic.
```bash
{
  "message": "Saved & emitted",
  "quality": "Hazardous",
  "control_status": "auto"
}
```
- quality: (String) The AI classification. Can be "Good", "Moderate", "Poor", "Hazardous", or "Waiting...".
- control_status: (String) The fan control mode set by the user. Can be "on", "off", or "auto".

---

## 👥 Contributors

This project was developed by Group 6, Class LCE1:
- Axel Nino Nakata (2702749701)
- Michael Matthew Muliawan (2702749834)
- Samantha Michelle (2702749752)
