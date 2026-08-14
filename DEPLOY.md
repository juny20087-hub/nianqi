# 廿七 · 公网部署指南（Zeabur）

> 目标：让廿七在公网可访问，任何电脑打开网址即用，无需安装任何东西。

## 部署前准备（已完成）

1. ✅ 移除 Google Fonts 依赖 → 改用系统字体栈（构建零网络依赖）
2. ✅ `.gitignore` 排除 `.env.local`（API Key 不会提交）
3. ✅ `.env.local.example` 保留可提交（示例配置）

## 部署步骤

### 1. 推送代码到 GitHub

在本地项目目录（`D:\deepseekharness\nianqi`）执行：

```bash
git init
git add .
git commit -m "廿七 · 提示词工坊 v2（电影感 + 风格系统 + 双栏布局）"
git branch -M main
git remote add origin https://github.com/<你的用户名>/nianqi.git
git push -u origin main
```

（如果已有仓库则直接 push）

### 2. 在 Zeabur 创建项目并关联仓库

1. 打开 https://zeabur.com 并登录（支持 Google 账号登录，与你 GitHub 同账号体系）
2. 新建项目 → 选择 **Git** 方式 → 关联 GitHub 账号
3. 选择刚才推送的 `nianqi` 仓库
4. Zeabur 自动识别为 Next.js 项目并开始构建

### 3. 配置环境变量（关键！）

在 Zeabur 项目的「变量」设置中添加：

| 变量名 | 值 | 说明 |
| --- | --- | --- |
| `LLM_API_KEY` | `sk-你的DeepSeekKey` | 必填，DeepSeek API Key |
| `LLM_BASE_URL` | `https://api.deepseek.com` | 可选，默认已内置 |
| `LLM_MODEL` | `deepseek-chat` | 可选，默认已内置 |

> ⚠️ 变量配置后需**重新部署**（Redeploy）才会生效。

### 4. 获取公网地址

部署完成后，Zeabur 会生成公网域名（如 `nianqi-xxxx.zeabur.app`）。
在项目「网络」设置中，为服务绑定该域名即可。

### 5. 验证

在**另一台电脑**（无任何本地文件）打开公网地址：
- ✅ 首页生图工坊正常（双栏布局 + 风格预设）
- ✅ 生成提示词成功（调用 DeepSeek API）
- ✅ `/frame` 坐标生成页正常
- ✅ 坐标页 → 生图页联动正常（localStorage 同域生效）

## 常见问题

### 构建失败：Google Fonts 下载超时
已通过系统字体栈解决，不再依赖外部字体。

### 生成提示词报「未配置 LLM_API_KEY」
环境变量未配置或未重新部署。在 Zeabur 后台确认三个变量并 Redeploy。

### 坐标联动不生效
localStorage 按域名隔离，确认生图页与坐标页在**同一域名**下访问（不要一个 http 一个 https）。

## 免费额度说明

Zeabur 提供免费额度（每月约 1000 小时运行时间 + 一定流量），个人使用足够；
国内节点超出免费额度后按量计费，费用很低（预计每月几元）。
