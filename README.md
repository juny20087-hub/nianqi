# 廿七 · 提示词工坊

> 第二十七夜，让想象成像。

把你的中文画面描述，变成 **GPT-Image-2** 与 **Nano Banana** 都能读懂的专业提示词（中英双语），一键复制到你的生图软件中使用。

## 功能

- ✦ **描述 → 专业提示词**：接入 LLM（默认 DeepSeek），将口语化描述润色为结构化、可出图的高质量提示词
- 🎬 **电影感规则引擎**：景别必选、单一主光源、low-key 布光、胶片质感、经典调色、删除空洞形容词（研究自多份电影提示词指南）
- 🎨 **风格预设系统**：好莱坞大片、王家卫霓虹、诺兰低照度、黑白 Noir、赛博朋克夜戏、胶片纪实、3D 渲染、概念插画 8 套风格一键切换
- 🎯 **双平台适配**：为 GPT-Image-2（ChatGPT）与 Nano Banana（Gemini）分别定制提示词风格
- 🌏 **中英双语**：每个平台同时输出中文版与英文版提示词，一键切换、一键复制
- 🖥️ **双栏工坊布局**：左栏 sticky 工作台 + 右栏结果/灵感/历史 Tab，消除滚动跳转
- 📜 **本地历史**：最近 20 条生成记录保存在浏览器本地，点击即可复用
- 🧩 **资产生成模式**：人物/场景/道具资产规则（主光源确定、物理真实、亮暗区层次、材质真实）
- 📚 **提示词模板库**：11 个模板分类浏览、一键套用
- 🎬 **坐标生成页**（`/frame`）：拖拽绘制 L/T/W/H 坐标框、构图辅助线、模板、提示词坐标提取、背景图上传
- 🔗 **双页面联动**：坐标页输出的坐标自动同步，生图页一键导入「补充要求」

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（复制示例文件并填入你的 API Key）
cp .env.local.example .env.local
#   编辑 .env.local，填入 LLM_API_KEY

# 3. 启动开发服务器
npm run dev
```

打开 http://localhost:3000 即可使用。

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `LLM_API_KEY` | ✅ | - | LLM API Key |
| `LLM_BASE_URL` | - | `https://api.deepseek.com` | 任意 OpenAI Chat Completions 兼容接口地址 |
| `LLM_MODEL` | - | `deepseek-chat` | 使用的模型名 |

支持任意 OpenAI Chat Completions 兼容接口，常见配置：

```bash
# DeepSeek（推荐）
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat

# SiliconFlow（硅基流动）
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.siliconflow.cn/v1
LLM_MODEL=deepseek-ai/DeepSeek-V3
```

## 技术栈

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS 4

## 目录结构

```
src/
  app/
    api/generate/route.ts   # 提示词生成 API
    layout.tsx              # 全局布局（左侧导航 + 内容区）
    page.tsx                # 首页 · 生图工坊
    frame/page.tsx          # 坐标生成页（/frame）
  components/
    NavBar.tsx              # 左侧导航栏
    StudioClient.tsx        # 生图工作台（双栏：输入/风格/联动/结果Tab）
    PromptResultCard.tsx    # 提示词结果卡片（中英切换/复制）
    TemplateLibrary.tsx     # 提示词模板库面板
    StyleSelector.tsx       # 风格预设选择器
    FrameCanvas.tsx         # RectCanvas 坐标画框生成器（移植）
    frame-canvas.css        # 坐标工具样式（廿七暗色主题）
  lib/
    llm.ts                  # LLM 适配层（OpenAI 兼容）
    prompt-engine.ts        # 提示词生成引擎（电影感规则 + 双平台 + 资产模式）
    styles.ts               # 风格预设系统（8 套风格 + 规则注入）
    templates.ts            # 提示词模板库数据
    frame-store.ts          # 坐标页 → 生图页数据联动
```
