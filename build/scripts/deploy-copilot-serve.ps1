# team_v1.7 — Deploy copilot-serve into SMC Copilot runtime directory
param(
    [string]$InstallRoot = "$env:LOCALAPPDATA\Programs\SMC Copilot",
    [string]$RepoUrl = "https://github.com/loudon84/ai-os-serve.git",
    [string]$Branch = "master",
    [int]$Port = 8765,
    [switch]$Force,
    [switch]$RestartDesktop
)

$ErrorActionPreference = "Stop"

$ServeRoot = Join-Path $InstallRoot "runtime\copilot-serve"
$DeployLog = Join-Path $InstallRoot "runtime\logs\deploy-copilot-serve.log"
$StateFile = Join-Path $ServeRoot "deploy-state.json"

function Assert-LastExit([string]$Step) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Step failed with exit code $LASTEXITCODE"
    }
}

function Write-DeployLog([string]$Message) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
    Write-Host $line
    $logDir = Split-Path $DeployLog -Parent
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    Add-Content -Path $DeployLog -Value $line
}

function Test-WindowsVersion {
    $ver = [System.Environment]::OSVersion.Version
    if ($ver.Major -lt 10) {
        throw "Windows 10 or later required (detected $($ver.Major).$($ver.Minor))"
    }
}

function Test-Git {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "Git not found. Install Git for Windows and ensure git is on PATH."
    }
}

function Get-Python312 {
    $candidates = @(
        @{ Cmd = "py"; Args = @("-3.12") },
        @{ Cmd = "python"; Args = @() }
    )
    foreach ($c in $candidates) {
        try {
            $out = & $c.Cmd @($c.Args + "--version") 2>&1 | Out-String
            if ($out -match "3\.12") {
                return $c
            }
        } catch { }
    }
    throw "Python 3.12 not found. Install Python 3.12.x."
}

function Ensure-Uv {
    if (Get-Command uv -ErrorAction SilentlyContinue) { return }
    Write-DeployLog "Installing uv via pip..."
    $py = Get-Python312
    & $py.Cmd @($py.Args + "-m", "pip", "install", "uv")
    if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
        throw "uv not available after install"
    }
}

function Sync-Repo {
    New-Item -ItemType Directory -Path $ServeRoot -Force | Out-Null
    if (Test-Path (Join-Path $ServeRoot ".git")) {
        Write-DeployLog "git pull in $ServeRoot"
        Push-Location $ServeRoot
        try {
            & git fetch origin $Branch 2>&1 | ForEach-Object { Write-DeployLog $_ }
            & git checkout $Branch 2>&1 | ForEach-Object { Write-DeployLog $_ }
            & git pull origin $Branch 2>&1 | ForEach-Object { Write-DeployLog $_ }
        } finally {
            Pop-Location
        }
    } else {
        if ($Force -and (Test-Path $ServeRoot) -and ((Get-ChildItem $ServeRoot -Force | Measure-Object).Count -gt 0)) {
            Write-DeployLog "Force: clearing $ServeRoot"
            Remove-Item -Recurse -Force (Join-Path $ServeRoot "*") -ErrorAction SilentlyContinue
        }
        Write-DeployLog "git clone $RepoUrl -> $ServeRoot"
        & git clone --branch $Branch --depth 1 $RepoUrl $ServeRoot 2>&1 | ForEach-Object { Write-DeployLog $_ }
    }
    if (-not (Test-Path (Join-Path $ServeRoot "pyproject.toml"))) {
        throw "pyproject.toml missing after clone"
    }
}

function Write-ServeEnv {
    $hermesHome = Join-Path $env:USERPROFILE ".hermes"
    $sqlite = Join-Path $hermesHome "desktop\sqlite.db"
    $envContent = @"
COPILOT_HOST=127.0.0.1
COPILOT_PORT=$Port

SQLITE_PATH=$sqlite
HERMES_HOME=$hermesHome
LOG_DIR=./data/logs

DEFAULT_GATEWAY_PORT=8642
HERMES_GATEWAY_COMMAND=hermes gateway

AIOS_TEAM_HUB_USE_STUB=true

COPILOT_REQUIRE_TOKEN=false
CORS_ALLOW_ORIGINS=http://127.0.0.1,http://localhost
"@
    $envPath = Join-Path $ServeRoot ".env"
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-DeployLog "Wrote $envPath"
}

function Set-UserEnvVars {
    $venvPython = Join-Path $ServeRoot ".venv\Scripts\python.exe"
    [Environment]::SetEnvironmentVariable("COPILOT_SERVE_ROOT", $ServeRoot, "User")
    [Environment]::SetEnvironmentVariable("COPILOT_SERVE_PYTHON", $venvPython, "User")
    [Environment]::SetEnvironmentVariable("COPILOT_SERVE_PORT", [string]$Port, "User")
    Write-DeployLog "Set user env: COPILOT_SERVE_ROOT, COPILOT_SERVE_PYTHON, COPILOT_SERVE_PORT"
}

function Write-DeployState([string]$Status, [string]$ErrorMsg = $null) {
    $state = @{
        status = $Status
        completedAt = (Get-Date).ToString("o")
        serveRoot = $ServeRoot
        port = $Port
        branch = $Branch
        error = $ErrorMsg
    }
    $state | ConvertTo-Json | Set-Content -Path $StateFile -Encoding UTF8
}

try {
    Write-DeployLog "=== deploy-copilot-serve start ==="
    Write-DeployLog "InstallRoot=$InstallRoot ServeRoot=$ServeRoot"

    Test-WindowsVersion
    Test-Git
    $null = Get-Python312
    Ensure-Uv

    New-Item -ItemType Directory -Path (Join-Path $InstallRoot "runtime\logs") -Force | Out-Null
    Sync-Repo

    Push-Location $ServeRoot
    try {
        if ($Force -and (Test-Path ".venv")) {
            Remove-Item -Recurse -Force ".venv"
        }
        if (-not (Test-Path ".venv\Scripts\python.exe")) {
            Write-DeployLog "uv venv --python 3.12"
            & uv venv --python 3.12 2>&1 | ForEach-Object { Write-DeployLog $_ }
            Assert-LastExit "uv venv"
        }
        Write-DeployLog "uv sync --extra service"
        & uv sync --extra service 2>&1 | ForEach-Object { Write-DeployLog $_ }
        Assert-LastExit "uv sync --extra service"

        Write-ServeEnv

        Write-DeployLog "alembic upgrade head"
        & uv run alembic upgrade head 2>&1 | ForEach-Object { Write-DeployLog $_ }
        Assert-LastExit "alembic upgrade head"
    } finally {
        Pop-Location
    }

    Set-UserEnvVars
    Write-DeployState "success"

    if ($RestartDesktop) {
        $desktopExe = Join-Path $InstallRoot "smc-ai-copilot.exe"
        if (Test-Path $desktopExe) {
            Write-DeployLog "Restarting SMC Copilot..."
            Get-Process -Name "smc-ai-copilot" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            Start-Process $desktopExe
        }
    }

    Write-DeployLog "=== deploy-copilot-serve success ==="
} catch {
    Write-DeployLog "ERROR: $_"
    Write-DeployState "failed" $_.ToString()
    throw
}
