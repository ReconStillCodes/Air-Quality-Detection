import requests
import random
import time

# Change this to your actual API URL
API_URL = "http://127.0.0.1:5000/data" 

def generate_data():
    """Generate random sensor data."""
    return {
        "temperature": round(random.uniform(0, 100), 2),
        "humidity": round(random.uniform(0, 100), 2),
        "co": round(random.uniform(0, 5), 2)
    }

def post_data():
    """Send POST request with random data to the API."""
    data = generate_data()
    try:
        response = requests.post(API_URL, json=data)

        # print status and server response
        print(f"\n[POST] Sent: {data}")
        print(f"[STATUS] {response.status_code}")

        # if the response body contains JSON, print it nicely
        try:
            print("[RESPONSE]", response.json())
        except Exception:
            print("[RESPONSE]", response.text)

    except Exception as e:
        print(f"[EXCEPTION] {e}")

if __name__ == "__main__":
    print("Starting data simulation...\n")
    while True:
        post_data()
        time.sleep(1)  # send data every second
