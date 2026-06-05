param(
  [ValidateSet("backend", "frontend", "ai", "sensor", "commands")]
  [string]$Service = "backend"
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

switch ($Service) {
  "backend" {
    Push-Location (Join-Path $Root "backend")
    mvn spring-boot:run
    Pop-Location
  }
  "frontend" {
    Push-Location (Join-Path $Root "frontend")
    npm.cmd run dev
    Pop-Location
  }
  "ai" {
    Push-Location (Join-Path $Root "ai-service")
    uvicorn service:app --host 0.0.0.0 --port 8000
    Pop-Location
  }
  "sensor" {
    python (Join-Path $Root "iot-edge\test_sensor_flow.py")
  }
  "commands" {
    python (Join-Path $Root "iot-edge\test_device_control_flow.py")
  }
}
