# Report API Documentation

Base URL: `http://localhost:8000` (local) / `https://your-app.onrender.com` (production)

---

## 1. POST /api/report/generate

生成 Markdown 格式的行业洞察报告。支持自定义平台、作者、时间窗口、LLM、存储等配置。

### Request

```
POST /api/report/generate
Content-Type: application/json
```

### Request Body 字段说明

| 字段 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `platform` | string | `"twitter"` | 否 | 数据平台。可选值：`twitter`、`youtube` |
| `hours` | int | `24` | 否 | 时间窗口（小时）。分析最近 N 小时内的推文 |
| `authors` | string[] | `null` | 否 | 过滤指定作者的 username 列表（如 `["elonmusk", "karpathy"]`）。为空则分析所有作者 |
| `top_n` | int | `10` | 否 | 报告中展示的 Top N 高互动推文数量 |
| `report_style` | string | `"daily_insight"` | 否 | 报告风格（预留字段，当前仅支持 `daily_insight`） |
| `language` | string | `"zh"` | 否 | 报告语言（预留字段，当前仅支持 `zh`） |
| `storage` | object | `null` | 否 | 自定义 Supabase 存储配置。为空则使用系统默认 Supabase |
| `storage.supabase_url` | string | `null` | 否 | Supabase 项目 URL |
| `storage.supabase_key` | string | `null` | 否 | Supabase Secret Key（用于 Storage 上传） |
| `storage.bucket` | string | `"reports"` | 否 | Supabase Storage Bucket 名称 |
| `llm` | object | `null` | 否 | 自定义 LLM 配置。为空则使用系统默认 SiliconFlow API |
| `llm.api_key` | string | `null` | 否 | LLM API Key |
| `llm.model` | string | `null` | 否 | LLM 模型 ID（如 `"Qwen/Qwen2.5-7B-Instruct"`） |
| `llm.base_url` | string | `null` | 否 | LLM API Base URL（兼容 OpenAI 格式） |
| `send_dingtalk` | bool | `false` | 否 | 是否同时推送报告到钉钉 |

### Response 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| `success` | bool | 是否成功 |
| `markdown` | string | 完整 Markdown 报告内容 |
| `report_url` | string | 报告的公开访问 URL（Supabase Storage 或本地 URL） |
| `insights` | string | LLM 生成的洞察 Markdown 片段（报告中"核心洞察"部分） |
| `analytics_summary` | object | 数据分析摘要 |
| `analytics_summary.total_posts` | int | 数据库总推文数 |
| `analytics_summary.analysis_posts_count` | int | 本次分析的推文数 |
| `analytics_summary.total_views` | int | 分析推文总浏览量 |
| `analytics_summary.total_likes` | int | 分析推文总点赞数 |
| `analytics_summary.total_retweets` | int | 分析推文总转发数 |
| `analytics_summary.active_authors` | int | 活跃作者数量 |
| `analytics_summary.top_keywords` | string[] | 热门关键词列表（前 10 个） |
| `filename` | string | 报告文件名 |
| `generated_at` | string | 生成时间（ISO 8601） |
| `dingtalk_result` | object/null | 钉钉推送结果（仅 `send_dingtalk=true` 时返回） |

### curl 示例

#### 最简调用（全部使用默认值）

```bash
curl -X POST http://localhost:8000/api/report/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### 标准调用（指定时间窗口和 Top N）

```bash
curl -X POST http://localhost:8000/api/report/generate \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "twitter",
    "hours": 24,
    "top_n": 10
  }'
```

#### 过滤指定作者

```bash
curl -X POST http://localhost:8000/api/report/generate \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "twitter",
    "hours": 48,
    "authors": ["elonmusk", "karpathy", "demishassabis"],
    "top_n": 5
  }'
```

#### 使用自定义 Supabase 存储

```bash
curl -X POST http://localhost:8000/api/report/generate \
  -H "Content-Type: application/json" \
  -d '{
    "hours": 24,
    "storage": {
      "supabase_url": "https://your-project.supabase.co",
      "supabase_key": "your-secret-key",
      "bucket": "my-reports"
    }
  }'
```

#### 使用自定义 LLM

```bash
curl -X POST http://localhost:8000/api/report/generate \
  -H "Content-Type: application/json" \
  -d '{
    "hours": 24,
    "llm": {
      "api_key": "sk-xxx",
      "model": "gpt-4o-mini",
      "base_url": "https://api.openai.com/v1"
    }
  }'
```

#### 完整参数 + 钉钉推送

```bash
curl -X POST http://localhost:8000/api/report/generate \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "twitter",
    "hours": 24,
    "authors": null,
    "top_n": 10,
    "report_style": "daily_insight",
    "language": "zh",
    "storage": {
      "supabase_url": "https://your-project.supabase.co",
      "supabase_key": "your-secret-key",
      "bucket": "reports"
    },
    "llm": {
      "api_key": "sk-xxx",
      "model": "Qwen/Qwen2.5-7B-Instruct",
      "base_url": "https://api.siliconflow.cn/v1"
    },
    "send_dingtalk": true
  }'
```

### Response 示例

```json
{
  "success": true,
  "markdown": "# AI 行业推特日报 | 2026-02-07\n\n> 数据窗口：最近 24 小时 | 分析推文：44 条 | 活跃作者：19 位 | 总浏览量：52.7M\n\n---\n\n## 核心洞察\n\n### AI模型竞赛白热化\nGrok 4.20在Alpha Arena榜单中以+34.59%的收益夺冠...\n\n...",
  "report_url": "https://qgvpcqthblsxkpcwusen.supabase.co/storage/v1/object/public/reports/markdown/report_20260207_151954.md",
  "insights": "### AI模型竞赛白热化\nGrok 4.20在Alpha Arena榜单中以+34.59%的收益夺冠...\n\n### 言论自由与AI治理争议\n马斯克引用XFreeze关于\"限制言论自由方为恶的一方\"的推文...",
  "analytics_summary": {
    "total_posts": 579,
    "analysis_posts_count": 44,
    "total_views": 52732553,
    "total_likes": 397727,
    "total_retweets": 67728,
    "active_authors": 19,
    "top_keywords": ["memory", "agent", "model", "use", "agents", "loop", "work", "code", "latent", "framework"]
  },
  "filename": "report_20260207_151954.md",
  "generated_at": "2026-02-07T15:19:54.123456",
  "dingtalk_result": null
}
```

---

## 2. POST /api/report/send-dingtalk

将报告发送到钉钉群。可使用自定义消息或自动生成新报告。

### Request Body 字段说明

| 字段 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `report_url` | string | `null` | 否 | 报告 URL。提供后钉钉消息会包含"查看完整报告"按钮 |
| `custom_message` | string | `null` | 否 | 自定义消息内容。为空则自动生成新报告的洞察摘要 |
| `hours` | int | `24` | 否 | 自动生成报告时的时间窗口 |

### Response 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| `success` | bool | 是否发送成功 |
| `message` | string | 发送结果描述 |
| `mode` | string | 消息模式：`"Markdown"`（纯文本）或 `"ActionCard"`（带按钮） |
| `report_url` | string/null | 报告 URL |
| `dingtalk_result` | object | 钉钉 API 返回结果 |

### curl 示例

#### 自动生成并发送

```bash
curl -X POST http://localhost:8000/api/report/send-dingtalk \
  -H "Content-Type: application/json" \
  -d '{
    "hours": 24
  }'
```

#### 发送自定义消息 + 报告链接

```bash
curl -X POST http://localhost:8000/api/report/send-dingtalk \
  -H "Content-Type: application/json" \
  -d '{
    "custom_message": "今日AI行业要点：Grok 4.20 夺冠，Waymo发布世界模型。",
    "report_url": "https://qgvpcqthblsxkpcwusen.supabase.co/storage/v1/object/public/reports/markdown/report_20260207_151954.md"
  }'
```

### Response 示例

```json
{
  "success": true,
  "message": "发送成功",
  "mode": "ActionCard",
  "report_url": "https://qgvpcqthblsxkpcwusen.supabase.co/storage/v1/object/public/reports/markdown/report_20260207_151954.md",
  "dingtalk_result": {
    "errcode": 0,
    "errmsg": "ok"
  }
}
```

---

## 3. GET /api/report/latest

获取最新一份报告的元数据。

### curl 示例

```bash
curl http://localhost:8000/api/report/latest
```

### Response 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| `success` | bool | 是否成功 |
| `data` | object/null | 最新报告信息，无报告时为 null |
| `data.filename` | string | 文件名 |
| `data.url` | string | 本地访问 URL |
| `data.generated_at` | string | 生成时间（ISO 8601） |
| `data.size_kb` | float | 文件大小（KB） |
| `data.format` | string | 文件格式：`"markdown"` 或 `"html"` |

### Response 示例

```json
{
  "success": true,
  "data": {
    "filename": "report_20260207_151954.md",
    "url": "http://localhost:8000/reports/report_20260207_151954.md",
    "generated_at": "2026-02-07T15:19:54",
    "size_kb": 8.4,
    "format": "markdown"
  }
}
```

---

## 4. GET /api/report/list

列出所有已生成的报告（按时间倒序）。

### curl 示例

```bash
curl http://localhost:8000/api/report/list
```

### Response 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| `success` | bool | 是否成功 |
| `count` | int | 报告总数 |
| `reports` | array | 报告列表 |
| `reports[].filename` | string | 文件名 |
| `reports[].url` | string | 本地访问 URL |
| `reports[].generated_at` | string | 生成时间 |
| `reports[].size_kb` | float | 文件大小（KB） |
| `reports[].format` | string | 文件格式 |

### Response 示例

```json
{
  "success": true,
  "count": 3,
  "reports": [
    {
      "filename": "report_20260207_151954.md",
      "url": "http://localhost:8000/reports/report_20260207_151954.md",
      "generated_at": "2026-02-07T15:19:54",
      "size_kb": 8.4,
      "format": "markdown"
    },
    {
      "filename": "report_20260207_143830.html",
      "url": "http://localhost:8000/reports/report_20260207_143830.html",
      "generated_at": "2026-02-07T14:38:30",
      "size_kb": 12.1,
      "format": "html"
    }
  ]
}
```

---

## 5. GET /reports/{filename}

直接访问报告文件（静态文件服务）。

### curl 示例

```bash
curl http://localhost:8000/reports/report_20260207_151954.md
```

返回原始 Markdown/HTML 文件内容。

---

## 数据流图

```
POST /api/report/generate
    │
    ▼
  ① 加载数据 (posts.json / videos.json)
    │
    ▼
  ② 过滤 + 分析 (时间窗口/作者/Top N/关键词/互动排序)
    │
    ▼
  ③ 构建 LLM 输入 (~2-3K 字，仅 Top N 推文摘要)
    │
    ▼
  ④ LLM 生成洞察 (1 次调用，返回 3-5 个洞察要点)
    │
    ▼
  ⑤ 模板渲染 Markdown (程序化拼装：头部+洞察+推文+作者+关键词+页脚)
    │
    ├──▶ ⑥a 保存本地 (.md 文件)
    │
    └──▶ ⑥b 上传 Supabase Storage (返回公开 URL)
    │
    ▼
  ⑦ (可选) 推送钉钉
    │
    ▼
  返回 JSON: {markdown, report_url, insights, analytics_summary, ...}
```

---

## 错误处理

| HTTP 状态码 | 说明 |
|---|---|
| 200 | 成功 |
| 400 | 参数错误（如无可用数据） |
| 500 | 服务端错误（LLM 调用失败会降级，不会 500；Supabase 上传失败会回退本地 URL） |

**降级策略**：
- LLM 不可用：洞察部分替换为简单的数据概览文本
- Supabase 不可用：`report_url` 回退为本地 URL (`http://localhost:8000/reports/xxx.md`)
- 时间窗口内推文不足 5 条：自动扩展到全部数据（最近 50 条）
