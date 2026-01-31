# Athena - AI 战略分析师效率引擎

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
  <b>为 AI 战略分析师打造的一站式智能工作台</b><br>
  提升日常工作效率，洞察全球 AI 行业前沿
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
      <sub>海内外信源抓取 · 支持手动新增信源 · 自动爬取</sub>
    </td>
  </tr>
</table>


## 📖 项目背景

Athena 是一款为 AI 战略分析师打造的一站式智能工作台，融合了 AI 辅助认知提升和全球信源聚合两大核心能力。

### 核心痛点

- **🔤 术语理解困难**：专业名词缺乏即时可靠的解释来源
- **📚 论文分享压力**：需要快速理解论文核心观点并准备讲解材料
- **📁 知识分散难查**：团队文档分散，缺乏统一管理和语义检索
- **🧠 概念易遗忘**：学过的内容缺少系统化的记录和复习机制
- **🌍 信源分散难追**：全球 AI 领域 KOL 动态分散在 YouTube、X 等平台，难以统一追踪

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

### 5. 数据中心 (Data Hub)

> 全球 AI 信源聚合，一站式追踪行业前沿动态

**核心特性：**
- 🌍 **海外信源聚合**：整合 YouTube、X (Twitter) 等平台的 40+ AI 领域 KOL 内容
- ➕ **批量添加信源**：支持一次添加多个账号 URL，自动爬取更新
- 🔍 **多维度筛选**：平台筛选、账号多选筛选（支持搜索）、时间范围筛选
- 📊 **智能联动**：切换平台时自动过滤显示对应渠道的账号列表
- 📺 **iframe 嵌入渲染**：直接在页面内观看 YouTube 视频和阅读 X 推文
- 🀄 **国内社媒采集**：支持小红书、B站、知乎等国内平台内容聚合
- 🤖 **自动定时爬取**：后端每 6 小时自动更新数据，保持内容新鲜
- 🕷️ **手动爬取**：支持一键触发爬取，立即获取最新内容

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
3. **选择 AI 模型**：在设置页面选择适合的模型（默认 Qwen2.5-7B-Instruct）
4. （可选）配置 Supabase 用于知识库功能
5. （可选）配置爬虫相关环境变量：

```bash
# 后端环境变量 (.env)
TWITTER_API_KEY=your_twitter_api_key      # Twitter API 密钥
ENABLE_AUTO_CRAWL=true                     # 启用自动爬虫（默认 true）
CRAWLER_INTERVAL_SECONDS=21600             # 爬取间隔（默认 6 小时）

# 前端环境变量 (.env.local) - 仅前后端分离部署时需要
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

**支持的模型厂商：**
- 通义千问 (Qwen)：Qwen2.5 系列、Qwen3-VL 多模态系列
- 智谱 GLM：GLM-4.7、GLM-4.6、GLM-4.6V 等
- Kimi (Moonshot AI)：Kimi-K2-Thinking、Kimi-K2-Instruct
- DeepSeek：DeepSeek-V3.2、DeepSeek-V3、DeepSeek-R1

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
│   │   │   └── components/
│   │   │       └── overseas/  # 海外信源组件（模块化）
│   │   │           ├── types.ts
│   │   │           ├── constants.ts
│   │   │           ├── utils.ts
│   │   │           ├── TwitterCard.tsx
│   │   │           ├── YouTubeCard.tsx
│   │   │           ├── DetailPanels.tsx
│   │   │           └── useOverseasData.ts
│   │   ├── flashcards/      # 知识卡片模块
│   │   └── settings/        # 设置页面
│   ├── components/          # 可复用组件
│   ├── public/crawl-data/   # 爬虫数据存储（静态资源）
│   │   ├── youtube/videos.json
│   │   └── twitter/posts.json
│   ├── lib/                 # 工具函数和 API 客户端
│   └── stores/              # Zustand 状态管理
│
├── backend/                  # FastAPI 后端应用
│   ├── app/
│   │   ├── api/             # API 路由
│   │   │   └── crawler.py   # 爬虫 API（支持自动/手动触发）
│   │   ├── services/        
│   │   │   └── crawler_service.py  # 爬虫核心服务
│   │   ├── models/          # 数据模型
│   │   ├── prompts/         # AI 提示词模板
│   │   ├── Info_sources/    # 信源配置
│   │   │   └── sources.json # 海外信源列表（28 Twitter + 12 YouTube）
│   │   ├── main.py          # 应用入口（含自动爬虫调度）
│   │   └── config.py        # 配置管理
│   ├── run_crawler.py       # 爬虫命令行工具
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

### 为 AI 战略分析师设计

- **一站式工作台**：认知提升 + 信源聚合，覆盖日常工作全场景
- **全球视野**：整合 YouTube、X 等海外平台的 AI 领域 KOL 内容
- **通俗易懂的语言**：AI 使用简单语言解释复杂概念
- **生活化的类比**：降低理解门槛，让学习更有趣

### 流式 AI 响应

采用 Server-Sent Events (SSE) 技术实现实时流式输出，无需等待即可看到 AI 逐字生成的回复，提供类似 ChatGPT 的交互体验。

### 智能模型选择

支持多厂商模型选择，用户可根据需求灵活选择：

- **多厂商支持**：通义千问 (Qwen)、智谱 GLM、Kimi (Moonshot AI)、DeepSeek
- **模型分类**：按厂商分类展示，支持折叠/展开，节省空间
- **智能搜索**：支持按模型名称、描述快速搜索
- **时间排序**：模型按发布时间排序，最新模型优先展示
- **动态切换**：用户可在设置页面选择模型，实时生效
- **推荐模型**：默认使用 Qwen2.5-7B-Instruct，平衡性能与成本

### System Prompt 自定义

每个模块都有独立的 System Prompt，用户可根据需求个性化定制：

- **模块化配置**：论文伴侣（分析/对话）、术语通、知识沉淀、知识卡片各有独立 Prompt
- **实时生效**：自定义 Prompt 保存后立即应用到对应模块
- **本地持久化**：配置保存在浏览器本地，重启不丢失
- **一键恢复**：支持随时恢复到默认 Prompt

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

1. **首次使用**：
   - 访问设置页面配置 API Key
   - 根据需求选择合适的 AI 模型（日常使用推荐 Qwen2.5-7B，复杂任务可选 GLM-4.7 或 DeepSeek-V3.2）
2. **术语学习**：遇到不懂的概念，立即使用术语通查询并收藏
3. **论文阅读**：上传 PDF 后查看结构化分析，使用论文对话深入理解
4. **知识沉淀**：定期整理团队文档到知识库
5. **知识管理**：利用知识卡片统一管理术语和论文分析，定期复习巩固
6. **模型选择**：
   - 日常对话：Qwen2.5-7B（性价比高）
   - 复杂推理：GLM-4.7 或 DeepSeek-V3.2（性能强）
   - 长文本处理：Kimi-K2-Thinking（256K 上下文）
   - 多模态任务：Qwen3-VL 系列（图像理解）

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
