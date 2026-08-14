# 廿七 · 一键部署脚本（推送到 GitHub）
# 用法：在项目目录运行  powershell -ExecutionPolicy Bypass -File deploy.ps1
# 或直接在 PowerShell 中：  .\deploy.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "========================================"
Write-Host "  廿七 · 提示词工坊 — GitHub 部署脚本"
Write-Host "========================================"
Write-Host ""

# 1. 检查 git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[错误] 未检测到 git。请先安装: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

# 2. 初始化仓库（如果还没有）
if (-not (Test-Path ".git")) {
    Write-Host "[1/5] 初始化 git 仓库..."
    git init
    git branch -M main
} else {
    Write-Host "[1/5] git 仓库已存在"
}

# 3. 配置用户信息（如果未配置）
$userName = git config user.name
if (-not $userName) {
    Write-Host "[2/5] 配置 git 用户信息..."
    $name = Read-Host "  请输入你的 GitHub 用户名"
    $email = Read-Host "  请输入你的 GitHub 邮箱（任意邮箱即可）"
    git config user.name $name
    git config user.email $email
} else {
    Write-Host "[2/5] git 用户信息已配置: $userName"
}

# 4. 提交所有文件
Write-Host "[3/5] 暂存并提交文件..."
git add .
git commit -m "廿七 · 提示词工坊 v2（电影感规则 + 风格系统 + 双栏布局 + 公网部署准备）"

# 5. 关联远程仓库
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "[4/5] 配置远程仓库..."
    $repoUrl = Read-Host "  请输入你的 GitHub 仓库地址（形如 https://github.com/用户名/nianqi.git，需先在 GitHub 网页新建空仓库）"
    git remote add origin $repoUrl
} else {
    Write-Host "[4/5] 远程仓库已配置: $remote"
}

# 6. 推送
Write-Host "[5/5] 推送到 GitHub..."
git push -u origin main

Write-Host ""
Write-Host "========================================"
Write-Host "  ✅ 推送完成！"
Write-Host "  下一步：打开 https://zeabur.com 用 Google 账号登录，"
Write-Host "  新建项目 → 从 GitHub 导入本仓库 → 部署"
Write-Host "  部署后在「变量」配置:"
Write-Host "    LLM_API_KEY   = sk-你的DeepSeekKey"
Write-Host "    LLM_BASE_URL  = https://api.deepseek.com"
Write-Host "    LLM_MODEL     = deepseek-chat"
Write-Host "========================================"
Write-Host ""
