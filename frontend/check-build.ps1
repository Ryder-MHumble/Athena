# 前端构建检查脚本 (Windows PowerShell 版本)
# 用于在提交前本地测试是否有 TypeScript 类型错误

Write-Host "🔍 检查前端代码..." -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "📦 安装依赖..." -ForegroundColor Yellow
npm install --legacy-peer-deps | Out-Null

Write-Host ""
Write-Host "🔧 运行 TypeScript 类型检查..." -ForegroundColor Yellow
npx tsc --noEmit

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ TypeScript 类型检查通过" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ TypeScript 类型检查失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "请修复上述类型错误后再提交代码" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🏗️  运行生产构建测试..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 构建成功！可以安全提交代码" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "❌ 构建失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "请修复上述错误后再提交代码" -ForegroundColor Yellow
    exit 1
}


