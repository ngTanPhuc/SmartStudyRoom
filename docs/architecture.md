# Codebase Map - Smart Study Room

Ngay scan: 2026-06-05

## Tong quan

Smart Study Room la he thong quan ly phong hoc thong minh gom 4 thanh phan chinh:

- `backend/`: Spring Boot REST API, JWT auth, MySQL persistence, WebSocket command broker, auto-rule scheduler.
- `frontend/`: React + Vite + TypeScript UI, goi truc tiep backend qua Axios va React Query.
- `ai-service/`: FastAPI service nhan dien intent dieu khien thiet bi bang tieng Viet.
- `iot-edge/`: Python gateway doc serial tu thiet bi IoT, day sensor len backend va nhan lenh qua STOMP WebSocket.

Luon bo qua khi doc codebase: `node_modules/`, `venv/`, `target/`, `__pycache__/`, `.idea/`.

## Kien truc chay

```text
IoT device
  | serial
  v
iot-edge/gateway.py
  | POST /iot/sensor-data
  | STOMP subscribe /topic/commands
  v
backend Spring Boot
  | JPA
  v
MySQL

frontend React  <----REST/JWT---->  backend

backend  ----POST /predict---->  ai-service FastAPI
```

## Tech stack

Backend:

- Java 19
- Spring Boot 4.0.5
- Spring Data JPA + MySQL
- Spring Security OAuth2 resource server + custom JWT decoder
- Spring Web MVC + WebFlux `WebClient`
- Spring WebSocket STOMP simple broker
- Lombok, MapStruct

Frontend:

- React 18
- Vite 7
- TypeScript 5
- Tailwind CSS
- Axios
- TanStack React Query
- React Router
- Chart.js / react-chartjs-2
- Lucide React

AI service:

- Python 3.11+
- FastAPI, Uvicorn, Pydantic
- scikit-learn, joblib
- underthesea
- model files in `ai-service/models/`

IoT edge:

- Python
- pyserial
- requests
- websocket-client

## Thu muc chinh

```text
.
|-- README.md
|-- CODEBASE.md
|-- backend/
|   |-- pom.xml
|   |-- src/main/java/com/aiot/backend/
|   |   |-- BackendApplication.java
|   |   |-- configuration/
|   |   |-- controller/
|   |   |-- service/
|   |   |-- repository/
|   |   |-- entity/
|   |   |-- dto/
|   |   |-- mapper/
|   |   |-- enums/
|   |   `-- exception/
|   `-- src/main/resources/application.yaml
|-- frontend/
|   |-- package.json
|   |-- vite.config.ts
|   |-- tsconfig.json
|   `-- src/
|       |-- App.tsx
|       |-- services/api.ts
|       |-- contexts/
|       |-- hooks/
|       |-- pages/
|       |-- components/
|       |-- types/
|       `-- utils/
|-- ai-service/
|   |-- service.py
|   |-- requirements.txt
|   |-- models/
|   |-- data/
|   `-- nlp_model.ipynb
`-- iot-edge/
    |-- gateway.py
    |-- sensor_node.py
    |-- test_sensor_flow.py
    |-- test_device_control_flow.py
    `-- requirements.txt
```

## Backend map

Entrypoint:

- `backend/src/main/java/com/aiot/backend/BackendApplication.java`
- Bat scheduling bang `@EnableScheduling`; auto rule chay qua scheduler.

Config:

- `configuration/SecurityConfig.java`: public endpoints cho auth, IoT ingest va WebSocket; cac endpoint con lai can JWT.
- `configuration/WebSocketConfig.java`: STOMP endpoint `/ws`, broker `/topic`, app prefix `/app`.
- `configuration/ApplicationInitConfig.java`: seed admin, test user, default sensors/devices.
- `src/main/resources/application.yaml`: port `8080`, MySQL datasource, JPA `ddl-auto: update`, JWT config.

Controller surface:

| Module | Endpoint chinh | Vai tro |
|---|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/verify`, `/auth/refresh` | Dang ky, dang nhap, token lifecycle |
| Users | `GET /users`, `GET /users/{userId}`, `GET /users/my-info`, `PUT /users/{userId}`, `DELETE /users/{userId}` | Ho so user va admin user management |
| Sensors | `GET /users/{userId}/sensors`, `GET /users/{userId}/sensors/{sensorId}`, `GET/DELETE /users/{userId}/sensors/{sensorId}/data` | Doc sensor va lich su sensor |
| IoT ingest | `POST /iot/sensor-data`, `/sensor-data`, `/sensors/sensor-data` | Gateway/test script gui sensor data |
| Devices | `GET /users/{userId}/devices`, `GET /users/{userId}/devices/{deviceId}`, `POST /users/{userId}/devices/{deviceId}/control` | Dieu khien thiet bi thu cong |
| Commands | `GET /users/{userId}/commands`, `GET /users/{userId}/commands/{commandId}`, `DELETE /users/{userId}/commands/{commandId}` | Lich su lenh |
| Speech | `GET /users/{userId}/speech-inputs`, `POST /users/{userId}/speech-inputs/predict` | Dieu khien bang giong noi va lich su speech |
| Auto rules | `GET/POST /users/{userId}/auto-rules`, `GET/PUT/DELETE /users/{userId}/auto-rules/{autoRuleId}` | CRUD auto rule |
| WebSocket | `/ws`, topic `/topic/commands` | Backend publish command cho gateway/device |

Service flow:

- `SensorService.handleSensorData`: validate `userId`, map `sensorType` vao sensor cua user, luu `SensorData` voi timestamp hien tai.
- `DeviceService.controlDevice`: clamp target value `0..100`, den chi nhan `0` hoac `100`, luu `CommandType.MANUAL`, publish WebSocket command.
- `SpeechInputService.processSpeechInput`: goi AI service qua `AiPredictionClient` va `AI_SERVICE_BASE_URL`, validate confidence, map label thanh thiet bi/action, luu `SpeechInput`, cap nhat device, luu `CommandType.SPEECH`, publish command.
- `AutoRuleScheduler.run`: moi 5 giay goi `AutoRuleService.handleSensor`.
- `AutoRuleService.handleSensor`: doc 2 sensor data moi nhat, trigger khi gia tri moi cat qua nguong, ton trong cooldown, chon 1 rule/1 device, luu `CommandType.AUTO_RULE`, publish command.
- `CommandService.sendCmdToGateway`: publish JSON `{userId, deviceType, value}` toi `/topic/commands`.

Data model chinh:

- `User`: tai khoan, profile, roles.
- `Sensor`: cam bien theo user, type `TEMPERATURE`, `HUMIDITY`, `LIGHT`.
- `SensorData`: composite id gom `sensorId` va `timestamp`, gia tri sensor.
- `Device`: thiet bi theo user, type `FAN`, `LIGHT`, `intensityLevel`.
- `Command`: log lenh manual/auto/speech, previous/current intensity.
- `SpeechInput`: raw text, predicted label, confidence, device, target value.
- `AutoRule`: sensor, operator, threshold, target device/value, active/cooldown/trigger metadata.
- `InvalidatedToken`: token da logout/invalidated.

## Frontend map

Entrypoint:

- `frontend/src/main.tsx`
- `frontend/src/app/App.tsx`

Routing:

| Route | Page |
|---|---|
| `/login` | `LoginPage` |
| `/register` | `RegisterPage` |
| `/dashboard` | `DashboardPage` |
| `/sensors/:sensorType` | `SensorDetailPage` |
| `/charts` | `ChartsPage` |
| `/history` | `HistoryPage` |
| `/auto-rules` | `AutoRulesPage` |
| `/profile` | `ProfilePage` |
| `/speech-history` | `SpeechHistoryPage` |
| `/admin` | `AdminPage` |
| `/` | redirect theo auth/role |

Frontend integration:

- `src/services/api.ts` la compatibility barrel; API chinh nam trong `src/shared/api/` va `src/features/*/api.ts`.
- Axios base URL: `VITE_API_BASE_URL` hoac mac dinh `http://localhost:8080`.
- JWT token luu trong `localStorage` key `smart_classroom_token`.
- User cache luu trong `localStorage` key `smart_classroom_user`.
- Path alias `@/*` tro den `src/*` trong `tsconfig.json` va `vite.config.ts`.
- React Query dung cho caching/refetch, mac dinh `retry: 1`, `refetchOnWindowFocus: false`.

API groups trong frontend:

- `authApi`: login/register/logout/getMyInfo/updateProfile.
- `feedApi`: sensor latest/history/deleteHistory, map backend sensor type sang feed UI `bbc-temp`, `bbc-humi`, `bbc-lux`.
- `deviceApi`: lay device, dieu khien fan/light, map fan level UI `0..3` sang intensity `0,33,66,100`.
- `sensorApi`: lay sensor summaries.
- `autoRuleApi`: CRUD auto rules.
- `speechApi`: speech predict va speech history.
- `historyApi`: map command backend thanh log hien thi.
- `adminApi`: quan ly users.

## AI service map

Entrypoint:

- `ai-service/service.py`

Endpoints:

- `GET /health`: tra `{"status": "ok"}`.
- `POST /predict`: body chap nhan `rawtext` hoac `rawText`, response `{predictLabel, confidence}`.

Pipeline:

1. Normalize text: lowercase, collapse spaces.
2. Remove punctuation while preserving Vietnamese characters.
3. Normalize slang: `ko`, `k`, `hok` -> `khong`; `giùm`, `dum` -> `giup`.
4. Tokenize bang `underthesea.word_tokenize`.
5. Vectorize bang `models/vectorizer.pkl`.
6. Feature select bang `models/selector.pkl`.
7. Predict bang `models/model_v1.pkl`.
8. Map labels: `bat_quat`, `tat_quat`, `bat_den`, `tat_den` sang system labels.
9. Confidence duoi `0.7` tra `UNKNOWN`.

## IoT edge map

Entrypoints:

- `iot-edge/gateway.py`: gateway that doc serial va bridge voi backend.
- `iot-edge/sensor_node.py`: sensor simulator/node helper.
- `iot-edge/test_sensor_flow.py`: random sensor data len backend, khong can hardware.
- `iot-edge/test_device_control_flow.py`: lang nghe `/topic/commands`, khong can hardware.

Gateway behavior:

- Serial default: `COM3`, baudrate `115200`.
- Parse lines:
  - `T:<value>` -> `TEMPERATURE`
  - `H:<value>` -> `HUMIDITY`
  - `L:<value>` -> `LIGHT`
- POST sensor data len `${SMART_ROOM_BACKEND_URL}/iot/sensor-data`.
- Subscribe STOMP `/topic/commands` qua `${SMART_ROOM_WS_URL}`.
- Map command:
  - `FAN` value -> serial `S<value>`
  - `LIGHT` value > 0 -> serial `1`, nguoc lai `0`

Bien moi truong quan trong:

- `SMART_ROOM_USER_ID`
- `SMART_ROOM_SERIAL_PORT`
- `SMART_ROOM_BAUDRATE`
- `SMART_ROOM_BACKEND_URL`
- `SMART_ROOM_WS_URL`
- `SMART_ROOM_BACKEND_TOKEN`
- `SMART_ROOM_SENSOR_INTERVAL`

## Luong nghiep vu chinh

Sensor data:

```text
Serial T/H/L -> iot-edge/gateway.py -> POST /iot/sensor-data
-> SensorDataController -> SensorService.handleSensorData
-> MySQL SensorData -> frontend feedApi/chart/history
```

Manual control:

```text
Frontend deviceApi.sendCommand
-> POST /users/{userId}/devices/{deviceId}/control
-> DeviceService.controlDevice
-> CommandService.sendCmdToGateway
-> WebSocket /topic/commands
-> iot-edge/gateway.py
-> serial command to device
```

Voice control:

```text
Frontend speechApi.process
-> POST /users/{userId}/speech-inputs/predict
-> SpeechInputService.processSpeechInput
-> ai-service POST /predict
-> update Device + save SpeechInput/Command
-> WebSocket /topic/commands
-> iot-edge/gateway.py
```

Auto rule:

```text
SensorData inserted
-> AutoRuleScheduler every 5s
-> AutoRuleService.handleSensor
-> threshold crossing + cooldown check
-> update Device + save Command
-> WebSocket /topic/commands
```

## Cach chay nhanh

Backend:

```powershell
cd backend
mvn spring-boot:run
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

AI service:

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn service:app --host 0.0.0.0 --port 8000
```

IoT sensor test:

```powershell
$env:SMART_ROOM_USER_ID="c7ab5c64-cee4-4ef6-9b2e-1f71824c0920"
python iot-edge\test_sensor_flow.py
```

IoT command test:

```powershell
$env:SMART_ROOM_USER_ID="c7ab5c64-cee4-4ef6-9b2e-1f71824c0920"
python iot-edge\test_device_control_flow.py
```

## Diem can theo doi

- `backend/src/main/resources/application.yaml` da chuyen secret sang env vars; khi deploy dung JWT signer key va DB password moi.
- `AI_SERVICE_BASE_URL` va `CORS_ALLOWED_ORIGINS` da co cau hinh env, can set dung domain khi deploy.
- `frontend/src/utils/constants.ts` con mot so endpoint legacy nhu `/feeds/latest`, `/auto-mode/config`, `/history/logs`; API runtime chinh da nam trong `src/features/*/api.ts`.
- `front-end/` co the con artifact local bi Windows lock; thu muc nay da bi ignore va co the xoa bang `scripts/clean.ps1` sau khi dung process lien quan.
