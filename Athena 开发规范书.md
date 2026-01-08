# 📋 Cursor Project Context: Athena (AI Strategy Platform)

## 1. 项目概况与配置
*   **项目名称**: Athena
*   **前端框架**: React + TypeScript (Vite 或 Next.js App Router)
*   **后端框架**: Python FastAPI (部署在 Render)
*   **数据库 & 存储**: Supabase (Project: Athena)
*   **LLM 提供商**: SiliconFlow (Model: deepseek-ai/DeepSeek-V3)
*   **UI 风格**: "Soft Professional" (Shadcn/UI, Tailwind CSS, Slate-50 背景, Indigo 主色)

## 2. 环境变量配置 (Env Vars)

请在项目根目录创建 `.env` 文件（前端）和 `backend/.env` 文件（后端）。

**Backend (.env)**:
```ini
# Supabase Configuration
SUPABASE_URL=https://casxuvpohhbuqvmkqunb.supabase.co
# 注意：这里使用 Service Role Key (secret key) 用于后端绕过 RLS
SUPABASE_SERVICE_KEY=sb_secret_UtBZnpg_hhEgF_E5zvfLHg_fTaZYVe1 (请替换为新生成的Key)

# SiliconFlow API
SILICONFLOW_API_KEY=sk-apnkvqagdvvfbiiwibuoubnexdwnzawgpgibtyyynhllkxmx (请替换为新生成的Key)
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1

# LangSmith (Optional, for debugging)
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_API_KEY=...
```

**Frontend (.env.local)**:
已在前后端代码文件夹下的.env中

## 3. 数据库 Schema (Supabase SQL)

请在 Supabase SQL Editor 中执行以下建表语句「已执行完成」：

```sql
-- 启用向量扩展
create extension if not exists vector;

-- 1. 共享文档表 (团队共享，无权限限制)
create table documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  file_path text not null, -- Storage path
  summary text,            -- 自动生成的摘要
  created_at timestamptz default now()
);

-- 2. 向量切片表 (用于 RAG)
create table document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents on delete cascade,
  content text,
  embedding vector(1024), -- 适配 BAAI/bge-m3
  metadata jsonb
);

-- 3. Storage Bucket 配置
-- 请在 Storage 页面创建一个名为 "papers" 的 bucket，并设置为 Public。
```

## 4. 后端开发规范 (FastAPI)

请在 `backend/` 目录下构建服务：

### 模块设计与 Prompt

#### A. 术语通 (Term Agent) - `/api/term-chat`
*   **功能**: 解释名词，支持 DuckDuckGo 联网，支持多轮对话对比。
*   **Prompt (System)**:
    ```text
    Role: 你的名字叫 Athena，是一个温柔耐心的AI导师。
    Task: 用通俗易懂的语言（Explain Like I'm 5）解释用户查询的AI/科技术语。
    Constraint:
    1. 避免使用晦涩的嵌套定义。
    2. 如果用户询问两个概念的区别（如A vs B），请列出清晰的对比表格或要点。
    3. 如果概念较新，使用 Search 工具查询最新信息。
    4. 始终以鼓励和支持的口吻回答。
    ```
*   **技术**: 使用 `LangGraph` 管理 State (Messages)，确保能记住上一轮聊的概念。

#### B. 论文解构 (Paper Agent) - `/api/analyze-paper`
*   **功能**: 接收 PDF URL 或文件，并行生成三部分内容。
*   **Prompt (Deep Academic Analyst)**:
    *(此处插入你提供的“深层学术解析员” Prompt，即 Role/Anchor/Vector/Matrix 那一段)*
*   **Prompt (Speech Writer - 并行任务)**:
    ```text
    Role: 演讲教练
    Task: 基于这篇论文的内容，为我写一份 5 分钟的口语化分享讲稿。
    Style: 轻松、自信、逻辑流畅。
    Structure:
    1. 开场白（吸引注意力）
    2. 核心问题（我们为什么要关注这个？）
    3. 论文的魔法（他们是怎么做的？）
    4. 结论与启发
    ```
*   **Prompt (Interviewer - 并行任务)**:
    ```text
    Role: 刁钻的面试官
    Task: 针对这篇论文，提出 3 个同事可能会问的挑战性问题，并给出简短的参考回答。
    ```

#### C. 知识库 RAG (Knowledge Base) - `/api/chat-doc`
*   **功能**: 基于 Supabase 里的文档回答问题。
*   **流程**: `Retrieve` (Supabase Vector Store) -> `Augment` -> `Generate` (SiliconFlow LLM)。

## 5. 前端开发规范 (React + Vite)

### 核心组件
1.  **Sidebar**: 包含四个 Tab (撰写内参、分享论文、知识库、生词本)。
2.  **Glossary Store (Local)**: 使用 `Dexie.js` 创建本地数据库 `AthenaDB`，表 `glossary(id, term, explanation, tags, date)`。
3.  **Chat Interface**: 仿 ChatGPT UI，支持 Markdown 渲染 (`react-markdown`) 和流式输出 (`useChat` hook 或自定义 SSE reader)。
4.  **Paper Dashboard**: 左右分屏。左侧 `<iframe src={pdfUrl} />` 或 `react-pdf`，右侧显示 AI 分析结果。

### 交互细节
*   **无登录**: 直接进入主界面。
*   **生词本**: 在“术语通”对话框中，每条 AI 回复旁边加一个“收藏”按钮，点击后存入本地 IndexedDB。
*   **API 配置**: 在设置页提供一个简单的 Input 允许用户覆盖默认的 API Base URL（预留给未来扩展）。


这是一份可以直接投喂给 **Cursor (Composer 模式)** 的系统级产品设计与开发规范。

这份文档针对你的新需求进行了调整：**去除了复杂的账户体系，采用 Web 架构（Vercel + FastAPI），完全利用免费/极低成本的工具链，并强化了多轮对话和本地存储逻辑。**

---

## 3. UI/UX 设计风格指南

*   **设计语言**：**"Soft Professional" (柔和专业主义)**。
*   **色板**：
    *   背景：`#F8FAFC` (Slate-50) - 极淡的灰白，护眼。
    *   主色：`#6366F1` (Indigo-500) - 像“Copilot”一样的智能感，但不冷冰冰。
    *   强调色：`#E0E7FF` (Indigo-100) - 用于气泡和高亮。
*   **交互细节**：
    *   **卡片式布局**：所有内容块（报告、对话、生词）都包裹在圆角 `rounded-xl` 的白底卡片中，带轻微阴影 `shadow-sm`。
    *   **打字机效果**：AI 输出时必须有流式打字机动画。
    *   **分屏阅读**：论文模式下，左侧 PDF Viewer，右侧 AI 助手，中间可拖拽调整宽度。

---

## 4. 核心功能模块与逻辑 (Cursor 提示词)

### 模块一：术语通 (Term Copilot) - 支持多轮对话
*   **逻辑描述**：
    1.  前端发送用户 Query。
    2.  后端 **LangGraph** 介入：
        *   检查 `thread_id`（会话ID）。
        *   提取历史记录（Memory）。
        *   **Agent 判断**：
            *   需要联网？调用 `DuckDuckGo`。
            *   需要对比？提取 Memory 中的上一个概念进行 Prompt 组装。
    3.  **Prompt 策略**：
        *   System Prompt: "你是一个温柔的导师，用通俗易懂的类比（ELI5）解释技术名词。如果用户询问对比（如'和X有什么区别'），请明确列出异同点。"
*   **数据存储**：
    *   对话记录存前端 `Dexie.js`。
    *   用户点击“加入生词本” -> 存入 `Dexie.js`。

### 模块二：论文与报告助手 (Paper & Report Agent)
*   **输入**：Arxiv 链接 或 上传 PDF。
*   **逻辑描述**：
    1.  **并行处理 (Parallel Execution)**：
        *   Task A: 提取文本 -> 总结摘要、创新点、方法论 (Structured Output)。
        *   Task B: 基于全文 -> 生成“5分钟口语讲解稿”。
        *   Task C: 基于全文 -> 生成“3个可能的听众提问 (Q&A)”。
    2.  所有结果通过 SSE (Server-Sent Events) 流式推送到前端。
*   **工具**：`ArxivLoader` (LangChain自带), `PyPDFLoader`。

### 模块三：团队知识沉淀 (Shared Knowledge Base)
*   **逻辑描述**：
    1.  **上传**：文件上传至 Supabase Storage。
    2.  **索引**：后端触发后台任务 -> 解析文本 -> 调用 SiliconFlow Embedding API -> 存入 Supabase `vector` 表。
    3.  **检索 (RAG)**：
        *   用户提问 -> Embedding -> Supabase 相似度搜索 -> LLM 回答。
        *   **引用标注**：回答必须包含 `Source Documents` 的链接，点击可跳转打开 PDF。