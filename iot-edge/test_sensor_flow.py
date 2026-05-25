import os
import random
import time

import requests
from requests import HTTPError


BASE_URL = os.getenv("SMART_ROOM_BACKEND_URL", "http://localhost:8080")
USER_ID = os.getenv("SMART_ROOM_USER_ID", "c7ab5c64-cee4-4ef6-9b2e-1f71824c0920")
BACKEND_TOKEN = os.getenv("SMART_ROOM_BACKEND_TOKEN", "")
INTERVAL_SECONDS = float(os.getenv("SMART_ROOM_SENSOR_INTERVAL", "5"))

SENSOR_RANGES = {
    "TEMPERATURE": (22.0, 35.0),
    "HUMIDITY": (35.0, 85.0),
    "LIGHT": (0.0, 100.0),
}


def build_headers():
    if not BACKEND_TOKEN:
        return {}
    return {"Authorization": f"Bearer {BACKEND_TOKEN}"}


def random_sensor_payload(sensor_type):
    low, high = SENSOR_RANGES[sensor_type]
    payload = {
        "sensorType": sensor_type,
        "value": round(random.uniform(low, high), 2),
    }
    if USER_ID:
        payload["userId"] = USER_ID
    return payload


def send_sensor_data(payload):
    response = requests.post(
        f"{BASE_URL}/iot/sensor-data",
        json=payload,
        headers=build_headers(),
        timeout=5,
    )
    response.raise_for_status()
    return response.json()


def main():
    if not USER_ID and not BACKEND_TOKEN:
        print("Warning: set SMART_ROOM_USER_ID or SMART_ROOM_BACKEND_TOKEN before running.")

    print(f"Sending random sensor data to {BASE_URL}/iot/sensor-data every {INTERVAL_SECONDS}s")
    while True:
        for sensor_type in SENSOR_RANGES:
            payload = random_sensor_payload(sensor_type)
            try:
                send_sensor_data(payload)
                print(f"sent {payload['sensorType']}: {payload['value']}")
            except HTTPError as exc:
                response = exc.response
                body = response.text if response is not None else ""
                print(f"send failed for {payload['sensorType']}: {exc} {body}")
            except Exception as exc:
                print(f"send failed for {payload['sensorType']}: {exc}")

        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
