# 🚀 Athena 一键启动指南

## 快速启动

### 方法一：使用启动脚本（推荐）

```bash
# 在项目根目录执行
./start.sh
```

就这么简单！脚本会自动：
1. ✅ 检查 Python 和 Node.js 环境
2. ✅ 自动安装缺失的依赖
3. ✅ 启动后端服务（端口 8000）
4. ✅ 启动前端服务（端口 3000）
5. ✅ 等待服务就绪后自动打开浏览器

### 停止服务

按 `Ctrl+C` 或运行：

```bash
./stop.sh
```

## 脚本功能说明

### `start.sh` - 启动脚本

**功能特性：**
- 🔍 自动检查依赖（Python、Node.js）
- 📦 自动安装缺失的依赖包
- 🚀 后台启动前后端服务
- ⏱️ 智能等待服务就绪
- 🌐 自动打开浏览器
- 📝 实时监控服务状态
- 🛑 优雅的清理机制（Ctrl+C 自动停止所有服务）

**输出信息：**
- 服务启动状态
- 服务访问地址
- 日志文件位置
- 进程 PID

### `stop.sh` - 停止脚本

**功能特性：**
- 🛑 停止所有运行中的服务
- 🧹 清理残留进程
- 📋 显示停止状态

## 使用示例

### 第一次使用

```bash
# 1. 进入项目目录
cd "/Users/sunminghao/Desktop/My Projects/Athena"

# 2. 运行启动脚本
./start.sh

# 3. 等待自动打开浏览器（或手动访问 http://localhost:3000）

# 4. 使用完毕后按 Ctrl+C 停止
```

### 日常使用

```bash
# 启动
./start.sh

# 停止（在另一个终端）
./stop.sh
```

## 访问地址

启动成功后，你可以访问：

- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs

## 日志文件

脚本运行时会生成日志文件：

- `.backend.log` - 后端服务日志
- `.frontend.log` - 前端服务日志

查看日志：
```bash
# 查看后端日志
tail -f .backend.log

# 查看前端日志
tail -f .frontend.log
```

## 故障排除

### 问题 1: 权限不足

```bash
chmod +x start.sh stop.sh
```

### 问题 2: 端口被占用

如果 3000 或 8000 端口被占用：

```bash
# 查看占用端口的进程
lsof -i :3000
lsof -i :8000

# 停止占用进程
kill -9 <PID>
```

### 问题 3: 依赖安装失败

手动安装依赖：

```bash
# 后端依赖
cd backend
pip install -r requirements.txt

# 前端依赖
cd frontend
npm install
```

### 问题 4: 服务启动失败

检查日志文件：

```bash
# 查看后端错误
cat .backend.log

# 查看前端错误
cat .frontend.log
```

### 问题 5: 浏览器未自动打开

手动访问：http://localhost:3000

## 高级用法

### 只启动后端

```bash
cd backend
python run.py
```

### 只启动前端

```bash
cd frontend
npm run dev
```

### 后台运行（不阻塞终端）

```bash
nohup ./start.sh > start.log 2>&1 &
```

## 注意事项

1. **首次运行**：脚本会自动安装依赖，可能需要几分钟
2. **环境要求**：
   - Python 3.10+
   - Node.js 18+
3. **端口占用**：确保 3000 和 8000 端口未被占用
4. **环境变量**：确保 `.env` 文件已正确配置
5. **停止服务**：使用 `Ctrl+C` 或 `./stop.sh` 优雅停止

## 提示

- 脚本会保持运行状态，实时监控服务
- 按 `Ctrl+C` 会优雅地停止所有服务
- 日志文件会保存在项目根目录
- PID 文件用于进程管理，不要手动删除

享受使用 Athena！🎉

