# Environment Variables

## Backend

Backend imports `backend/.env` automatically for local runs. The same keys can also be provided as real environment variables in deployment.

- `SPRING_DATASOURCE_URL`: MySQL JDBC URL.
- `SPRING_DATASOURCE_USERNAME`: database username.
- `SPRING_DATASOURCE_PASSWORD`: database password.
- `SPRING_JPA_HIBERNATE_DDL_AUTO`: local default is `update`.
- `JWT_SIGNER_KEY`: HMAC signer key, use a new high-entropy value.
- `JWT_VALID_DURATION`: access token lifetime in seconds.
- `JWT_REFRESHABLE_DURATION`: refresh window in seconds.
- `AI_SERVICE_BASE_URL`: FastAPI base URL.
- `AI_SERVICE_TIMEOUT_SECONDS`: AI call timeout.
- `CORS_ALLOWED_ORIGINS`: comma-separated allowed frontend origins.

## Frontend

- `VITE_API_BASE_URL`: backend API URL.
- `VITE_DATA_PROVIDER`: `backend` by default, `adafruit` for legacy mode.
- `VITE_AIO_USERNAME`, `VITE_AIO_KEY`: required only for legacy Adafruit mode.

## AI Service

- `AI_MODEL_DIR`: model directory relative to `ai-service`.
- `AI_MIN_CONFIDENCE`: confidence threshold for unknown labels.

## IoT Edge

- `SMART_ROOM_USER_ID`: backend user id for sensor/device routing.
- `SMART_ROOM_SERIAL_PORT`: serial port, for example `COM3`.
- `SMART_ROOM_BAUDRATE`: serial baudrate.
- `SMART_ROOM_BACKEND_URL`: backend REST base URL.
- `SMART_ROOM_WS_URL`: backend WebSocket URL.
- `SMART_ROOM_BACKEND_TOKEN`: optional bearer token.
- `SMART_ROOM_SENSOR_INTERVAL`: simulator interval in seconds.
