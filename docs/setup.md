# Setup

## Prerequisites

- Java JDK configured with `JAVA_HOME`
- Maven or the Maven wrapper
- Node.js and npm
- Python 3.11+
- MySQL 8+, or Docker for the local compose file

## Backend

Create the database:

```sql
CREATE DATABASE smart_study_room;
```

Copy `backend/.env.example` to `backend/.env` and provide local secrets. Spring Boot reads the same values from environment variables.

```powershell
cd backend
mvn spring-boot:run
```

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:8080`.

## AI Service

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn service:app --host 0.0.0.0 --port 8000
```

## IoT Edge

Use the simulator when hardware is unavailable:

```powershell
$env:SMART_ROOM_USER_ID="c7ab5c64-cee4-4ef6-9b2e-1f71824c0920"
python iot-edge\test_sensor_flow.py
python iot-edge\test_device_control_flow.py
```
