from dataclasses import dataclass
import os


@dataclass(frozen=True)
class GatewayConfig:
    serial_port: str
    baudrate: int
    backend_url: str
    ws_url: str
    user_id: str
    backend_token: str
    debug_serial: bool

    @classmethod
    def from_env(cls) -> "GatewayConfig":
        return cls(
            serial_port=os.getenv("SMART_ROOM_SERIAL_PORT", "COM3"),
            baudrate=int(os.getenv("SMART_ROOM_BAUDRATE", "115200")),
            backend_url=os.getenv("SMART_ROOM_BACKEND_URL", "http://localhost:8080"),
            ws_url=os.getenv("SMART_ROOM_WS_URL", "ws://localhost:8080/ws"),
            user_id=os.getenv("SMART_ROOM_USER_ID", "c7ab5c64-cee4-4ef6-9b2e-1f71824c0920"),
            backend_token=os.getenv("SMART_ROOM_BACKEND_TOKEN", ""),
            debug_serial=os.getenv("SMART_ROOM_DEBUG_SERIAL", "1") != "0",
        )
