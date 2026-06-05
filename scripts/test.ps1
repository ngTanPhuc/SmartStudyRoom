$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

Push-Location (Join-Path $Root "backend")
mvn test
Pop-Location

Push-Location (Join-Path $Root "frontend")
npm.cmd run build
Pop-Location

Push-Location (Join-Path $Root "ai-service")
python -m py_compile service.py app\*.py tests\*.py
python -m unittest discover -s tests
Pop-Location

Push-Location (Join-Path $Root "iot-edge")
python -m py_compile gateway.py app\*.py tests\*.py
python -m unittest discover -s tests
Pop-Location
