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

# git/uv 常把进度写到 stderr；在 Stop 模式下会误报为失败，仅以 $LASTEXITCODE 为准。
function Invoke-DeployNative([string]$Step, [scriptblock]$Command) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & $Command 2>&1 | ForEach-Object {
            $text = if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.ToString() } else { "$_" }
            if ($text) { Write-DeployLog $text }
        }
        Assert-LastExit $Step
    } finally {
        $ErrorActionPreference = $prev
    }
}

function Invoke-DeployNativeRetry([string]$Step, [int]$MaxAttempts, [scriptblock]$Command) {
    $attempt = 0
    $lastError = $null
    while ($attempt -lt $MaxAttempts) {
        $attempt++
        try {
            if ($attempt -gt 1) {
                Write-DeployLog "$Step retry $attempt/$MaxAttempts..."
                Start-Sleep -Seconds ([Math]::Min(15, 3 * $attempt))
            }
            Invoke-DeployNative $Step $Command
            return
        } catch {
            $lastError = $_
            Write-DeployLog "$Step attempt $attempt failed: $_"
        }
    }
    throw $lastError
}

function Remove-ServeRootTree {
    if (Test-Path $ServeRoot) {
        Write-DeployLog "Removing $ServeRoot for fresh clone"
        Remove-Item -Recurse -Force $ServeRoot -ErrorAction Stop
    }
}

function Clone-ServeRepoFresh {
    $parent = Split-Path $ServeRoot -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Write-DeployLog "git clone $RepoUrl (branch $Branch) -> $ServeRoot"
    Invoke-DeployNativeRetry "git clone" 3 {
        git -c http.postBuffer=524288000 `
            -c http.lowSpeedLimit=0 `
            -c http.lowSpeedTime=999999 `
            -c http.version=HTTP/1.1 `
            clone --branch $Branch --depth 1 --single-branch $RepoUrl $ServeRoot
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
        @{ Cmd = "python"; Args = @() },
        @{ Cmd = "python3.12"; Args = @() },
        @{ Cmd = "py"; Args = @("-3.12") },
        @{ Cmd = "python3"; Args = @() }
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
    $pyproject = Join-Path $ServeRoot "pyproject.toml"
    $gitDir = Join-Path $ServeRoot ".git"
    $repoComplete = (Test-Path $pyproject) -and (Test-Path $gitDir)

    if ($Force -or -not $repoComplete) {
        Remove-ServeRootTree
        Clone-ServeRepoFresh
    } else {
        Write-DeployLog "git update in $ServeRoot (shallow fetch)"
        $updateFailed = $false
        Push-Location $ServeRoot
        try {
            Invoke-DeployNativeRetry "git fetch" 3 {
                git -c http.postBuffer=524288000 `
                    -c http.lowSpeedLimit=0 `
                    -c http.lowSpeedTime=999999 `
                    -c http.version=HTTP/1.1 `
                    fetch --depth 1 origin $Branch
            }
            Invoke-DeployNative "git checkout" { git checkout -f $Branch }
            Invoke-DeployNative "git reset" { git reset --hard "origin/$Branch" }
        } catch {
            Write-DeployLog "git update failed ($_), re-cloning fresh..."
            $updateFailed = $true
        } finally {
            Pop-Location
        }
        if ($updateFailed) {
            Remove-ServeRootTree
            Clone-ServeRepoFresh
        }
    }

    if (-not (Test-Path $pyproject)) {
        throw "pyproject.toml missing after sync (network or branch '$Branch' unavailable?)"
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
            Invoke-DeployNative "uv venv" { uv venv --python 3.12 }
        }
        Write-DeployLog "uv sync --extra service"
        Invoke-DeployNative "uv sync --extra service" { uv sync --extra service }

        Write-ServeEnv

        Write-DeployLog "alembic upgrade head"
        Invoke-DeployNative "alembic upgrade head" { uv run alembic upgrade head }
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
