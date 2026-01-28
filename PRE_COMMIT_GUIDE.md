# 提交前检查指南

## 为什么需要提交前检查？

避免以下常见问题：
- TypeScript 类型错误
- 构建失败
- 运行时错误
- 部署失败

## 🚀 快速开始

### Windows (PowerShell)

```powershell
cd frontend
.\check-build.ps1
```

### macOS / Linux / Git Bash

```bash
cd frontend
chmod +x check-build.sh
./check-build.sh
```

## 📋 检查内容

检查脚本会执行以下操作：

1. ✅ **安装依赖** - 确保所有包都已安装
2. ✅ **TypeScript 类型检查** - 使用 `tsc --noEmit` 检查类型错误
3. ✅ **生产构建** - 运行 `npm run build` 模拟 Vercel 构建过程

## 🔧 常见错误及解决方案

### 1. TypeScript 类型错误

**错误示例：**
```
Property 'title' does not exist on type '{ coreProblem: string; ... }'
```

**解决方案：**
- 检查 TypeScript 接口定义（通常在 `lib/api.ts`）
- 确保访问的属性在接口中存在
- 使用可选链 `?.` 或提供默认值

### 2. 构建失败

**错误示例：**
```
Error: Command "npm run build" exited with 1
```

**解决方案：**
- 查看详细错误日志
- 确保所有文件都已保存
- 运行 `npm install --legacy-peer-deps` 重新安装依赖

### 3. 模块未找到

**错误示例：**
```
Module not found: Can't resolve '@/components/...'
```

**解决方案：**
- 检查文件路径是否正确
- 确认文件是否存在
- 检查 `tsconfig.json` 中的路径别名配置

## 🎯 最佳实践

### 提交前工作流

```bash
# 1. 本地测试
npm run dev  # 确保开发环境运行正常

# 2. 运行类型检查
npx tsc --noEmit

# 3. 运行构建检查
./check-build.sh  # 或 .\check-build.ps1

# 4. 提交代码
git add .
git commit -m "你的提交信息"
git push
```

### 使用 VS Code

安装推荐扩展：
- **ESLint** - 实时显示代码错误
- **TypeScript Error Translator** - 更易读的类型错误提示
- **Error Lens** - 在行内显示错误

在 VS Code 中启用类型检查：
1. 打开设置 (Ctrl+,)
2. 搜索 "typescript check js"
3. 启用 "TypeScript › Check JS"

## 🤖 自动化检查（GitHub Actions）

项目已配置 GitHub Actions，会在以下情况自动运行检查：
- 推送到 `main` 或 `dev` 分支
- 创建 Pull Request

查看构建状态：
1. 访问 GitHub 仓库
2. 点击 "Actions" 标签
3. 查看最新的工作流运行

## 📝 快速修复常见类型错误

### 访问不存在的属性

```typescript
// ❌ 错误
const title = summary.title

// ✅ 正确
const title = file?.name?.replace('.pdf', '') || '未命名'
```

### 类型不一致

```typescript
// ❌ 错误
const shares = post.shares > 0  // shares 是 string | number

// ✅ 正确
const shares = post.shares && post.shares !== '0'
```

### 缺少可选属性

```typescript
// ❌ 错误
const isExternal = link.external  // external 可能不存在

// ✅ 正确
const isExternal = link.external ?? false
```

## 🆘 遇到问题？

1. **查看完整错误信息** - 不要只看第一行
2. **检查文件是否保存** - 确保所有修改都已保存
3. **清除缓存** - `rm -rf .next node_modules && npm install --legacy-peer-deps`
4. **查看 Git 提交历史** - 对比上次成功的构建

## 🎓 学习资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [Next.js 构建错误排查](https://nextjs.org/docs/messages)
- [Vercel 部署指南](https://vercel.com/docs)

---

**记住：在本地运行 `check-build` 脚本可以节省大量调试时间！** ⏰

