# Athena 项目结构说明

## 📁 目录结构

```
Athena/
├── frontend/                    # Next.js 前端应用
│   ├── app/                     # App Router 页面
│   │   ├── layout.tsx          # 根布局（导航栏、Toast）
│   │   ├── page.tsx             # 首页（模块导航）
│   │   ├── globals.css          # 全局样式（Soft Academic 风格）
│   │   ├── jargon-killer/       # 术语通模块
│   │   │   └── page.tsx
│   │   ├── paper-copilot/       # 论文伴侣模块
│   │   │   └── page.tsx
│   │   ├── team-brain/          # 知识沉淀模块
│   │   │   └── page.tsx
│   │   ├── flashcards/          # 灵感单词本模块
│   │   │   └── page.tsx
│   │   └── settings/            # 设置模块
│   │       └── page.tsx
│   ├── components/              # React 组件
│   │   ├── ui/                  # shadcn/ui 基础组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── label.tsx
│   │   │   └── sonner.tsx       # Toast 通知
│   │   └── layout/              # 布局组件
│   │       └── navigation.tsx    # 导航栏
│   ├── lib/                     # 工具函数
│   │   ├── utils.ts             # 通用工具（cn, formatDate 等）
│   │   └── api.ts                # API 客户端（ky 封装）
│   ├── stores/                   # Zustand 状态管理
│   │   └── useAppStore.ts       # 全局 Store（persist 中间件）
│   ├── public/                   # 静态资源
│   ├── package.json              # 前端依赖
│   ├── tsconfig.json             # TypeScript 配置
│   ├── tailwind.config.ts       # Tailwind CSS 配置
│   ├── next.config.js            # Next.js 配置
│   └── .env.example              # 环境变量示例
│
├── backend/                     # FastAPI 后端应用
│   ├── app/
│   │   ├── main.py              # FastAPI 应用入口
│   │   ├── config.py            # 配置管理（Pydantic Settings）
│   │   ├── api/                 # API 路由
│   │   │   ├── chat.py          # 术语通 API
│   │   │   ├── paper.py         # 论文伴侣 API
│   │   │   └── knowledge.py     # 知识沉淀 API
│   │   ├── models/              # Pydantic 数据模型
│   │   │   └── schemas.py       # 请求/响应模型
│   │   └── services/            # 业务逻辑服务
│   │       ├── llm_service.py   # LLM 服务（LangChain）
│   │       ├── rag_service.py    # RAG 服务（Supabase）
│   │       ├── embedding_service.py  # Embedding 服务
│   │       ├── search_service.py # 搜索服务（DuckDuckGo）
│   │       └── paper_service.py  # 论文处理服务
│   ├── uploads/                  # 文件上传目录
│   ├── requirements.txt          # Python 依赖
│   ├── run.py                    # 启动脚本
│   └── .env.example              # 环境变量示例
│
├── Athena 开发规范书.md          # 项目规范文档
├── PROJECT_STRUCTURE.md          # 本文件
├── README.md                     # 项目说明
└── .gitignore                    # Git 忽略文件
```

## 🔑 核心文件说明

### 前端核心文件

1. **`frontend/stores/useAppStore.ts`**
   - Zustand Store，使用 persist 中间件
   - 存储：`apiKey`, `teamKey`, `vocabList`
   - 本地持久化到 localStorage

2. **`frontend/lib/api.ts`**
   - API 客户端封装（基于 ky）
   - 自动添加 API Key 到请求头
   - 定义所有 API 接口类型

3. **`frontend/app/globals.css`**
   - Soft Academic 设计风格
   - 配色：Slate-900（主色）、Violet-500（强调色）
   - 字体：Merriweather（标题）、Inter（正文）

### 后端核心文件

1. **`backend/app/config.py`**
   - Pydantic Settings 管理环境变量
   - 包含 Supabase、SiliconFlow 配置

2. **`backend/app/services/llm_service.py`**
   - 封装 LangChain ChatOpenAI
   - 支持多轮对话、论文分析、演讲稿生成

3. **`backend/app/services/rag_service.py`**
   - Supabase 向量存储和检索
   - 文档切分、上传、搜索

4. **`backend/app/services/embedding_service.py`**
   - SiliconFlow Embedding API 封装
   - 支持单个和批量生成向量

## 🚀 下一步开发任务

### 前端待实现功能

1. **术语通模块** (`app/jargon-killer/page.tsx`)
   - 对话界面（消息列表、输入框）
   - 收藏功能（添加到单词本）
   - 对话历史管理

2. **论文伴侣模块** (`app/paper-copilot/page.tsx`)
   - 文件上传（拖拽）
   - Arxiv URL 输入
   - PDF 预览（react-pdf）
   - Tab 切换（报告/演讲稿/Q&A）

3. **知识沉淀模块** (`app/team-brain/page.tsx`)
   - 文档上传
   - 搜索界面
   - 结果展示

4. **灵感单词本模块** (`app/flashcards/page.tsx`)
   - 列表视图
   - 卡片视图（翻转动画）
   - 搜索功能

5. **设置模块** (`app/settings/page.tsx`)
   - API Key 输入
   - Team Key 输入
   - MCP Server 配置

### 后端待完善功能

1. **论文分析 JSON 解析**
   - 完善 `PaperService.parse_structured_summary()`
   - 处理 LLM 返回的 JSON 格式

2. **Q&A 生成解析**
   - 解析 LLM 返回的 Q&A 列表
   - 提取问题和答案

3. **错误处理**
   - 添加更详细的错误信息
   - 处理超时、API 限流等情况

4. **性能优化**
   - 使用 RunnableParallel 并行处理论文分析
   - 添加缓存机制

## 📝 环境变量配置

### 前端 (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 后端 (.env)

```env
SILICONFLOW_API_KEY=sk-apnkvqagdvvfbiiwibuoubnexdwnzawgpgibtyyynhllkxmx
TEAM_ACCESS_KEY=your_team_key_here
```

## 🎨 设计规范

- **设计语言**: Soft Academic（柔和学术风）
- **主色**: Slate-900（深岩灰）
- **强调色**: Violet-500（淡紫）
- **背景**: Slate-50（极浅灰）
- **字体**: Merriweather（标题）、Inter（正文）

## 📚 技术栈

- **前端**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand
- **后端**: FastAPI, LangChain, LangGraph, Supabase
- **AI**: SiliconFlow (Qwen2.5-72B), BGE Embedding, DuckDuckGo Search

