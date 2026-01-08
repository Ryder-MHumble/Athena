# 🚀 Athena 快速启动指南

## ✅ 环境配置已完成

所有必要的 `.env` 文件已创建并配置好：
- ✅ `backend/.env` - 后端环境变量（包含所有 API Keys）
- ✅ `frontend/.env.local` - 前端环境变量

## 📦 安装依赖

### 后端依赖安装

```bash
cd backend
pip install -r requirements.txt
```

如果使用虚拟环境（推荐）：

```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
# 或 venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 前端依赖安装

```bash
cd frontend
npm install
```

## 🏃 启动项目

### 1. 启动后端服务

```bash
cd backend
python run.py
```

后端服务将在 `http://localhost:8000` 启动

你可以访问 `http://localhost:8000/docs` 查看 API 文档

### 2. 启动前端服务

打开新的终端窗口：

```bash
cd frontend
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

## 🧪 测试项目

1. 打开浏览器访问 `http://localhost:3000`
2. 你应该能看到 Athena 首页，显示 5 个功能模块
3. 点击导航栏可以切换不同模块

## 📝 重要提示

### API Key 配置

- **SiliconFlow API Key** 已在 `backend/.env` 中配置
- **Supabase 配置** 已全部配置好
- **Team Access Key** 默认设置为 `athena_team_2024`（可在设置页面修改）

### 前端 API Key

前端需要用户在**设置页面**手动输入 SiliconFlow API Key，这个 Key 会：
- 存储在浏览器的 localStorage 中
- 自动添加到所有 API 请求的 Header 中

### 首次使用

1. 访问 `http://localhost:3000/settings`
2. 输入你的 SiliconFlow API Key（已在后端配置，但前端需要单独配置）
3. 输入 Team Access Key（默认：`athena_team_2024`）
4. 保存后即可使用各个功能模块

## 🐛 常见问题

### 后端启动失败

1. 检查 Python 版本（需要 3.10+）
   ```bash
   python --version
   ```

2. 检查依赖是否安装完整
   ```bash
   pip list | grep fastapi
   ```

3. 检查 `.env` 文件是否存在
   ```bash
   ls -la backend/.env
   ```

### 前端启动失败

1. 检查 Node.js 版本（需要 18+）
   ```bash
   node --version
   ```

2. 清除缓存重新安装
   ```bash
   cd frontend
   rm -rf node_modules .next
   npm install
   ```

### CORS 错误

如果前端无法连接后端，检查：
1. 后端是否正在运行（`http://localhost:8000`）
2. `backend/.env` 中的 `CORS_ORIGINS` 是否包含 `http://localhost:3000`

## 📚 下一步

现在你可以：
1. 测试各个功能模块
2. 查看 `PROJECT_STRUCTURE.md` 了解项目结构
3. 查看 `Athena 开发规范书.md` 了解开发规范

## 🎉 开始使用

项目已配置完成，可以直接使用了！

