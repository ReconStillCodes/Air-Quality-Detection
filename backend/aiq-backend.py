from datetime import datetime
import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit


class SensorData:
    def __init__(self, temperature, humidity, co, timestamp, quality):
        self.temperature = temperature
        self.humidity = humidity
        self.co = co
        self.timestamp = timestamp
        self.quality = quality

    def to_dict(self):
        # Convert the object to a dictionary for JSON serialization
        return {
            "temperature": self.temperature,
            "humidity": self.humidity,
            "co": self.co,
            "timestamp": self.timestamp.isoformat(),
            "quality": self.quality
        }
    
def calculate_quality_using_temperature(temperature: float) -> str:
    """Determines the air quality category based on Temperature."""

    if temperature <= 25:
        return "Good"
    elif temperature <= 50: 
        return "Moderate"
    elif temperature <= 75:
        return "Poor"
    else:
        return "Hazardous"
    

def is_buzzer_on(quality: str)->bool:
    if(quality == 'Good'):
        return False
    else:
        return True


app = Flask(__name__)
app.config['SECRET_KEY'] = 'knphidupsusah'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

@app.route('/')
def index():
    return "<h1>Backend is running!</h1>"

@app.route('/data', methods=['POST'])
def process_data():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON", "isBuzzerOn": False}), 400
    
    data = request.get_json(silent=True)

    if data is None or not isinstance(data, dict):
        return jsonify({"error": "Failed to decode JSON object. Request body might be empty or malformed.", "isBuzzerOn": False}), 400
    
    try:
        #Get Data
        temperature = data.get('temperature')
        humidity = data.get('humidity')
        co = data.get('co')

        #Parameter Validation
        if temperature is None or humidity is None or co is None:
            return jsonify({"error": "Missing one or more required fields (temperature, humidity, co)", "isBuzzerOn": False}), 400   
        
        #Calculate Timestamp & Quality
        timestamp = datetime.now()
        quality = calculate_quality_using_temperature(temperature)
        isBuzzerOn = is_buzzer_on(quality)
        
        #Send Data to Frontend
        sensorData = SensorData(temperature, humidity, co, timestamp, quality)
        socketio.emit("new_sensor_data", sensorData.to_dict())

        print(f"Successfully calculated and emitted data: {sensorData.to_dict()}")

        return jsonify({
            "message": "Data processed, quality calculated, and data emitted via SocketIO.",
            "isBuzzerOn": isBuzzerOn
        }), 200
    
    except TypeError:
        return jsonify({"error": "Invalid data type provided. Ensure temperature, humidity, and co are numbers.", "isBuzzerOn": False}), 400
    
    except Exception as e:
        print(f"Error processing data: {e}")
        return jsonify({"error": f"Internal server error during processing: {str(e)}"}), 500
        
        

@socketio.on('connect')
def on_connect():
    print("Client connected!")


if __name__ == "__main__":
    socketio.run(app, debug=True)