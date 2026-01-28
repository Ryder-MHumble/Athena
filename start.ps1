# ==============================================================================
# Athena 一键启动脚本 (PowerShell 版本)
# 功能：自动检测并安装所需环境，启动前后端服务，自动打开浏览器
# 支持：Windows PowerShell 5.1+ / PowerShell Core 7+
# ==============================================================================

# 设置控制台编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 设置错误处理
$ErrorActionPreference = "Stop"

# 项目根目录
$PROJECT_DIR = $PSScriptRoot
$BACKEND_DIR = Join-Path $PROJECT_DIR "backend"
$FRONTEND_DIR = Join-Path $PROJECT_DIR "frontend"

# PID 文件
$BACKEND_PID_FILE = Join-Path $PROJECT_DIR ".backend.pid"
$FRONTEND_PID_FILE = Join-Path $PROJECT_DIR ".frontend.pid"

# 日志文件
$BACKEND_LOG = Join-Path $PROJECT_DIR ".backend.log"
$FRONTEND_LOG = Join-Path $PROJECT_DIR ".frontend.log"

# 最低版本要求
$MIN_NODE_VERSION = 18
$MIN_PYTHON_VERSION = "3.9"

# ==============================================================================
# 工具函数
# ==============================================================================

function Write-Banner {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                              ║" -ForegroundColor Cyan
    Write-Host "║     █████╗ ████████╗██╗  ██╗███████╗███╗   ██╗ █████╗       ║" -ForegroundColor Cyan
    Write-Host "║    ██╔══██╗╚══██╔══╝██║  ██║██╔════╝████╗  ██║██╔══██╗      ║" -ForegroundColor Cyan
    Write-Host "║    ███████║   ██║   ███████║█████╗  ██╔██╗ ██║███████║      ║" -ForegroundColor Cyan
    Write-Host "║    ██╔══██║   ██║   ██╔══██║██╔══╝  ██║╚██╗██║██╔══██║      ║" -ForegroundColor Cyan
    Write-Host "║    ██║  ██║   ██║   ██║  ██║███████╗██║ ╚████║██║  ██║      ║" -ForegroundColor Cyan
    Write-Host "║    ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝      ║" -ForegroundColor Cyan
    Write-Host "║                                                              ║" -ForegroundColor Cyan
    Write-Host "║              AI 战略分析师智能工作台                         ║" -ForegroundColor Cyan
    Write-Host "║                                                              ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "--- $Message ---" -ForegroundColor Cyan
    Write-Host ""
}

# ==============================================================================
# 环境检测与安装
# ==============================================================================

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Get-PythonVersion {
    param([string]$Command)
    try {
        $version = & $Command --version 2>&1
        if ($version -match '(\d+\.\d+)') {
            return $matches[1]
        }
    } catch {
        return $null
    }
    return $null
}

function Test-VersionGte {
    param([string]$Version1, [string]$Version2)
    $v1 = [Version]$Version1
    $v2 = [Version]$Version2
    return $v1 -ge $v2
}

function Check-InstallPython {
    Write-Step "检查 Python 环境"
    
    $pythonCmd = $null
    
    # 检查各种 Python 命令
    foreach ($cmd in @("python", "python3", "py")) {
        if (Test-Command $cmd) {
            $version = Get-PythonVersion $cmd
            if ($version -and (Test-VersionGte $version $MIN_PYTHON_VERSION)) {
                $pythonCmd = $cmd
                Write-Success "找到 Python $version ($cmd)"
                break
            }
        }
    }
    
    if (-not $pythonCmd) {
        Write-ErrorMsg "未检测到 Python $MIN_PYTHON_VERSION+ 环境"
        Write-Host ""
        Write-Info "请按照以下步骤安装 Python:"
        Write-Host "  1. 访问: " -NoNewline
        Write-Host "https://www.python.org/downloads/" -ForegroundColor Green
        Write-Host "  2. 下载 Python 3.9 或更高版本"
        Write-Host "  3. 安装时勾选 'Add Python to PATH'"
        Write-Host "  4. 安装完成后重启终端并重新运行此脚本"
        Write-Host ""
        exit 1
    }
    
    # 检查 pip
    try {
        & $pythonCmd -m pip --version 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "pip 已就绪"
        } else {
            throw "pip not working"
        }
    } catch {
        Write-Warn "正在配置 pip..."
        & $pythonCmd -m ensurepip --upgrade 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "ensurepip 失败，尝试使用 get-pip.py"
            $pipInstaller = Join-Path $env:TEMP "get-pip.py"
            Invoke-WebRequest -Uri "https://bootstrap.pypa.io/get-pip.py" -OutFile $pipInstaller
            & $pythonCmd $pipInstaller
            Remove-Item $pipInstaller -ErrorAction SilentlyContinue
        }
        Write-Success "pip 配置完成"
    }
    
    # 导出 Python 命令供后续使用
    $script:PYTHON_CMD = $pythonCmd
}

function Get-NodeVersion {
    try {
        $version = node --version
        if ($version -match 'v(\d+)') {
            return [int]$matches[1]
        }
    } catch {
        return $null
    }
    return $null
}

function Check-InstallNode {
    Write-Step "检查 Node.js 环境"
    
    if (Test-Command "node") {
        $version = Get-NodeVersion
        if ($version -and $version -ge $MIN_NODE_VERSION) {
            $nodeVersion = node --version
            Write-Success "Node.js $nodeVersion 已安装"
            
            # 检查 npm
            if (Test-Command "npm") {
                $npmVersion = npm --version
                Write-Success "npm $npmVersion 已就绪"
                return
            } else {
                Write-ErrorMsg "npm 未找到，请重新安装 Node.js"
                exit 1
            }
        }
    }
    
    Write-ErrorMsg "未检测到 Node.js $MIN_NODE_VERSION+"
    Write-Info "Windows 用户请手动安装 Node.js: https://nodejs.org/"
    Write-Info "推荐下载 LTS 版本，安装完成后请重新运行此脚本"
    exit 1
}

# ==============================================================================
# 项目依赖安装
# ==============================================================================

function Install-BackendDeps {
    Write-Step "检查后端依赖"
    
    Push-Location $BACKEND_DIR
    
    try {
        $reqFile = Join-Path $BACKEND_DIR "requirements.txt"
        $depsFile = Join-Path $BACKEND_DIR ".deps_installed"
        
        # 检查是否需要安装（基于 requirements.txt 的哈希值）
        $needInstall = $true
        if (Test-Path $reqFile) {
            $reqHash = (Get-FileHash $reqFile -Algorithm MD5).Hash
            
            if (Test-Path $depsFile) {
                $installedHash = Get-Content $depsFile -Raw -ErrorAction SilentlyContinue
                if ($null -ne $installedHash -and $reqHash -eq $installedHash.Trim()) {
                    Write-Success "后端依赖已是最新版本"
                    $needInstall = $false
                }
            }
        }
        
        if ($needInstall) {
            Write-Info "正在安装 Python 依赖包，这可能需要几分钟..."
            Write-Host ""
            
            # 升级 pip（静默模式，避免大量输出）
            Write-Host "  [1/2] 升级 pip..." -ForegroundColor Cyan
            & $PYTHON_CMD -m pip install --upgrade pip --quiet 2>&1 | Out-Null
            
            # 安装依赖
            Write-Host "  [2/2] 安装项目依赖..." -ForegroundColor Cyan
            $installOutput = & $PYTHON_CMD -m pip install -r requirements.txt --quiet 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                # 记录安装的依赖版本
                $reqHash = (Get-FileHash $reqFile -Algorithm MD5).Hash
                $reqHash | Out-File $depsFile -NoNewline -Encoding UTF8
                Write-Host ""
                Write-Success "后端依赖安装完成"
            } else {
                Write-Host ""
                Write-ErrorMsg "后端依赖安装失败"
                Write-Host ""
                Write-Host "错误信息:" -ForegroundColor Yellow
                Write-Host $installOutput
                Write-Host ""
                Write-Info "请尝试手动安装:"
                Write-Host "  cd backend" -ForegroundColor Gray
                Write-Host "  pip install -r requirements.txt" -ForegroundColor Gray
                Write-Host ""
                exit 1
            }
        }
    } finally {
        Pop-Location
    }
}

function Install-FrontendDeps {
    Write-Step "检查前端依赖"
    
    Push-Location $FRONTEND_DIR
    
    try {
        $pkgFile = Join-Path $FRONTEND_DIR "package.json"
        $depsFile = Join-Path $FRONTEND_DIR ".deps_installed"
        
        # 检查是否需要安装
        $needInstall = $true
        if ((Test-Path "node_modules") -and (Test-Path $pkgFile)) {
            $pkgHash = (Get-FileHash $pkgFile -Algorithm MD5).Hash
            
            if (Test-Path $depsFile) {
                $installedHash = Get-Content $depsFile -Raw -ErrorAction SilentlyContinue
                if ($null -ne $installedHash -and $pkgHash -eq $installedHash.Trim()) {
                    Write-Success "前端依赖已是最新版本"
                    $needInstall = $false
                }
            }
        }
        
        if ($needInstall) {
            Write-Info "正在安装 Node.js 依赖包，这可能需要几分钟..."
            Write-Host ""
            
            # 使用 npm install 并显示进度
            Write-Host "  安装进行中，请稍候..." -ForegroundColor Cyan
            
            # 创建临时输出文件
            $tempOutput = Join-Path $env:TEMP "athena_npm_install.log"
            
            # 运行 npm install
            $process = Start-Process -FilePath "npm" `
                -ArgumentList "install", "--legacy-peer-deps" `
                -WorkingDirectory $FRONTEND_DIR `
                -NoNewWindow `
                -Wait `
                -PassThru `
                -RedirectStandardOutput $tempOutput `
                -RedirectStandardError $tempOutput
            
            # 检查退出码
            if ($process.ExitCode -eq 0) {
                # 记录安装的依赖版本
                $pkgHash = (Get-FileHash $pkgFile -Algorithm MD5).Hash
                $pkgHash | Out-File $depsFile -NoNewline -Encoding UTF8
                Write-Host ""
                Write-Success "前端依赖安装完成"
                
                # 清理临时文件
                Remove-Item $tempOutput -ErrorAction SilentlyContinue
            } else {
                Write-Host ""
                Write-ErrorMsg "前端依赖安装失败 (退出码: $($process.ExitCode))"
                Write-Host ""
                Write-Host "错误日志:" -ForegroundColor Yellow
                if (Test-Path $tempOutput) {
                    Get-Content $tempOutput | Select-Object -Last 20
                }
                Write-Host ""
                Write-Info "请尝试手动安装:"
                Write-Host "  cd frontend" -ForegroundColor Gray
                Write-Host "  npm install --legacy-peer-deps" -ForegroundColor Gray
                Write-Host ""
                exit 1
            }
        }
    } finally {
        Pop-Location
    }
}

# ==============================================================================
# 环境配置文件
# ==============================================================================

function Setup-EnvFiles {
    Write-Step "检查配置文件"
    
    # 后端 .env 文件
    $backendEnv = Join-Path $BACKEND_DIR ".env"
    if (-not (Test-Path $backendEnv)) {
        Write-Warn "后端 .env 文件不存在，正在创建..."
        @"
# Athena 后端配置文件
# 请根据需要修改以下配置

# Supabase 配置 (用于知识库向量检索)
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# 其他配置（可选）
# DEBUG=true
"@ | Out-File $backendEnv -Encoding UTF8
        Write-Info "已创建 backend/.env 文件"
        Write-Warn "请在设置页面配置 SiliconFlow API Key"
    } else {
        Write-Success "后端 .env 文件已存在"
    }
    
    # 前端 .env.local 文件
    $frontendEnv = Join-Path $FRONTEND_DIR ".env.local"
    if (-not (Test-Path $frontendEnv)) {
        Write-Warn "前端 .env.local 文件不存在，正在创建..."
        @"
# Athena 前端配置文件

# 后端 API 地址
NEXT_PUBLIC_API_URL=http://localhost:8000
"@ | Out-File $frontendEnv -Encoding UTF8
        Write-Info "已创建 frontend/.env.local 文件"
    } else {
        Write-Success "前端 .env.local 文件已存在"
    }
}

# ==============================================================================
# 服务启动
# ==============================================================================

function Stop-Services {
    Write-Host ""
    Write-Warn "正在停止服务..."
    
    # 停止后端作业
    if (Test-Path $BACKEND_PID_FILE) {
        $backendJobId = Get-Content $BACKEND_PID_FILE -Raw -ErrorAction SilentlyContinue
        if ($null -ne $backendJobId) {
            $backendJobId = $backendJobId.Trim()
            try {
                $job = Get-Job -Id $backendJobId -ErrorAction SilentlyContinue
                if ($null -ne $job) {
                    Stop-Job -Id $backendJobId -ErrorAction SilentlyContinue
                    Remove-Job -Id $backendJobId -Force -ErrorAction SilentlyContinue
                    Write-Host "  后端服务已停止" -ForegroundColor Gray
                }
            } catch {
                # 忽略错误
            }
        }
        Remove-Item $BACKEND_PID_FILE -Force -ErrorAction SilentlyContinue
    }
    
    # 停止前端作业
    if (Test-Path $FRONTEND_PID_FILE) {
        $frontendJobId = Get-Content $FRONTEND_PID_FILE -Raw -ErrorAction SilentlyContinue
        if ($null -ne $frontendJobId) {
            $frontendJobId = $frontendJobId.Trim()
            try {
                $job = Get-Job -Id $frontendJobId -ErrorAction SilentlyContinue
                if ($null -ne $job) {
                    Stop-Job -Id $frontendJobId -ErrorAction SilentlyContinue
                    Remove-Job -Id $frontendJobId -Force -ErrorAction SilentlyContinue
                    Write-Host "  前端服务已停止" -ForegroundColor Gray
                }
            } catch {
                # 忽略错误
            }
        }
        Remove-Item $FRONTEND_PID_FILE -Force -ErrorAction SilentlyContinue
    }
    
    # 清理可能的残留进程
    Write-Host "  清理残留进程..." -ForegroundColor Gray
    
    Get-Process python* -ErrorAction SilentlyContinue | Where-Object {
        try {
            $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
            $null -ne $cmdLine -and ($cmdLine -like "*uvicorn*" -or $cmdLine -like "*run.py*")
        } catch {
            $false
        }
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Get-Process node -ErrorAction SilentlyContinue | Where-Object {
        try {
            $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
            $null -ne $cmdLine -and $cmdLine -like "*next*dev*"
        } catch {
            $false
        }
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Success "所有服务已停止"
}

# 注册清理函数（Ctrl+C 时调用）
trap {
    Stop-Services
    break
}

function Start-Backend {
    Write-Step "启动后端服务"
    
    Push-Location $BACKEND_DIR
    
    try {
        # 启动后端（使用后台作业）
        Write-Info "正在启动后端服务..."
        
        # 使用 Start-Job 启动后端
        $job = Start-Job -ScriptBlock {
            param($pythonCmd, $backendDir, $logFile)
            Set-Location $backendDir
            & $pythonCmd run.py 2>&1 | Tee-Object -FilePath $logFile
        } -ArgumentList $PYTHON_CMD, $BACKEND_DIR, $BACKEND_LOG
        
        # 保存 Job ID
        $job.Id | Out-File $BACKEND_PID_FILE -NoNewline -Encoding UTF8
        
        # 等待后端启动
        Write-Info "等待后端服务启动..."
        $dots = ""
        $maxAttempts = 40
        $startTime = Get-Date
        
        for ($i = 1; $i -le $maxAttempts; $i++) {
            # 检查作业状态
            $currentJob = Get-Job -Id $job.Id -ErrorAction SilentlyContinue
            if ($null -eq $currentJob -or $currentJob.State -eq "Failed") {
                Write-Host ""
                Write-ErrorMsg "后端服务启动失败"
                Write-Host ""
                Write-Host "请查看日志文件获取详细信息:" -ForegroundColor Yellow
                Write-Host "  $BACKEND_LOG" -ForegroundColor Cyan
                Write-Host ""
                if (Test-Path $BACKEND_LOG) {
                    Write-Host "最后 10 行日志:" -ForegroundColor Yellow
                    Get-Content $BACKEND_LOG -Tail 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
                }
                exit 1
            }
            
            # 尝试连接健康检查端点
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    $elapsed = ((Get-Date) - $startTime).TotalSeconds
                    Write-Host ""
                    Write-Success "后端服务已启动 (端口: 8000, 耗时: $([math]::Round($elapsed, 1))s)"
                    return
                }
            } catch {
                # 继续等待
            }
            
            $dots += "."
            if ($dots.Length -gt 10) { $dots = "." }
            Write-Host "`r  等待中$dots   " -NoNewline -ForegroundColor Cyan
            Start-Sleep -Seconds 1
        }
        
        Write-Host ""
        Write-ErrorMsg "后端服务启动超时（已等待 $maxAttempts 秒）"
        Write-Host ""
        Write-Host "请检查:" -ForegroundColor Yellow
        Write-Host "  1. 端口 8000 是否被占用" -ForegroundColor Gray
        Write-Host "  2. Python 依赖是否正确安装" -ForegroundColor Gray
        Write-Host "  3. 查看日志: " -NoNewline -ForegroundColor Gray
        Write-Host "$BACKEND_LOG" -ForegroundColor Cyan
        Write-Host ""
        exit 1
    } finally {
        Pop-Location
    }
}

function Start-Frontend {
    Write-Step "启动前端服务"
    
    Push-Location $FRONTEND_DIR
    
    try {
        # 启动前端（使用后台作业）
        Write-Info "正在启动前端服务..."
        
        # 使用 Start-Job 启动前端
        $job = Start-Job -ScriptBlock {
            param($frontendDir, $logFile)
            Set-Location $frontendDir
            & npm run dev 2>&1 | Tee-Object -FilePath $logFile
        } -ArgumentList $FRONTEND_DIR, $FRONTEND_LOG
        
        # 保存 Job ID
        $job.Id | Out-File $FRONTEND_PID_FILE -NoNewline -Encoding UTF8
        
        # 等待前端启动
        Write-Info "等待前端服务启动（Next.js 首次启动可能需要较长时间）..."
        $dots = ""
        $maxAttempts = 80
        $startTime = Get-Date
        
        for ($i = 1; $i -le $maxAttempts; $i++) {
            # 检查作业状态
            $currentJob = Get-Job -Id $job.Id -ErrorAction SilentlyContinue
            if ($null -eq $currentJob -or $currentJob.State -eq "Failed") {
                Write-Host ""
                Write-ErrorMsg "前端服务启动失败"
                Write-Host ""
                Write-Host "请查看日志文件获取详细信息:" -ForegroundColor Yellow
                Write-Host "  $FRONTEND_LOG" -ForegroundColor Cyan
                Write-Host ""
                if (Test-Path $FRONTEND_LOG) {
                    Write-Host "最后 10 行日志:" -ForegroundColor Yellow
                    Get-Content $FRONTEND_LOG -Tail 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
                }
                exit 1
            }
            
            # 尝试连接前端服务
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    $elapsed = ((Get-Date) - $startTime).TotalSeconds
                    Write-Host ""
                    Write-Success "前端服务已启动 (端口: 3000, 耗时: $([math]::Round($elapsed, 1))s)"
                    return
                }
            } catch {
                # 继续等待
            }
            
            $dots += "."
            if ($dots.Length -gt 10) { $dots = "." }
            Write-Host "`r  等待中$dots   " -NoNewline -ForegroundColor Cyan
            Start-Sleep -Seconds 1
        }
        
        Write-Host ""
        Write-ErrorMsg "前端服务启动超时（已等待 $maxAttempts 秒）"
        Write-Host ""
        Write-Host "请检查:" -ForegroundColor Yellow
        Write-Host "  1. 端口 3000 是否被占用" -ForegroundColor Gray
        Write-Host "  2. Node.js 依赖是否正确安装" -ForegroundColor Gray
        Write-Host "  3. 查看日志: " -NoNewline -ForegroundColor Gray
        Write-Host "$FRONTEND_LOG" -ForegroundColor Cyan
        Write-Host ""
        exit 1
    } finally {
        Pop-Location
    }
}

function Open-Browser {
    Start-Sleep -Seconds 2
    
    Write-Info "正在打开浏览器..."
    try {
        Start-Process "http://localhost:3000"
    } catch {
        Write-Warn "无法自动打开浏览器，请手动访问: http://localhost:3000"
    }
}

# ==============================================================================
# 主函数
# ==============================================================================

function Main {
    Write-Banner
    
    # 检查是否已有服务运行
    if ((Test-Path $BACKEND_PID_FILE) -or (Test-Path $FRONTEND_PID_FILE)) {
        Write-Warn "检测到已有服务运行，正在停止..."
        Stop-Services
        Start-Sleep -Seconds 2
    }
    
    # 环境检测与安装
    Check-InstallPython
    Check-InstallNode
    
    # 安装项目依赖
    Install-BackendDeps
    Install-FrontendDeps
    
    # 配置文件检查
    Setup-EnvFiles
    
    # 启动服务
    Start-Backend
    Start-Frontend
    Open-Browser
    
    # 显示成功信息
    Write-Host ""
    Write-Host "=============================================================" -ForegroundColor Green
    Write-Host "                                                             " -ForegroundColor Green
    Write-Host "                  Athena 启动成功！                          " -ForegroundColor Green
    Write-Host "                                                             " -ForegroundColor Green
    Write-Host "=============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "服务地址:" -ForegroundColor White
    Write-Host "  前端应用    →  " -NoNewline
    Write-Host "http://localhost:3000" -ForegroundColor Green
    Write-Host "  后端 API    →  " -NoNewline
    Write-Host "http://localhost:8000" -ForegroundColor Green
    Write-Host "  API 文档    →  " -NoNewline
    Write-Host "http://localhost:8000/docs" -ForegroundColor Green
    Write-Host ""
    Write-Host "日志文件:" -ForegroundColor White
    Write-Host "  后端日志    →  " -NoNewline
    Write-Host ".backend.log" -ForegroundColor Yellow
    Write-Host "  前端日志    →  " -NoNewline
    Write-Host ".frontend.log" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "首次使用:" -ForegroundColor White
    Write-Host "  1. 访问 " -NoNewline
    Write-Host "http://localhost:3000/settings" -ForegroundColor Green
    Write-Host "  2. 配置你的 " -NoNewline
    Write-Host "SiliconFlow API Key" -ForegroundColor Yellow
    Write-Host "  3. 开始使用所有功能！"
    Write-Host ""
    Write-Warn "按 Ctrl+C 停止所有服务"
    Write-Host ""
    
    # 保持脚本运行
    try {
        while ($true) {
            Start-Sleep -Seconds 5
            
            # 检查后端作业是否还在运行
            if (Test-Path $BACKEND_PID_FILE) {
                $backendJobId = Get-Content $BACKEND_PID_FILE -Raw -ErrorAction SilentlyContinue
                if ($null -ne $backendJobId) {
                    $backendJobId = $backendJobId.Trim()
                    $job = Get-Job -Id $backendJobId -ErrorAction SilentlyContinue
                    if ($null -eq $job -or $job.State -eq "Failed" -or $job.State -eq "Completed") {
                        Write-Host ""
                        Write-ErrorMsg "后端服务意外停止"
                        Write-Host ""
                        Write-Host "查看日志:" -ForegroundColor Yellow
                        Write-Host "  $BACKEND_LOG" -ForegroundColor Cyan
                        Write-Host ""
                        Stop-Services
                        exit 1
                    }
                }
            }
            
            # 检查前端作业是否还在运行
            if (Test-Path $FRONTEND_PID_FILE) {
                $frontendJobId = Get-Content $FRONTEND_PID_FILE -Raw -ErrorAction SilentlyContinue
                if ($null -ne $frontendJobId) {
                    $frontendJobId = $frontendJobId.Trim()
                    $job = Get-Job -Id $frontendJobId -ErrorAction SilentlyContinue
                    if ($null -eq $job -or $job.State -eq "Failed" -or $job.State -eq "Completed") {
                        Write-Host ""
                        Write-ErrorMsg "前端服务意外停止"
                        Write-Host ""
                        Write-Host "查看日志:" -ForegroundColor Yellow
                        Write-Host "  $FRONTEND_LOG" -ForegroundColor Cyan
                        Write-Host ""
                        Stop-Services
                        exit 1
                    }
                }
            }
        }
    } catch {
        Stop-Services
    }
}

# 运行主函数
try {
    Main
} catch {
    Write-ErrorMsg "启动失败: $_"
    Stop-Services
    exit 1
}

