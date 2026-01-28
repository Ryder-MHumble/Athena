# ==============================================================================
# Athena 停止脚本 (PowerShell 版本)
# 功能：停止所有运行中的前后端服务
# ==============================================================================

# 设置控制台编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 项目根目录
$PROJECT_DIR = $PSScriptRoot
$BACKEND_PID_FILE = Join-Path $PROJECT_DIR ".backend.pid"
$FRONTEND_PID_FILE = Join-Path $PROJECT_DIR ".frontend.pid"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   正在停止 Athena 服务" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$stopped = $false

# 停止后端作业
if (Test-Path $BACKEND_PID_FILE) {
    Write-Host "[1/2] 停止后端服务..." -ForegroundColor Yellow
    $backendJobId = Get-Content $BACKEND_PID_FILE -Raw -ErrorAction SilentlyContinue
    if ($null -ne $backendJobId) {
        $backendJobId = $backendJobId.Trim()
        try {
            $job = Get-Job -Id $backendJobId -ErrorAction SilentlyContinue
            if ($null -ne $job) {
                Stop-Job -Id $backendJobId -ErrorAction SilentlyContinue
                Remove-Job -Id $backendJobId -Force -ErrorAction SilentlyContinue
                Write-Host "      [OK] 后端服务已停止" -ForegroundColor Green
                $stopped = $true
            }
        } catch {
            # 忽略错误
        }
    }
    Remove-Item $BACKEND_PID_FILE -Force -ErrorAction SilentlyContinue
}

# 停止前端作业
if (Test-Path $FRONTEND_PID_FILE) {
    Write-Host "[2/2] 停止前端服务..." -ForegroundColor Yellow
    $frontendJobId = Get-Content $FRONTEND_PID_FILE -Raw -ErrorAction SilentlyContinue
    if ($null -ne $frontendJobId) {
        $frontendJobId = $frontendJobId.Trim()
        try {
            $job = Get-Job -Id $frontendJobId -ErrorAction SilentlyContinue
            if ($null -ne $job) {
                Stop-Job -Id $frontendJobId -ErrorAction SilentlyContinue
                Remove-Job -Id $frontendJobId -Force -ErrorAction SilentlyContinue
                Write-Host "      [OK] 前端服务已停止" -ForegroundColor Green
                $stopped = $true
            }
        } catch {
            # 忽略错误
        }
    }
    Remove-Item $FRONTEND_PID_FILE -Force -ErrorAction SilentlyContinue
}

# 清理可能的残留进程
Write-Host ""
Write-Host "清理残留进程..." -ForegroundColor Yellow

$cleaned = $false

Get-Process python* -ErrorAction SilentlyContinue | Where-Object {
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
        $null -ne $cmdLine -and ($cmdLine -like "*uvicorn*" -or $cmdLine -like "*run.py*")
    } catch {
        $false
    }
} | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    $cleaned = $true
}

Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
        $null -ne $cmdLine -and $cmdLine -like "*next*dev*"
    } catch {
        $false
    }
} | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    $cleaned = $true
}

if ($cleaned) {
    Write-Host "      [OK] 残留进程已清理" -ForegroundColor Green
}

Write-Host ""
if ($stopped -or $cleaned) {
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "   [SUCCESS] 所有服务已停止" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host "=========================================" -ForegroundColor Yellow
    Write-Host "   没有发现运行中的服务" -ForegroundColor Yellow
    Write-Host "=========================================" -ForegroundColor Yellow
}
Write-Host ""
