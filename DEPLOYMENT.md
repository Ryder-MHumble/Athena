# 部署配置指南

本文档说明如何正确配置 Vercel（前端）和 Render（后端）的部署。

## 🔧 问题诊断

如果遇到以下问题：
- ❌ 论文伴侣无法加载分析内容
- ❌ 前端无法连接到后端 API
- ❌ CORS 错误
- ❌ Network Error

请按照以下步骤检查和配置。

---

## 📋 部署前检查清单

### 1. Render（后端）环境变量配置

在 Render Dashboard → Your Service → Environment 中添加以下环境变量：

```bash
# 必需：CORS 配置（允许 Vercel 域名访问）
CORS_ORIGINS=https://athena-coral-five.vercel.app,https://athena-coral-five-git-main-xxx.vercel.app

# 必需：SiliconFlow API Key
SILICONFLOW_API_KEY=sk-your-api-key-here

# 可选：团队密钥
TEAM_ACCESS_KEY=your-team-key

# Supabase 配置（如果使用知识库功能）
SUPABASE_URL=https://casxuvpohhbuqvmkqunb.supabase.co
SUPABASE_KEY=your-supabase-key
SUPABASE_SECRET_KEY=your-supabase-secret-key
```

**重要提示：**
- `CORS_ORIGINS` 必须包含你的 Vercel 域名（包括预览部署的域名）
- 多个域名用**逗号分隔**，不要有空格
- 域名必须包含 `https://` 协议

### 2. Vercel（前端）环境变量配置

在 Vercel Dashboard → Your Project → Settings → Environment Variables 中添加：

```bash
# 必需：后端 API URL（Render 服务地址）
NEXT_PUBLIC_API_URL=https://athena-backend.onrender.com

# 可选：默认 API Key（用户也可以在设置页面配置）
NEXT_PUBLIC_SILICONFLOW_API_KEY=sk-your-api-key-here
```

**重要提示：**
- `NEXT_PUBLIC_API_URL` 必须是你的 Render 后端服务的完整 URL
- 确保 URL 以 `https://` 开头
- 不要包含末尾的斜杠 `/`

### 3. 获取 Render 后端 URL

1. 登录 [Render Dashboard](https://dashboard.render.com/)
2. 找到你的后端服务（例如：`athena-backend`）
3. 复制服务的 URL（格式：`https://your-service-name.onrender.com`）
4. 将这个 URL 配置到 Vercel 的 `NEXT_PUBLIC_API_URL` 环境变量中

### 4. 获取 Vercel 域名

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到你的项目（例如：`athena-coral-five`）
3. 复制生产域名和预览域名
4. 将所有域名添加到 Render 的 `CORS_ORIGINS` 环境变量中

**Vercel 域名格式：**
- 生产域名：`https://athena-coral-five.vercel.app`
- 预览域名：`https://athena-coral-five-git-main-xxx.vercel.app`

---

## 🔍 验证配置

### 1. 检查后端健康状态

在浏览器中访问：
```
https://your-render-backend.onrender.com/health
```

应该返回：
```json
{"status": "healthy"}
```

### 2. 检查 CORS 配置

在浏览器控制台（F12）中运行：
```javascript
fetch('https://your-render-backend.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

如果配置正确，应该能成功获取响应。

### 3. 检查前端 API 连接

在浏览器控制台（F12）中运行：
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
```

或者在 Network 标签页中查看 API 请求的 URL。

---

## 🐛 常见问题排查

### 问题 1: CORS 错误

**错误信息：**
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**解决方案：**
1. 检查 Render 的 `CORS_ORIGINS` 环境变量是否包含你的 Vercel 域名
2. 确保域名格式正确（包含 `https://`）
3. 重启 Render 服务使配置生效

### 问题 2: Network Error / 连接失败

**错误信息：**
```
NetworkError when attempting to fetch resource
ERR_FAILED
```

**解决方案：**
1. 检查 Vercel 的 `NEXT_PUBLIC_API_URL` 环境变量是否正确
2. 确认 Render 服务正在运行（访问 `/health` 端点）
3. 检查 Render 服务的 URL 是否正确

### 问题 3: 论文分析一直加载

**可能原因：**
1. API URL 配置错误，请求发送到了错误地址
2. CORS 配置错误，请求被阻止
3. Render 服务未正常运行

**解决方案：**
1. 打开浏览器开发者工具（F12）
2. 查看 Network 标签页，找到失败的请求
3. 检查请求 URL 和响应状态码
4. 查看 Console 标签页的错误信息

### 问题 4: 环境变量未生效

**解决方案：**
1. **Vercel**: 重新部署项目（Redeploy）
2. **Render**: 重启服务（Restart）
3. 清除浏览器缓存并硬刷新（Ctrl+Shift+R 或 Cmd+Shift+R）

---

## 📝 配置示例

### Render 环境变量示例

```
CORS_ORIGINS=https://athena-coral-five.vercel.app,https://athena-coral-five-git-main-xxx.vercel.app
SILICONFLOW_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
SUPABASE_URL=https://casxuvpohhbuqvmkqunb.supabase.co
SUPABASE_KEY=sb_publishable_xxxxxxxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxx
```

### Vercel 环境变量示例

```
NEXT_PUBLIC_API_URL=https://athena-backend.onrender.com
NEXT_PUBLIC_SILICONFLOW_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 部署后验证步骤

1. ✅ 访问前端应用，检查是否能正常加载
2. ✅ 打开浏览器开发者工具（F12），查看 Console 是否有错误
3. ✅ 尝试使用"术语通"功能，测试 API 连接
4. ✅ 尝试使用"论文伴侣"功能，上传 PDF 测试分析功能
5. ✅ 检查 Network 标签页，确认 API 请求都发送到正确的后端地址

---

## 💡 提示

- 每次修改环境变量后，都需要**重新部署**（Vercel）或**重启服务**（Render）
- 建议在 Render Dashboard 中启用"Auto-Deploy"，这样代码推送后会自动部署
- 如果使用自定义域名，记得将自定义域名也添加到 `CORS_ORIGINS` 中
- 生产环境建议使用环境变量而不是硬编码 URL

---

## 📞 需要帮助？

如果按照以上步骤仍然无法解决问题，请检查：
1. Render 服务日志（Dashboard → Logs）
2. Vercel 部署日志（Dashboard → Deployments → View Logs）
3. 浏览器控制台错误信息
4. Network 标签页的请求详情
