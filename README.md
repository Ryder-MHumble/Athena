# Athena - AI 战略分析师智能工作台

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/FastAPI-latest-009688?style=flat-square&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/LangChain-latest-121D33?style=flat-square" alt="LangChain">
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
</p>

> 专为非技术背景的 AI 战略分析师设计的智能工作台，让 AI 成为你学习和工作中的智能助手。

## 📖 项目背景

Athena 是为 AI 战略分析师量身打造的智能工作平台，特别针对文科背景从业者的实际需求设计。项目解决以下核心痛点：

- **术语理解困难**：海量专业名词需要快速理解，同事往往无暇及时解答
- **论文分享压力**：需要读懂论文、准备讲解、预判提问，任务繁重
- **知识分散难查**：部门积累的报告文档分散，缺乏统一管理和智能检索
- **概念易遗忘**：学过的概念容易忘记，缺少系统化的复习机制 Athena:52-58 

## ✨ 核心功能

### 1. 术语通 (Jargon Killer)

AI 智能导师实时解释专业术语，支持多轮深度对话。

**核心特性：**
- 🔄 **多轮对话**：支持追问和深入理解，构建完整的概念网络
- ⚡ **流式输出**：实时流式显示 AI 回复，即时获得反馈
- 🎯 **双模式切换**：思考模式（低温度0.3）用于精确解释，快速模式（高温度0.9）用于快速响应
- 💾 **一键收藏**：重要概念可直接保存到灵感单词本 Athena:16-58 Athena:61-136 

### 2. 论文伴侣 (Paper Copilot)

自动解析学术论文，生成结构化分析和讲解文稿。

**核心特性：**
- 📄 **多种输入方式**：支持 PDF 上传和 Arxiv 链接导入
- 📊 **结构化报告**：自动生成核心问题、前人困境、核心直觉、关键步骤等结构化内容
- 🎤 **讲解文稿**：生成口语化演讲稿，使用生活化类比解释复杂概念
- ❓ **预判提问**：智能预测可能的提问并准备答案
- 💬 **AI 解读**：基于论文内容实时回答你的问题 Athena:18-101 

### 3. 团队知识库 (Team Brain)

构建组织化知识库，统一管理团队文档并支持智能检索。

**核心特性：**
- 📚 **文档管理**：统一上传和保存 PDF 格式的内参报告、专家观点、产品洞察
- 🔍 **向量检索**：基于 BGE-M3 Embedding 模型的语义搜索，精准定位相关内容
- 🤖 **AI 对话**：基于检索结果的智能问答，帮助深入理解报告内容
- 📝 **报告生成**：自动生成结构化报告页面，包含核心摘要、关键概念、核心洞察等
- 🔐 **团队密钥**：通过团队访问密钥保护知识库安全 Athena:19-92 Athena:145-210 

### 4. 灵感单词本 (Flashcards)

像记单词一样记录和复习 AI 解释过的概念。

**核心特性：**
- 💡 **智能收藏**：从术语通对话中一键保存概念和解释
- 🎴 **3D 卡片效果**：精美的卡片翻转动画，提升学习体验
- 🔍 **快速搜索**：支持关键词搜索，快速定位已学概念
- 📊 **统计信息**：显示总词汇量和学习进度
- 💾 **本地存储**：数据持久化保存在浏览器本地 Athena:9-40 

## 🏗️ 技术架构

### 前端技术栈

- **框架**: Next.js 14 (React 18.3) - 现代化的全栈 React 框架
- **语言**: TypeScript 5.4 - 类型安全的开发体验
- **样式**: Tailwind CSS 3.4 - 实用优先的 CSS 框架
- **组件库**: shadcn/ui + Radix UI - 可访问性优先的组件库
- **状态管理**: Zustand 4.5 - 轻量级状态管理
- **HTTP 客户端**: ky - 现代化的 fetch 包装器
- **Markdown**: react-markdown + rehype-highlight - 支持代码高亮的 Markdown 渲染
- **PDF 处理**: react-pdf - PDF 文档预览
- **通知**: sonner - 优雅的 toast 通知 Athena:11-44 

### 后端技术栈

- **框架**: FastAPI - 高性能异步 Python Web 框架
- **AI 引擎**: 
  - LangChain - AI 应用开发框架
  - LangChain Community - 社区工具集成
  - LangChain OpenAI - OpenAI API 兼容层
- **LLM 服务**: SiliconFlow API
  - 主模型：Qwen/Qwen2.5-72B-Instruct（术语通等高质量推理场景）
  - 小模型：Qwen/Qwen2.5-7B-Instruct（论文分析等追求速度场景）
- **向量数据库**: Supabase + pgvector - 语义检索
- **Embedding**: BAAI/bge-m3 - 多语言向量模型
- **搜索**: DuckDuckGo Search - 网络搜索能力
- **PDF 处理**: PyMuPDF (fitz) + pypdf - PDF 文本提取
- **HTTP 客户端**: httpx + aiohttp - 异步 HTTP 请求 Athena:1-35 Athena:34-41 

### 架构设计

**前后端分离架构：**

```
┌─────────────────────────────────────────────┐
│          Frontend (Next.js 14)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │术语通    │  │论文伴侣  │  │知识库    │  │
│  │Jargon    │  │Paper     │  │Team      │  │
│  │Killer    │  │Copilot   │  │Brain     │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│         │              │             │       │
│         └──────────────┴─────────────┘       │
│                    │                         │
│              HTTP/SSE API                    │
└────────────────────┼────────────────────────┘
                     │
┌────────────────────┼────────────────────────┐
│         Backend (FastAPI)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Chat API  │  │Paper API │  │Knowledge │  │
│  │          │  │          │  │API       │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│         │              │             │       │
│  ┌──────┴──────────────┴─────────────┴────┐ │
│  │         Service Layer                  │ │
│  │  ┌────────┐  ┌────────┐  ┌────────┐   │ │
│  │  │LLM     │  │RAG     │  │Search  │   │ │
│  │  │Service │  │Service │  │Service │   │ │
│  │  └────────┘  └────────┘  └────────┘   │ │
│  └──────────────────────────────────────┘ │
│         │              │             │      │
└─────────┼──────────────┼─────────────┼─────┘
          │              │             │
    ┌─────┴─────┐  ┌────┴─────┐  ┌───┴────┐
    │SiliconFlow│  │Supabase  │  │DuckDuck│
    │    API    │  │ pgvector │  │Go Search│
    └───────────┘  └──────────┘  └────────┘
```

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **Python**: >= 3.9
- **npm** 或 **pnpm**

### 一键启动（推荐）

```bash
# 克隆项目
git clone https://github.com/Ryder-MHumble/Athena.git
cd Athena

# 启动所有服务（自动安装依赖、启动前后端、打开浏览器）
./start.sh

# 停止所有服务
./stop.sh
```

脚本会自动：
- ✅ 检查并安装依赖
- ✅ 启动后端服务（端口 8000）
- ✅ 启动前端服务（端口 3000）
- ✅ 自动打开浏览器 Athena:8-22 

### 手动启动

**后端启动：**
```bash
cd backend
pip install -r requirements.txt
python run.py
```

**前端启动（新终端）：**
```bash
cd frontend
npm install
npm run dev
```

### 环境配置

首次使用需要配置 API Key：

1. 访问 [SiliconFlow](https://siliconflow.cn/) 注册并获取 API Key
2. 在应用的**设置页面**输入 API Key（会存储在浏览器本地）
3. 配置团队访问密钥（用于知识库功能）

**环境变量文件：**
- `backend/.env` - 后端配置（包含 Supabase 配置）
- `frontend/.env.local` - 前端配置 Athena:60-66 Athena:10-21 

## 📂 项目结构

```
Athena/
├── frontend/                 # Next.js 前端应用
│   ├── app/                 # 应用路由和页面
│   │   ├── jargon-killer/   # 术语通模块
│   │   ├── paper-copilot/   # 论文伴侣模块
│   │   ├── team-brain/      # 团队知识库模块
│   │   ├── flashcards/      # 灵感单词本模块
│   │   └── settings/        # 设置页面
│   ├── components/          # 可复用组件
│   ├── lib/                 # 工具函数和 API 客户端
│   └── stores/              # Zustand 状态管理
│
├── backend/                  # FastAPI 后端应用
│   ├── app/
│   │   ├── api/             # API 路由
│   │   │   ├── chat.py      # 术语通 API
│   │   │   ├── paper.py     # 论文伴侣 API
│   │   │   └── knowledge.py # 知识库 API
│   │   ├── services/        # 业务逻辑层
│   │   │   ├── llm_service.py      # LLM 服务
│   │   │   ├── rag_service.py      # RAG 检索服务
│   │   │   ├── paper_service.py    # 论文处理服务
│   │   │   ├── embedding_service.py # 向量嵌入服务
│   │   │   └── search_service.py   # 搜索服务
│   │   ├── models/          # 数据模型
│   │   ├── prompts/         # AI 提示词模板
│   │   └── config.py        # 配置管理
│   └── requirements.txt     # Python 依赖
│
├── start.sh                 # 一键启动脚本
├── stop.sh                  # 停止脚本
└── README.md
```

## 🌟 核心特色

### 1. 为非技术背景用户设计

所有功能都经过精心设计，确保文科背景的用户也能轻松上手：
- 直观的界面设计，无需技术背景
- 通俗易懂的语言解释，避免专业术语
- 生活化的类比，降低理解门槛

### 2. 流式 AI 响应

采用 Server-Sent Events (SSE) 技术实现实时流式输出，用户无需等待即可看到 AI 逐字生成的回复，显著提升交互体验。 Athena:93-110 

### 3. 智能模型选择

根据不同场景自动选择最合适的模型：
- **高质量推理**（术语通）：使用 Qwen2.5-72B-Instruct 主模型
- **快速响应**（论文分析）：使用 Qwen2.5-7B-Instruct 小模型 Athena:183-192 

### 4. 向量检索增强

知识库采用 RAG (Retrieval-Augmented Generation) 架构：
- 使用 BGE-M3 多语言向量模型生成文档嵌入
- Supabase + pgvector 提供高性能语义检索
- 基于检索结果的上下文增强 AI 回答 Athena:114-143 

## 📊 访问地址

- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs (FastAPI 自动生成)

## 🛠️ 开发指南

### 添加新功能

1. **后端 API**：在 `backend/app/api/` 添加新的路由文件
2. **业务逻辑**：在 `backend/app/services/` 添加服务类
3. **前端页面**：在 `frontend/app/` 添加新的路由目录
4. **API 客户端**：在 `frontend/lib/api.ts` 添加 API 调用方法

### 自定义 Prompt

所有 AI 提示词模板都集中在 `backend/app/prompts/` 目录，可以根据需求自定义优化。

### 更换 LLM 模型

在 `backend/app/config.py` 中修改 `LLM_MODEL` 和 `LLM_MODEL_SMALL` 配置：

```python
LLM_MODEL: str = "Qwen/Qwen2.5-72B-Instruct"      # 主模型
LLM_MODEL_SMALL: str = "Qwen/Qwen2.5-7B-Instruct" # 小模型
```

## 🐛 常见问题

### 端口被占用

如果 3000 或 8000 端口被占用：
1. 停止占用端口的进程
2. 或修改配置文件中的端口号

### API Key 错误

确保在设置页面正确配置了 SiliconFlow API Key，并检查密钥是否有效。

### 文档上传失败

1. 检查文件格式是否为 PDF
2. 确认团队访问密钥配置正确
3. 查看后端日志获取详细错误信息

---

**由 Ryder 为 AI 战略分析师打造**
