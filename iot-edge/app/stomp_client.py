import json
import time
from json import JSONDecodeError
from typing import Callable

import websocket

from .config import GatewayConfig
from .parser import map_command


def build_connect_frame() -> str:
    return "CONNECT\naccept-version:1.2\nheart-beat:10000,10000\n\n\x00"


def build_subscribe_frame() -> str:
    return "SUBSCRIBE\nid:smart-room-gateway\ndestination:/topic/commands\n\n\x00"


def iter_stomp_bodies(message: str):
    for frame in message.split("\x00"):
        frame = frame.strip()
        if not frame or frame.startswith("CONNECTED") or not frame.startswith("MESSAGE"):
            continue
        if "\n\n" not in frame:
            continue
        _, body = frame.split("\n\n", 1)
        yield body


class CommandSubscriber:
    def __init__(self, config: GatewayConfig, send_serial: Callable[[str], None]):
        self.config = config
        self.send_serial = send_serial

    def on_open(self, ws):
        ws.send(build_connect_frame())
        ws.send(build_subscribe_frame())
        print("Subscribed to /topic/commands")

    def on_message(self, _ws, message):
        try:
            for body in iter_stomp_bodies(message):
                cmd = json.loads(body)
                serial_cmd = map_command(cmd, self.config.user_id)
                if serial_cmd:
                    self.send_serial(serial_cmd)
        except (JSONDecodeError, TypeError, ValueError) as exc:
            print("WS message error:", exc)

    def on_error(self, _ws, error):
        print("WS error:", error)

    def on_close(self, _ws, close_status_code, close_msg):
        print("WS closed:", close_status_code, close_msg)

    def run_forever(self):
        while True:
            ws = websocket.WebSocketApp(
                self.config.ws_url,
                subprotocols=["v12.stomp"],
                on_open=self.on_open,
                on_message=self.on_message,
                on_error=self.on_error,
                on_close=self.on_close,
            )
            ws.run_forever()
            print("Reconnecting WebSocket in 2s...")
            time.sleep(2)
