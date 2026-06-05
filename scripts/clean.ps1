$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$Targets = @(
  "frontend\node_modules",
  "frontend\dist",
  "frontend\.vite",
  "front-end",
  "backend\target",
  "ai-service\.venv",
  "ai-service\venv",
  "ai-service\__pycache__",
  "iot-edge\__pycache__"
)

foreach ($Target in $Targets) {
  $Path = Join-Path $Root $Target
  if (-not (Test-Path -LiteralPath $Path)) {
    continue
  }

  $Resolved = (Resolve-Path -LiteralPath $Path).Path
  if (-not $Resolved.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to delete outside workspace: $Resolved"
  }

  Write-Host "Removing $Resolved"
  Remove-Item -LiteralPath $Resolved -Recurse -Force
}
