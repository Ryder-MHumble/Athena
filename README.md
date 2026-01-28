# Athena - AI 战略分析师智能工作台

<p align="center">
  <img src="frontend/public/Logo.png" alt="Athena Logo" width="400" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/FastAPI-latest-009688?style=flat-square&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/LangChain-latest-121D33?style=flat-square" alt="LangChain">
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS">
</p>

<p align="center">
  <b>专为非技术背景用户设计的 AI 智能工作台</b><br>
  让学习和研究变得简单、高效、有趣
</p>

---

## 📸 功能预览

<details open>
<summary><b>点击展开/收起截图</b></summary>

<table>
  <tr>
    <td align="center" width="50%">
      <b>🏠 首页</b><br>
      <img src="frontend/public/screenshots/home.png" width="100%" />
      <sub>核心功能概览，快速入口</sub>
    </td>
    <td align="center" width="50%">
      <b>🧠 术语通</b><br>
      <img src="frontend/public/screenshots/jargon-killer.png" width="100%" />
      <sub>AI 实时流式对话，专业术语秒懂</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>📄 论文伴侣</b><br>
      <img src="frontend/public/screenshots/paper-copilot.png" width="100%" />
      <sub>PDF 智能分析 · 结构化解读 · 一键收藏（基于Arxiv url获取论文正在开发中）</sub>
    </td>
    <td align="center" width="50%">
      <b>💾 知识沉淀</b><br>
      <img src="frontend/public/screenshots/team-brain.png" width="100%" />
      <sub>智能知识库检索与问答（数据库开发开发中）</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>📚 知识卡片</b><br>
      <img src="frontend/public/screenshots/flashcards.png" width="100%" />
      <sub>术语收藏 · 论文分析存档 · 3D 卡片复习</sub>
    </td>
    <td align="center" width="50%">
      <b>📊 数据中心</b><br>
      <img src="frontend/public/screenshots/DataCenter.png" width="100%" />
      <sub>学习与使用统计分析（开发中）</sub>
    </td>
  </tr>
</table>


## 📖 项目背景

Athena 是一款面向知识工作者的 AI 智能工作台，特别针对需要快速学习、理解复杂概念的用户设计。

### 核心痛点

- **🔤 术语理解困难**：专业名词缺乏即时可靠的解释来源
- **📚 论文分享压力**：需要快速理解论文核心观点并准备讲解材料
- **📁 知识分散难查**：团队文档分散，缺乏统一管理和语义检索
- **🧠 概念易遗忘**：学过的内容缺少系统化的记录和复习机制

---

## ✨ 核心功能

### 1. 术语通 (Jargon Killer)

> 遇到不懂的专业名词？AI 导师秒级响应，用通俗易懂的语言解释复杂概念

**核心特性：**
- ⚡ **流式实时响应**：基于 SSE 技术，即时看到 AI 逐字生成的回复
- 🔄 **多轮深度追问**：支持持续追问，直到彻底理解概念
- 🎯 **双模式切换**：思考模式（Qwen2.5-72B）与快速模式（Qwen2.5-7B）
- 💾 **一键收藏**：将重要概念直接保存到单词本

### 2. 论文伴侣 (Paper Copilot)

> 上传 PDF 或输入 Arxiv 链接，自动提取核心观点、生成结构化分析报告

**核心特性：**
- 📄 **多种输入方式**：支持 PDF 上传和 Arxiv 链接导入
- 📊 **结构化报告**：自动生成核心问题、前人困境、核心直觉、关键步骤等
- 🎤 **讲解文稿**：生成口语化演讲稿，使用生活化类比解释复杂概念
- 💬 **论文对话**：基于论文内容的智能问答，深入理解论文细节
- ⭐ **一键收藏**：将论文分析结果保存到知识卡片，随时回顾

### 3. 知识沉淀 (Team Brain)

> 上传团队文档，构建可检索的智能知识库，基于语义搜索快速定位内容

**核心特性：**
- 📚 **文档管理**：统一上传和保存 PDF 格式的内部文档
- 🔍 **向量检索**：基于 BGE-M3 Embedding 模型的语义搜索
- 🤖 **智能问答**：基于 RAG 架构的上下文增强对话
- 📝 **报告生成**：自动生成包含核心摘要、关键概念的结构化报告

### 4. 知识卡片 (Knowledge Cards)

> 统一管理术语收藏和论文分析，构建个人知识体系

**核心特性：**
- 📖 **双类型支持**：同时管理「术语收藏」和「论文分析」两种知识卡片
- 💡 **智能收藏**：从术语通和论文伴侣中一键保存内容
- 🎴 **3D 卡片效果**：精美的卡片翻转动画，提升学习体验
- 📊 **分类筛选**：按类型（全部/术语/论文）快速筛选查看
- 🔍 **快速搜索**：支持关键词搜索已学概念
- 💾 **本地存储**：数据持久化保存在浏览器本地

---

## 🏗️ 技术架构

### 前端技术栈

| 技术 | 版本 | 说明 |
|-----|-----|-----|
| Next.js | 14 | 现代化全栈 React 框架 |
| TypeScript | 5.4 | 类型安全的开发体验 |
| Tailwind CSS | 3.4 | 实用优先的 CSS 框架 |
| shadcn/ui | - | 可访问性优先的组件库 |
| Zustand | 4.5 | 轻量级状态管理 |
| react-pdf | - | PDF 文档预览 |

### 后端技术栈

| 技术 | 说明 |
|-----|-----|
| FastAPI | 高性能异步 Python Web 框架 |
| LangChain | AI 应用开发框架 |
| SiliconFlow API | LLM 服务提供商 |
| Supabase + pgvector | 向量数据库 |
| BGE-M3 | 多语言向量模型 |
| PyMuPDF | PDF 文本提取 |

### 架构图

```
┌─────────────────────────────────────────────────┐
│           Frontend (Next.js 14)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 术语通   │ │ 论文伴侣 │ │ 知识沉淀 │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐                      │
│  │ 数据中心 │ │ 知识卡片 │                      │
│  └──────────┘ └──────────┘                      │
│                    │                            │
│              HTTP/SSE API                       │
└────────────────────┼────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────┐
│           Backend (FastAPI)                     │
│  ┌──────────────────────────────────────────┐  │
│  │            Service Layer                  │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐        │  │
│  │  │  LLM   │ │  RAG   │ │ Search │        │  │
│  │  │Service │ │Service │ │Service │        │  │
│  │  └────────┘ └────────┘ └────────┘        │  │
│  └──────────────────────────────────────────┘  │
└────────────────────┼────────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───┴────┐    ┌─────┴─────┐    ┌─────┴─────┐
│Silicon │    │ Supabase  │    │ DuckDuck  │
│Flow API│    │ pgvector  │    │ Go Search │
└────────┘    └───────────┘    └───────────┘
```

---

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **Python**: >= 3.9
- **npm** 或 **pnpm**

### 一键启动（推荐）

#### macOS / Linux / Git Bash / WSL

```bash
# 克隆项目
git clone https://github.com/Ryder-MHumble/Athena.git
cd Athena

# 赋予执行权限
chmod +x start.sh stop.sh

# 启动所有服务
./start.sh

# 停止所有服务
./stop.sh
```

#### Windows PowerShell

```powershell
# 克隆项目
git clone https://github.com/Ryder-MHumble/Athena.git
cd Athena

# 如果遇到执行策略限制，先运行：
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 启动所有服务
.\start.ps1

# 停止所有服务
.\stop.ps1
```
如果无法通过自动执行脚本快速部署和启动，就请参考下文的【手动启动】方法

**一键启动脚本会自动：**
- ✅ 检测并提示安装 Python 和 Node.js（如需要）
- ✅ 安装项目依赖
- ✅ 启动后端服务（端口 8000）
- ✅ 启动前端服务（端口 3000）
- ✅ 自动打开浏览器

### 手动启动

**后端：**
```bash
cd backend
pip install -r requirements.txt
python run.py
```

**前端（新终端）：**
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### 环境配置

1. 访问 [SiliconFlow](https://siliconflow.cn/) 注册并获取 API Key（首次注册赠送 2000 万 Tokens）
2. 在应用的**设置页面** (`http://localhost:3000/settings`) 输入 API Key
3. （可选）配置 Supabase 用于知识库功能

---

## 📂 项目结构

```         
Athena/
├── frontend/                 # Next.js 前端应用
│   ├── app/                 # 应用路由和页面
│   │   ├── jargon-killer/   # 术语通模块
│   │   ├── paper-copilot/   # 论文伴侣模块
│   │   ├── team-brain/      # 知识沉淀模块
│   │   ├── data-hub/        # 数据中心模块
│   │   ├── flashcards/      # 知识卡片模块
│   │   └── settings/        # 设置页面
│   ├── components/          # 可复用组件
│   ├── lib/                 # 工具函数和 API 客户端
│   └── stores/              # Zustand 状态管理
│
├── backend/                  # FastAPI 后端应用
│   ├── app/
│   │   ├── api/             # API 路由
│   │   ├── services/        # 业务逻辑层
│   │   ├── models/          # 数据模型
│   │   ├── prompts/         # AI 提示词模板
│   │   └── config.py        # 配置管理
│   └── requirements.txt     # Python 依赖
│
├── start.sh                 # Linux/Mac 一键启动脚本
├── start.ps1                # Windows 一键启动脚本
├── stop.sh                  # Linux/Mac 停止脚本
├── stop.ps1                 # Windows 停止脚本
└── README.md
```

---

## 🌟 核心特色

### 为非技术背景用户设计

- **直观的界面设计**：无需技术背景，开箱即用
- **通俗易懂的语言**：AI 使用简单语言解释复杂概念
- **生活化的类比**：降低理解门槛，让学习更有趣

### 流式 AI 响应

采用 Server-Sent Events (SSE) 技术实现实时流式输出，无需等待即可看到 AI 逐字生成的回复，提供类似 ChatGPT 的交互体验。

### 智能模型选择

- **高质量推理**：Qwen2.5-72B-Instruct（思考模式）
- **快速响应**：Qwen2.5-7B-Instruct（快速模式）
- **自动切换**：根据任务复杂度智能选择最合适的模型

### 向量检索增强 (RAG)

知识库采用 RAG 架构，使用 BGE-M3 多语言向量模型 + Supabase pgvector 实现高性能语义检索，精准定位相关内容。

---

## 📊 服务地址

| 服务 | 地址 |
|-----|-----|
| 前端应用 | http://localhost:3000 |
| 后端 API | http://localhost:8000 |
| API 文档 | http://localhost:8000/docs |

---

## 🐛 常见问题

### Q: 端口被占用怎么办？

**A:** 
- Windows: `netstat -ano | findstr "8000"` 或 `netstat -ano | findstr "3000"`
- Linux/Mac: `lsof -i :8000` 或 `lsof -i :3000`
- 停止占用端口的进程，或修改配置文件中的端口号

### Q: API Key 错误

**A:** 确保在设置页面 (`http://localhost:3000/settings`) 正确配置了 SiliconFlow API Key，并且 Key 有足够的额度。

### Q: 文档上传失败

**A:**
1. 检查文件格式是否为 PDF
2. 确认文件大小不超过 10MB
3. 查看浏览器控制台和后端日志获取详细错误信息

### Q: 依赖安装失败

**A:**
- Python 依赖：尝试 `pip install -r requirements.txt --no-cache-dir`
- Node.js 依赖：尝试 `npm install --legacy-peer-deps`
- 确保网络连接正常，必要时配置代理

### Q: 服务启动失败

**A:**
1. 检查 Python 和 Node.js 版本是否符合要求
2. 查看启动日志 `.backend.log` 和 `.frontend.log`
3. 确认配置文件 `.env` 正确配置

---

## 💡 使用建议

1. **首次使用**：先访问设置页面配置 API Key
2. **术语学习**：遇到不懂的概念，立即使用术语通查询并收藏
3. **论文阅读**：上传 PDF 后查看结构化分析，使用论文对话深入理解
4. **知识沉淀**：定期整理团队文档到知识库
5. **知识管理**：利用知识卡片统一管理术语和论文分析，定期复习巩固

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

---

## 📄 开源协议

本项目采用 MIT 协议开源。详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- [SiliconFlow](https://siliconflow.cn/) - 提供高性能 LLM API 服务
- [Next.js](https://nextjs.org/) - 优秀的 React 框架
- [FastAPI](https://fastapi.tiangolo.com/) - 现代化的 Python Web 框架
- [LangChain](https://langchain.com/) - 强大的 AI 应用开发框架
- [Supabase](https://supabase.com/) - 开源的 Firebase 替代方案

---

<p align="center">
  <b>由 Ryder Sun 打造</b><br>
  让学习更智能，让知识更有价值 ✨
</p>

<p align="center">
  如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！
</p>
