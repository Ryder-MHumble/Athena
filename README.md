# Athena - AI 战略分析师智能工作台

专为非技术背景的 AI 战略分析师设计的智能工作台。

## 🚀 快速开始

### 一键启动（推荐）

```bash
# 启动所有服务（会自动安装依赖、启动前后端、打开浏览器）
./start.sh

# 停止所有服务
./stop.sh
```

就这么简单！脚本会自动：
- ✅ 检查并安装依赖
- ✅ 启动后端服务（端口 8000）
- ✅ 启动前端服务（端口 3000）
- ✅ 自动打开浏览器

### 手动启动

如果你想手动控制：

#### 后端
```bash
cd backend
pip install -r requirements.txt
python run.py
```

#### 前端（新终端）
```bash
cd frontend
npm install
npm run dev
```

## 📁 项目结构

```
Athena/
├── frontend/          # Next.js 前端应用
├── backend/           # FastAPI 后端应用
├── start.sh           # 一键启动脚本
├── stop.sh            # 停止脚本
└── README.md
```

## 🎯 功能模块

1. **术语通** - 多轮对话，用通俗语言解释专业术语
2. **论文伴侣** - PDF 分析，生成结构化报告和演讲稿
3. **知识沉淀** - 团队共享知识库，向量检索
4. **灵感单词本** - 收藏的术语，卡片式复习
5. **设置** - API Key 和团队密钥配置

## ⚙️ 环境配置

所有环境变量已自动配置在：
- `backend/.env` - 后端配置（包含所有 API Keys）
- `frontend/.env.local` - 前端配置

首次使用需要在**设置页面**输入 SiliconFlow API Key（会存储在浏览器本地）。

## 📚 访问地址

- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs

## 🛠️ 技术栈

- **前端**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand
- **后端**: FastAPI, LangChain, LangGraph, Supabase
- **AI**: SiliconFlow (Qwen2.5-72B), BGE Embedding, DuckDuckGo Search

## 📖 详细文档

- [快速启动指南](QUICKSTART.md) - 详细的启动步骤和故障排除
- [项目结构说明](PROJECT_STRUCTURE.md) - 完整的项目结构文档
- [开发规范书](Athena%20开发规范书.md) - 项目开发规范

## 🐛 常见问题

### 端口被占用

如果 3000 或 8000 端口被占用，可以：

1. 停止占用端口的进程
2. 或修改配置文件中的端口号

### 依赖安装失败

```bash
# 后端
cd backend
pip install -r requirements.txt

# 前端
cd frontend
npm install
```

### 查看日志

启动脚本会生成日志文件：
- `.backend.log` - 后端日志
- `.frontend.log` - 前端日志

## 📝 开发规范

详见 `Athena 开发规范书.md`
