from datetime import datetime
from collections import deque
from typing import Dict, Any, List, Tuple
import math
import csv
import os

import eventlet
eventlet.monkey_patch()  # Required for async with SocketIO

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO

from zoneinfo import ZoneInfo

# ==========================================================
# CONFIG 
# ==========================================================
WIB_TIMEZONE = ZoneInfo("Asia/Jakarta")
CSV_FILE_PATH = 'aiq-data.csv'

app = Flask(__name__, static_folder="../frontend/aiq/dist/")
CORS(app) 
app.config['SECRET_KEY'] = 'knphidupsusah'

# Initialize SocketIO for real-time communication
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet') 


# ==========================================================
# DATA MODEL
# ==========================================================


class SensorData:
    """A data class to hold and serialize sensor readings."""
    def __init__(self, temperature: float, humidity: float, co: float, timestamp: datetime, quality: str):
        self.temperature = temperature
        self.humidity = humidity
        self.co = co
        self.timestamp = timestamp
        self.quality = quality

    def to_dict(self) -> Dict[str, Any]:
        """Converts the object to a dictionary for JSON serialization."""
        return {
            "temperature": self.temperature,
            "humidity": self.humidity,
            "co": self.co,
            "timestamp": self.timestamp.isoformat(),
            "quality": self.quality
        }
    
# ==========================================================
# PROCESSING FUNCTIONS
# ==========================================================
    
def calculate_quality_using_temperature(temperature: float) -> str:
    if temperature < 27:
        return "Normal"
    else:
        return "Hot"
    
def is_buzzer_on(quality: str) -> bool:
    return quality != 'Normal'

def save_to_csv(filename: str, temperature: float, humidity: float, co: float, timestamp: datetime, quality: str) -> None:

    file_exists = os.path.exists(filename)
    headers = ["timestamp", "temperature", "humidity", "co", "quality"]

    row = [
        timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        str(temperature),
        str(humidity),
        str(co),
        quality,
    ]

    try:
        with open(filename, "a", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            if not file_exists:
                writer.writerow(headers)
                print(f"CSV created: {filename}")
            writer.writerow(row)
    except Exception as e:
        print(f"Error saving CSV: {e}")

def read_csv_with_pagination(filename: str, page: int, size: int = 20) -> Tuple[List[SensorData], int]:
    if page < 1 or size < 1:
        raise ValueError("Page and size must be > 0")

    try:
        with open(filename, "r", newline="", encoding="utf-8") as csvfile:
            reader = list(csv.DictReader(csvfile))

        total_records = len(reader)
        total_pages = math.ceil(total_records / size) if total_records else 0

        if total_records == 0 or page > total_pages:
            return [], total_pages

        start, end = (page - 1) * size, page * size
        items = [
            SensorData(
                float(r["temperature"]),
                float(r["humidity"]),
                float(r["co"]),
                datetime.strptime(r["timestamp"], "%Y-%m-%d %H:%M:%S"),
                r["quality"],
            )
            for r in reader[start:end]
        ]
        return items, total_pages

    except FileNotFoundError:
        return [], 0

def get_latest_data(filename: str, limit: int = 20) -> List[SensorData]:
    """Efficiently get latest N records from CSV."""
    latest = deque(maxlen=limit)
    try:
        with open(filename, "r", newline="", encoding="utf-8") as csvfile:
            for r in csv.DictReader(csvfile):
                try:
                    latest.append(
                        SensorData(
                            float(r["temperature"]),
                            float(r["humidity"]),
                            float(r["co"]),
                            datetime.strptime(r["timestamp"], "%Y-%m-%d %H:%M:%S"),
                            r["quality"],
                        )
                    )
                except Exception as e:
                    print(f"Skipping bad row {r}: {e}")
        return list(latest)
    except FileNotFoundError:
        return []

# ==========================================================
# ROUTES
# ==========================================================



@app.route('/', defaults={'path': ''})

@app.route('/<path:path>')
def serve(path):
    """Serve frontend build."""
    dist = "../frontend/aiq/dist"
    file_path = os.path.join(dist, path)
    return send_from_directory(dist, path if os.path.exists(file_path) else "index.html")

@app.route("/data", methods=["POST"])
def process_data():
    """Receive sensor data, save to CSV, emit via socket."""
    if not request.is_json:
        return jsonify({"error": "Request must be JSON", "isBuzzerOn": False}), 400

    data = request.get_json(silent=True) or {}
    temperature, humidity, co = data.get("temperature"), data.get("humidity"), data.get("co")

    if None in (temperature, humidity, co):
        return jsonify({"error": "Missing fields", "isBuzzerOn": False}), 400

    try:
        timestamp = datetime.now(WIB_TIMEZONE)
        quality = calculate_quality_using_temperature(temperature)
        buzzer = is_buzzer_on(quality)

        # Save + prepare data
        save_to_csv(CSV_FILE_PATH, temperature, humidity, co, timestamp, quality)
        latest = get_latest_data(CSV_FILE_PATH, 20)
        payload = {"data": [s.to_dict() for s in latest], "latest_record_quality": quality}

        socketio.emit("live_data_update", payload)
        print(f"Emitted {len(latest)} records via socket")

        return jsonify({"message": "Saved & emitted", "isBuzzerOn": buzzer}), 200
    except Exception as e:
        print(f"Process error: {e}")
        return jsonify({"error": "Internal server error"}), 500
    
@app.route("/data/table")
def get_data_for_table():
    """Get paginated data for table."""
    try:
        page = int(request.args.get("page", 1))
        size = int(request.args.get("size", 20))
        items, total_pages = read_csv_with_pagination(CSV_FILE_PATH, page, size)

        return jsonify({
            "data": [s.to_dict() for s in items],
            "metadata": {
                "current_page": page,
                "page_size": size,
                "total_pages": total_pages
            }
        }), 200
    except ValueError:
        return jsonify({"error": "Invalid pagination params"}), 400
    except Exception as e:
        print(f"Table error: {e}")
        return jsonify({"error": "Internal error"}), 500

@app.route("/data/chart")
def get_data_for_chart():
    """Get latest 20 records for chart."""
    try:
        items = get_latest_data(CSV_FILE_PATH, 20)
        return jsonify({"data": [s.to_dict() for s in items]}), 200
    except Exception as e:
        print(f"Chart error: {e}")
        return jsonify({"error": "Internal error"}), 500
    

# ==========================================================
# ENTRY POINT
# ==========================================================

if __name__ == "__main__":
    # Use socketio.run() to properly launch the app with WebSocket support
    socketio.run(app, debug=True, host='127.0.0.1', port=5000)