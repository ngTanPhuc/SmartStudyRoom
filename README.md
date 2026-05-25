# Smart Study Room

Hệ thống quản lý thiết bị IoT cho phòng học thông minh.

## Kiến trúc

Luồng tương tác chính:

```text
sensor_node.py <-> gateway.py <-> Backend <-> Frontend
                                  |
                                  +-> ai-service
                                  +-> MySQL
```

Các thành phần:

- `backend/`: Spring Boot API, lưu dữ liệu MySQL, điều khiển thiết bị, auto rule, speech command.
- `front-end/`: Vite React UI, kết nối trực tiếp với backend Spring Boot.
- `ai-service/`: FastAPI service dự đoán intent từ câu lệnh tiếng Việt.
- `iot-edge/`: gateway đọc sensor từ serial, gửi dữ liệu lên backend, nhận lệnh điều khiển từ backend.

## Yêu cầu môi trường

- Java JDK 19
- Maven
- MySQL
- Python 3.11+
- Thiết bị IoT qua serial nếu chạy gateway thật

## Cấu hình database

Tạo database MySQL:

```sql
CREATE DATABASE smart_study_room;
```

Kiểm tra cấu hình trong `backend/src/main/resources/application.yaml`:

```yaml
spring:
  datasource:
    url: "jdbc:mysql://localhost:3306/smart_study_room"
    username: root
    password: your_password
```

## Chạy backend

```powershell
cd backend
mvn spring-boot:run
```

Backend mặc định chạy tại:

```text
http://localhost:8080
```

## Chạy frontend

```powershell
cd front-end
npm install
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:3000
```

Frontend mặc định gọi backend tại `http://localhost:8080`. Nếu cần đổi URL backend:

```powershell
$env:VITE_API_BASE_URL="http://localhost:8080"
npm run dev
```

Các luồng đã nối với backend:

- Đăng ký: `POST /auth/register`, sau đó tự login.
- Đăng nhập: `POST /auth/login`, sau đó lấy user qua `GET /users/my-info`.
- Dashboard sensor: `GET /users/{userId}/sensors`.
- Điều khiển thiết bị: `POST /users/{userId}/devices/{deviceId}/control`.
- Lịch sử: `GET /users/{userId}/commands`.
- Biểu đồ: lấy lịch sử sensor qua `GET /users/{userId}/sensors/{sensorId}/data`.

Build nhanh:

```powershell
cd backend
mvn package -DskipTests
```

## Chạy AI service

```powershell
cd ai-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn service:app --host 0.0.0.0 --port 8000
```

Kiểm tra health:

```text
http://localhost:8000/health
```

Endpoint dự đoán:

```text
POST http://localhost:8000/predict
```

Body mẫu:

```json
{
  "rawtext": "bật quạt"
}
```

## Chạy gateway thật

Gateway đọc serial từ thiết bị IoT và subscribe command từ backend.

Các biến môi trường thường dùng:

```powershell
$env:SMART_ROOM_USER_ID="c7ab5c64-cee4-4ef6-9b2e-1f71824c0920"
$env:SMART_ROOM_SERIAL_PORT="COM3"
$env:SMART_ROOM_BAUDRATE="115200"
$env:SMART_ROOM_BACKEND_URL="http://localhost:8080"
$env:SMART_ROOM_WS_URL="ws://localhost:8080/ws"
```

Chạy gateway:

```powershell
python iot-edge\gateway.py
```

## Test luồng sensor không cần thiết bị thật

Script này random 3 sensor `TEMPERATURE`, `HUMIDITY`, `LIGHT` và gửi lên backend mỗi 5 giây.

```powershell
$env:SMART_ROOM_USER_ID="c7ab5c64-cee4-4ef6-9b2e-1f71824c0920"
python iot-edge\test_sensor_flow.py
```

Đổi chu kỳ gửi:

```powershell
$env:SMART_ROOM_SENSOR_INTERVAL="2"
python iot-edge\test_sensor_flow.py
```

## Test luồng điều khiển device không cần thiết bị thật

Script này lắng nghe command từ backend qua WebSocket STOMP và in trạng thái thiết bị.

```powershell
$env:SMART_ROOM_USER_ID="c7ab5c64-cee4-4ef6-9b2e-1f71824c0920"
python iot-edge\test_device_control_flow.py
```

Khi frontend/backend gửi lệnh điều khiển, terminal sẽ hiển thị trạng thái:

```text
received command: FAN -> 70
device states | FAN=70% | LIGHT=OFF
```

## API chính

Đăng ký user:

```text
POST /auth/register
```

Khi đăng ký thành công, backend tự tạo:

- 3 sensor: `HUMIDITY`, `LIGHT`, `TEMPERATURE`
- 2 device: `FAN`, `LIGHT`

Lấy danh sách sensor:

```text
GET /users/{userId}/sensors
```

Lấy dữ liệu sensor:

```text
GET /users/{userId}/sensors/{sensorId}/data
```

Điều khiển thủ công:

```text
POST /users/{userId}/devices/{deviceId}/control
```

Body:

```json
{
  "targetValue": 100
}
```

Điều khiển giọng nói:

```text
POST /users/{userId}/speech-inputs/predict
```

Body:

```json
{
  "rawtext": "bật đèn"
}
```

Auto rule:

```text
GET  /users/{userId}/auto-rules
POST /users/{userId}/auto-rules
PUT  /users/{userId}/auto-rules/{autoRuleId}
DELETE /users/{userId}/auto-rules/{autoRuleId}
```

## Ghi chú

- `SMART_ROOM_USER_ID` mặc định nên dùng user test `c7ab5c64-cee4-4ef6-9b2e-1f71824c0920`, hoặc đổi sang id user khác đã đăng ký trong backend.
- Nếu không có token JWT, endpoint sensor test vẫn cần `userId` trong body để backend map sensor đúng user.
- Auto rule được backend kiểm tra mỗi 5 giây.
- Không commit `venv/`, `target/`, `.env`, log, file local secret.
