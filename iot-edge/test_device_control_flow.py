import json
import os
import time

import websocket


WS_URL = os.getenv("SMART_ROOM_WS_URL", "ws://localhost:8080/ws")
USER_ID = os.getenv("SMART_ROOM_USER_ID", "c7ab5c64-cee4-4ef6-9b2e-1f71824c0920")

device_states = {
    "FAN": 0,
    "LIGHT": 0,
}


def print_device_states():
    fan = device_states.get("FAN", 0)
    light = "ON" if device_states.get("LIGHT", 0) > 0 else "OFF"
    print(f"device states | FAN={fan}% | LIGHT={light}")


def handle_command(command):
    if USER_ID and command.get("userId") and command["userId"] != USER_ID:
        return

    device_type = command.get("deviceType")
    value = command.get("value")
    if device_type not in device_states or value is None:
        print(f"ignored command: {command}")
        return

    device_states[device_type] = int(value)
    print(f"received command: {device_type} -> {value}")
    print_device_states()


def on_open(ws):
    connect_frame = "CONNECT\naccept-version:1.2\nheart-beat:10000,10000\n\n\x00"
    subscribe_frame = "SUBSCRIBE\nid:test-device-control-flow\ndestination:/topic/commands\n\n\x00"
    ws.send(connect_frame)
    ws.send(subscribe_frame)
    print(f"listening for backend commands on {WS_URL}")
    print_device_states()


def on_message(ws, message):
    for frame in message.split("\x00"):
        frame = frame.strip()
        if not frame or frame.startswith("CONNECTED"):
            continue
        if not frame.startswith("MESSAGE"):
            continue

        try:
            _, body = frame.split("\n\n", 1)
            handle_command(json.loads(body))
        except Exception as exc:
            print(f"invalid message frame: {exc}")


def on_error(ws, error):
    print(f"websocket error: {error}")


def on_close(ws, close_status_code, close_msg):
    print(f"websocket closed: {close_status_code} {close_msg}")


def main():
    while True:
        ws = websocket.WebSocketApp(
            WS_URL,
            subprotocols=["v12.stomp"],
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close,
        )
        ws.run_forever(suppress_origin=True)
        print("reconnecting in 2s...")
        time.sleep(2)


if __name__ == "__main__":
    main()
