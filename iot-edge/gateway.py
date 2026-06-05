import threading
import time

try:
    import serial
except ImportError as exc:
    raise SystemExit(
        "Missing dependency: pyserial. Install it with: python -m pip install pyserial"
    ) from exc

from app.backend_client import BackendClient
from app.config import GatewayConfig
from app.parser import parse_sensor_line
from app.stomp_client import CommandSubscriber


def ensure_pyserial() -> None:
    if not hasattr(serial, "Serial"):
        raise SystemExit(
            "Invalid dependency: package 'serial' is installed instead of 'pyserial'. "
            "Run: python -m pip uninstall serial -y; python -m pip install pyserial"
        )


def open_serial(config: GatewayConfig):
    ensure_pyserial()
    ser = serial.Serial(config.serial_port, config.baudrate, timeout=1)
    time.sleep(2)
    print(f"Serial opened: {config.serial_port} @ {config.baudrate}")
    return ser


def serial_reader(ser, config: GatewayConfig, backend_client: BackendClient) -> None:
    while True:
        try:
            raw = ser.readline()
            line = raw.decode("utf-8", errors="replace").strip()
            if not line:
                continue

            data = parse_sensor_line(line)
            if data:
                backend_client.send_sensor_data(data)
            elif line.startswith("ERR:"):
                print("Yolobit error:", line)
            elif config.debug_serial and not line.startswith("ACK:") and line != "YoloBit Ready!":
                print("Ignored serial line:", line)
        except (UnicodeDecodeError, OSError, ValueError) as exc:
            print("Read error:", exc)


def main() -> None:
    config = GatewayConfig.from_env()
    ser = open_serial(config)
    backend_client = BackendClient(config)

    print("Gateway started...")
    print("Backend URL:", config.backend_url)
    print("WebSocket URL:", config.ws_url)
    if not config.user_id:
        print("Warning: SMART_ROOM_USER_ID is not set; sensor data will be rejected unless the request is authenticated.")

    def send_serial(command: str) -> None:
        ser.write((command + "\n").encode())
        print("SEND:", command)

    subscriber = CommandSubscriber(config, send_serial)

    sensor_thread = threading.Thread(target=serial_reader, args=(ser, config, backend_client))
    command_thread = threading.Thread(target=subscriber.run_forever)

    sensor_thread.start()
    command_thread.start()

    sensor_thread.join()
    command_thread.join()


if __name__ == "__main__":
    main()
