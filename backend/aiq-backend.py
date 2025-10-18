from datetime import datetime, timedelta
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

import joblib
import xgboost as xgb
import numpy as np

# ==========================================================
# CONFIG 
# ==========================================================
WIB_TIMEZONE = ZoneInfo("Asia/Jakarta")
CSV_FILE_PATH = 'aiq-data.csv'
ML_FILE_PATH = 'xgb_model_air_quality.pkl'

app = Flask(__name__, static_folder="../frontend/aiq/dist/")
CORS(app) 
app.config['SECRET_KEY'] = 'secret!'

# Initialize SocketIO for real-time communication
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet') 

# ==========================================================
# VARIABLE
# ==========================================================
CONTROL_STATUS = "auto" # auto / on / off
TREND_OPTION = 0 # 0: 1 min, 1: 5 min, 2: 10 min, 3: 30 min, 

# ==========================================================
# LOAD ML MODEL
# ==========================================================

try:
    ml_model = joblib.load(ML_FILE_PATH)
    print("ML model loaded successfully.")
except Exception as e:
    ml_model = None
    print(f"Failed to load ML model: {e}")


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
    
class TrendData:
    def __init__(self, good: int = 0, moderate: int = 0, poor: int = 0, hazardous: int = 0):
        self.good = good      # Matches QUALITY_LIST values
        self.moderate = moderate
        self.poor = poor
        self.hazardous = hazardous

    def to_dict(self) -> Dict[str, int]:
        """Converts the object to a dictionary for JSON serialization."""
        return {
            "good": self.good,
            "moderate": self.moderate,
            "poor": self.poor,
            "hazardous": self.hazardous,
        }

QUALITY_LIST = ['Good', 'Moderate', 'Poor', 'Hazardous']

# ==========================================================
# PROCESSING FUNCTIONS
# ==========================================================

def calculate_quality_using_ml(temperature: float, humidity: float, co: float) -> str:
    if ml_model is None:
        return "Unknown"
    
    input = np.array([[temperature, humidity, co]])

    try:
        predicted_idx = ml_model.predict(input)[0]
        return QUALITY_LIST[predicted_idx]

    except Exception as e:
        print(f"ML prediction error: {e}")
        return "Unknown"

# Not used in the current version
def calculate_quality_using_temperature(temperature: float) -> str:
    if temperature < 27:
        return "Normal"
    else:
        return "Hot"
    
def is_buzzer_on(quality: str) -> bool:
    if quality in ["Poor", "Hazardous"]:
        return True
    return False

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
    
def calculate_quality_trend(filename: str, trend_option: int) -> 'TrendData':
    TIME_WINDOWS = [60, 300, 600, 1800] 
    
    if trend_option not in range(len(TIME_WINDOWS)):
        return TrendData()
        
    time_limit_seconds = TIME_WINDOWS[trend_option]
    
    all_data = get_latest_data(filename, limit=1000) 
    
    if not all_data:
        return TrendData()

    latest_timestamp = all_data[-1].timestamp 
    
    # FIX: Use timedelta directly, as it is imported globally and is the correct object after monkey-patching.
    time_cutoff = latest_timestamp - timedelta(seconds=time_limit_seconds) 

    
    # Initialize counts based on the global CAPITALIZED QUALITY_LIST
    quality_counts: Dict[str, int] = {q: 0 for q in QUALITY_LIST}
    
    # Filter and count
    for record in all_data:
        # Check if the record is within the time window
        if record.timestamp > time_cutoff:
            quality = record.quality # E.g., 'Good', 'Poor'
            
            # Check against the capitalized keys
            if quality in quality_counts:
                quality_counts[quality] += 1
                
    # Instantiate the TrendData class:
    trend_data_obj = TrendData(
        good=quality_counts.get('Good', 0),        
        moderate=quality_counts.get('Moderate', 0), 
        poor=quality_counts.get('Poor', 0),        
        hazardous=quality_counts.get('Hazardous', 0) 
    )
    
    return trend_data_obj
# ==========================================================
# ROUTES
# ==========================================================



@app.route('/', defaults={'path': ''})

@app.route('/<path:path>')
def serve(path):
    """Serve frontend build."""
    global CONTROL_STATUS
    dist = "../frontend/aiq/dist"
    file_path = os.path.join(dist, path)
    return send_from_directory(dist, path if os.path.exists(file_path) else "index.html")

@app.route("/data", methods=["POST"])
def process_data():
    """Receive sensor data, save to CSV, emit via socket."""
    if not request.is_json:
        return jsonify({"error": "Request must be JSON", "quality": "Unknown", "control_status": CONTROL_STATUS}), 400

    data = request.get_json(silent=True) or {}
    temperature, humidity, co = data.get("temperature"), data.get("humidity"), data.get("co")

    if None in (temperature, humidity, co):
        return jsonify({"error": "Missing fields", "quality": "Unknown", "control_status": CONTROL_STATUS}), 400

    try:
        timestamp = datetime.now(WIB_TIMEZONE)
        # quality = calculate_quality_using_temperature(temperature) # Old Method
        quality = calculate_quality_using_ml(temperature, humidity, co)
        buzzer = is_buzzer_on(quality)

        # 1. Save to CSV
        save_to_csv(CSV_FILE_PATH, temperature, humidity, co, timestamp, quality)

        # 2. Get 20 Data for table/chart
        latest = get_latest_data(CSV_FILE_PATH, 20)

        # 3. Calculate Trend Data
        trend_data_obj = calculate_quality_trend(CSV_FILE_PATH, TREND_OPTION)

        # 4. Emit via SocketIO
        payload = {"data": [s.to_dict() for s in latest], "latest_record_quality": quality, "trend_data": trend_data_obj.to_dict(),}

        socketio.emit("live_data_update", payload)
        print(f"Emitted {len(latest)} records via socket")

        return jsonify({"message": "Saved & emitted", "quality": quality, "control_status": CONTROL_STATUS}), 200
    except Exception as e:
        print(f"Process error: {e}")
        return jsonify({"error": "Internal server error", "quality": "Unknown", "control_status": CONTROL_STATUS}), 500
    
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
    
@app.route("/control/status", methods=["POST"])
def set_control_status():
    """Set control status: auto, on, off."""
    
    global CONTROL_STATUS

    print(f"Control status set to: {CONTROL_STATUS} CALLED")
    if not request.is_json:
        return jsonify({"error": "Request must be JSON", "curr_control_status": CONTROL_STATUS}), 400

    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ["auto", "on", "off"]:
        return jsonify({"error": "Invalid status", "curr_control_status": CONTROL_STATUS}), 400

    CONTROL_STATUS = status
    print(f"Control status set to: {CONTROL_STATUS}")
    return jsonify({"message": "Status updated", "curr_control_status": CONTROL_STATUS}), 200

@app.route("/data/trend", methods=["GET"])
def get_data_trend():
    global TREND_OPTION 

    try:
        # Check if 'option' is provided in the URL query string
        option_arg = request.args.get("option")
        
        if option_arg is not None:
            try:
                # 1. Parse the option from the URL
                option = int(option_arg)
            except ValueError:
                return jsonify({"error": "Invalid option format. Must be an integer."}), 400
        else:
            # 1. If no option is provided, use the current global TREND_OPTION
            option = TREND_OPTION 

        if option not in [0, 1, 2, 3]:
            return jsonify({"error": "Invalid option. Must be 0, 1, 2, or 3."}), 400

        # 2. If the option was passed in the query, update the global variable
        # This makes the new option the default for future calls without the query param.
        if option_arg is not None:
            TREND_OPTION = option
            
        # 3. Perform the calculation using the determined 'option'
        trend_data_obj = calculate_quality_trend(CSV_FILE_PATH, option)
            
        return jsonify({
            "data": trend_data_obj.to_dict(),
            "new_trend_option": TREND_OPTION # Optional: send back the new global value
        }), 200
        
    except Exception as e:
        print(f"Trend API error: {e}")
        return jsonify({"error": "Internal error retrieving trend data"}), 500

# ==========================================================
# ENTRY POINT
# ==========================================================

if __name__ == "__main__":
    # Use socketio.run() to properly launch the app with WebSocket support
    socketio.run(app, debug=True, host='127.0.0.1', port=5000)