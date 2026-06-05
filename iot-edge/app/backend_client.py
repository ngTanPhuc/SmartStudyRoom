import requests

from .config import GatewayConfig


class BackendClient:
    def __init__(self, config: GatewayConfig):
        self.config = config

    def send_sensor_data(self, data: dict[str, object]) -> None:
        payload = dict(data)
        if self.config.user_id:
            payload["userId"] = self.config.user_id

        headers = {}
        if self.config.backend_token:
            headers["Authorization"] = f"Bearer {self.config.backend_token}"

        try:
            response = requests.post(
                f"{self.config.backend_url}/iot/sensor-data",
                json=payload,
                headers=headers,
                timeout=2,
            )
            if response.status_code >= 400:
                print("Send sensor failed:", response.status_code, response.text)
        except requests.RequestException as exc:
            print("Send sensor error:", exc)
