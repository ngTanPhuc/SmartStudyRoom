# API Notes

Public request and response shapes are intentionally unchanged by the reorganization.

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/verify`
- `POST /auth/refresh`

## User Data

- `GET /users/{userId}/sensors`
- `GET /users/{userId}/sensors/{sensorId}/data`
- `GET /users/{userId}/devices`
- `POST /users/{userId}/devices/{deviceId}/control`
- `GET /users/{userId}/commands`
- `POST /users/{userId}/speech-inputs/predict`
- `GET /users/{userId}/auto-rules`

## IoT

- `POST /iot/sensor-data`
- WebSocket endpoint `/ws`
- Command topic `/topic/commands`
