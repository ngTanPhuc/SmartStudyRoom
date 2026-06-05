from __future__ import annotations

from typing import Any


def parse_sensor_line(line: str) -> dict[str, float | str] | None:
    try:
        if line.startswith("T:"):
            return {"sensorType": "TEMPERATURE", "value": float(line[2:])}
        if line.startswith("H:"):
            return {"sensorType": "HUMIDITY", "value": float(line[2:])}
        if line.startswith("L:"):
            return {"sensorType": "LIGHT", "value": float(line[2:])}
        return None
    except ValueError:
        return None


def map_command(cmd: dict[str, Any], user_id: str | None = None) -> str | None:
    try:
        if user_id and cmd.get("userId") and cmd.get("userId") != user_id:
            return None

        device_type = cmd.get("deviceType")
        value = cmd.get("value")

        if device_type == "FAN":
            return f"S{int(value)}"

        if device_type in ("LIGHT", "LED"):
            return "1" if float(value) > 0 else "0"

        return None
    except (TypeError, ValueError):
        return None
