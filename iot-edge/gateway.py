import websocket
import json
try:
    import serial
except ImportError as exc:
    raise SystemExit(
        "Missing dependency: pyserial. Install it with: python -m pip install pyserial"
    ) from exc
import threading
import time
import requests
import os

# ===== CONFIG =====
SERIAL_PORT = os.getenv("SMART_ROOM_SERIAL_PORT", "COM3")
BAUDRATE = int(os.getenv("SMART_ROOM_BAUDRATE", "115200"))

BASE_URL = os.getenv("SMART_ROOM_BACKEND_URL", "http://localhost:8080")
#BASE_URL = os.getenv("SMART_ROOM_BACKEND_URL", "https://smartstudyroom-production.up.railway.app")

WS_URL = os.getenv("SMART_ROOM_WS_URL", "ws://localhost:8080/ws")
#WS_URL = os.getenv("SMART_ROOM_WS_URL", "ws://smartstudyroom-production.up.railway.app/ws")

USER_ID = os.getenv("SMART_ROOM_USER_ID", "c7ab5c64-cee4-4ef6-9b2e-1f71824c0920")
BACKEND_TOKEN = os.getenv("SMART_ROOM_BACKEND_TOKEN", "")
DEBUG_SERIAL = os.getenv("SMART_ROOM_DEBUG_SERIAL", "1") != "0"

# ===== SERIAL =====
if not hasattr(serial, "Serial"):
    raise SystemExit(
        "Invalid dependency: package 'serial' is installed instead of 'pyserial'. "
        "Run: python -m pip uninstall serial -y; python -m pip install pyserial"
    )

ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=1)
time.sleep(2)
print(f"Serial opened: {SERIAL_PORT} @ {BAUDRATE}")

# ===== SENSOR PARSER =====
def parse_sensor_line(line: str):
    try:
        if line.startswith("T:"):
            return {"sensorType": "TEMPERATURE", "value": float(line[2:])}
        elif line.startswith("H:"):
            return {"sensorType": "HUMIDITY", "value": float(line[2:])}
        elif line.startswith("L:"):
            return {"sensorType": "LIGHT", "value": float(line[2:])}
        return None
    except:
        return None


# ===== UPSTREAM (Device → BE) =====
def send_sensor_data(data):
    if USER_ID:
        data["userId"] = USER_ID

    headers = {}
    if BACKEND_TOKEN:
        headers["Authorization"] = f"Bearer {BACKEND_TOKEN}"

    try:
        res = requests.post(
            f"{BASE_URL}/iot/sensor-data",
            json=data,
            headers=headers,
            timeout=2,
        )
        if res.status_code >= 400:
            print("Send sensor failed:", res.status_code, res.text)
        else:
            pass
            #print("Sent sensor:", data.get("sensorType"), data.get("value"))
    except Exception as e:
        print("Send sensor error:", e)


def serial_reader():
    while True:
        try:
            raw = ser.readline()
            line = raw.decode("utf-8", errors="replace").strip()
            if not line:
                continue

            #print("SERIAL:", line)

            data = parse_sensor_line(line)
            if data:
                send_sensor_data(data)
            elif line.startswith("ERR:"):
                print("Yolobit error:", line)
            elif DEBUG_SERIAL and not line.startswith("ACK:") and line != "YoloBit Ready!":
                print("Ignored serial line:", line)

        except Exception as e:
            print("Read error:", e)


# ===== COMMAND MAPPING =====
def map_command(cmd):
    try:
        if USER_ID and cmd.get("userId") and cmd.get("userId") != USER_ID:
            return None

        device_type = cmd.get("deviceType")
        value = cmd.get("value")

        if device_type == "FAN":
            return f"S{int(value)}"

        if device_type in ("LIGHT", "LED"):
            return "1" if value > 0 else "0"

        return None
    except Exception as e:
        print("Map error:", e)
        return None


# ===== DOWNSTREAM (BE → Device via WebSocket) =====
def on_message(ws, message):
    try:
        for frame in message.split("\x00"):
            frame = frame.strip()
            if not frame or frame.startswith("CONNECTED"):
                continue
            if not frame.startswith("MESSAGE"):
                continue

            _, body = frame.split("\n\n", 1)
            cmd = json.loads(body)
            serial_cmd = map_command(cmd)

            if serial_cmd:
                ser.write((serial_cmd + "\n").encode())
                print("SEND:", serial_cmd)

    except Exception as e:
        print("WS message error:", e)


def on_open(ws):
    connect_frame = "CONNECT\naccept-version:1.2\nheart-beat:10000,10000\n\n\x00"
    subscribe_frame = "SUBSCRIBE\nid:smart-room-gateway\ndestination:/topic/commands\n\n\x00"
    ws.send(connect_frame)
    ws.send(subscribe_frame)
    print("Subscribed to /topic/commands")


def on_error(ws, error):
    print("WS error:", error)


def on_close(ws, close_status_code, close_msg):
    print("WS closed:", close_status_code, close_msg)


def start_ws():
    while True:
        ws = websocket.WebSocketApp(
            WS_URL,
            subprotocols=["v12.stomp"],
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        ws.run_forever()
        print("Reconnecting WebSocket in 2s...")
        time.sleep(2)


# ===== MAIN =====
if __name__ == "__main__":
    print("Gateway started...")
    print("Backend URL:", BASE_URL)
    print("WebSocket URL:", WS_URL)
    if not USER_ID:
        print("Warning: SMART_ROOM_USER_ID is not set; sensor data will be rejected unless the request is authenticated.")

    # Thread đọc sensor
    t1 = threading.Thread(target=serial_reader)

    # Thread WebSocket nhận command
    t2 = threading.Thread(target=start_ws)

    t1.start()
    t2.start()

    t1.join()
    t2.join()
