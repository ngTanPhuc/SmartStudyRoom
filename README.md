# Smart Study Room

Hệ thống quản lý phòng học thông minh gồm backend Spring Boot, frontend React, AI service FastAPI và IoT gateway Python.

## Cấu trúc

```text
backend/     Spring Boot API, MySQL, JWT, WebSocket, auto rules
frontend/    React + Vite UI
ai-service/  FastAPI intent classification service
iot-edge/    Serial gateway and IoT flow simulators
docs/        Architecture, setup, env, API notes
infra/       Local infrastructure files
scripts/     Developer convenience scripts
```

## Chạy nhanh

1. Copy env mẫu và điền giá trị local:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
Copy-Item ai-service\.env.example ai-service\.env
Copy-Item iot-edge\.env.example iot-edge\.env
```

2. Tạo database MySQL `smart_study_room`, hoặc chạy MySQL local bằng Docker Compose:

```powershell
docker compose -f infra\docker-compose.local.yml up -d mysql
```

3. Chạy backend:

```powershell
cd backend
mvn spring-boot:run
```

4. Chạy AI service:

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn service:app --host 0.0.0.0 --port 8000
```

5. Chạy frontend:

```powershell
cd frontend
npm install
npm run dev
```

6. Chạy IoT edge và các script test:

```powershell
cd iot-edge
python -m pip install -r requirements.txt
cd ..
```

### Script 1: `gateway.py`

Dùng khi có thiết bị thật đang kết nối qua serial. Script này đọc dữ liệu sensor từ serial, gửi lên backend, đồng thời lắng nghe lệnh điều khiển từ backend qua WebSocket rồi gửi lại xuống thiết bị.

```powershell
$env:SMART_ROOM_USER_ID="c7ab5c64-cee4-4ef6-9b2e-1f71824c0920"
$env:SMART_ROOM_SERIAL_PORT="COM3"
$env:SMART_ROOM_BAUDRATE="115200"
$env:SMART_ROOM_BACKEND_URL="http://localhost:8080"
$env:SMART_ROOM_WS_URL="ws://localhost:8080/ws"
python iot-edge\gateway.py
```

Thiết bị cần gửi serial line theo format:

```text
T:28.5
H:60
L:400
```

Gateway map dữ liệu thành:

```text
TEMPERATURE, HUMIDITY, LIGHT
```

Khi backend gửi command, gateway map xuống serial:

```text
FAN value    -> S<value>
LIGHT value  -> 1 nếu value > 0, ngược lại 0
```

### Script 2: `test_sensor_flow.py`

Dùng khi chưa có thiết bị thật. Script này random dữ liệu `TEMPERATURE`, `HUMIDITY`, `LIGHT` và gửi lên backend định kỳ.

```powershell
$env:SMART_ROOM_USER_ID="c7ab5c64-cee4-4ef6-9b2e-1f71824c0920"
$env:SMART_ROOM_BACKEND_URL="http://localhost:8080"
$env:SMART_ROOM_SENSOR_INTERVAL="5"
python iot-edge\test_sensor_flow.py
```

Output mẫu:

```text
Sending random sensor data to http://localhost:8080/iot/sensor-data every 5s
sent TEMPERATURE: 28.31
sent HUMIDITY: 64.2
sent LIGHT: 78.5
```

### Script 3: `test_device_control_flow.py`

Dùng khi chưa có thiết bị thật nhưng muốn test luồng điều khiển. Script này lắng nghe `/topic/commands` từ backend và in trạng thái thiết bị giả lập.

```powershell
$env:SMART_ROOM_USER_ID="c7ab5c64-cee4-4ef6-9b2e-1f71824c0920"
$env:SMART_ROOM_WS_URL="ws://localhost:8080/ws"
python iot-edge\test_device_control_flow.py
```

Sau đó điều khiển đèn/quạt từ frontend. Terminal sẽ in dạng:

```text
received command: FAN -> 66
device states | FAN=66% | LIGHT=OFF
```

Có thể chạy qua helper scripts:

```powershell
.\scripts\dev.ps1 -Service sensor
.\scripts\dev.ps1 -Service commands
```

Chạy kiểm tra nhanh:

```powershell
.\scripts\test.ps1
```

## Tài liệu

- Kiến trúc: `docs/architecture.md`
- Setup chi tiết: `docs/setup.md`
- Biến môi trường: `docs/env.md`
- API chính: `docs/api.md`

## Ghi chú bảo mật

Secret cũ trong cấu hình local đã được thay bằng biến môi trường. Khi chạy thật, hãy dùng `JWT_SIGNER_KEY` và mật khẩu database mới; không tái sử dụng giá trị đã từng nằm trong repository.

Dự án này phục vụ mục đích học tập nên signer key dưới đây được công khai để mọi người có thể chạy local giống nhau:

```text
JWT_SIGNER_KEY=5536d9c7d3a5520637881025e26519cce4c8a3adb105f10fbe789a6bc17e42e9
```

Key này chỉ dùng cho demo/local learning, không dùng cho production hoặc dữ liệu thật.
