'use client'

import { useState, useEffect } from 'react'
import { 
  FileSearch, 
  Database, 
  Languages, 
  MessageSquare, 
  Brain, 
  FileText,
  Activity,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Play,
  ExternalLink,
  Code2,
  Terminal,
  Zap,
  Server,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/useAppStore'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const BACKEND_URL = 'https://athena-backend-lh6o.onrender.com'

// 图标映射
const iconMap: Record<string, any> = {
  FileSearch,
  Database,
  Languages,
  MessageSquare,
  Brain,
  FileText,
  Activity,
}

// 静态 API 文档数据（后备方案）
const STATIC_API_DOCS: APICategory[] = [
  {
    id: 'pdf-analyzer',
    name: 'PDF 智析',
    description: 'PDF 文档解析、翻译和图表提取服务',
    icon: 'FileSearch',
    endpoints: [
      {
        method: 'POST',
        path: '/api/pdf-analyzer/analyze/stream',
        name: '流式分析 PDF',
        description: '上传 PDF 文件或提供 URL，返回 SSE 事件流，实时显示解析进度',
        category: 'pdf-analyzer',
        parameters: [
          { name: 'X-API-Key', type: 'header', required: true, description: 'SiliconFlow API Key' },
          { name: 'X-MinerU-API-Key', type: 'header', required: true, description: 'MinerU API Key' },
          { name: 'file', type: 'file', required: false, description: 'PDF 文件（与 url 二选一）' },
          { name: 'url', type: 'string', required: false, description: 'PDF 文件 URL（与 file 二选一）' },
          { name: 'translate', type: 'boolean', required: false, description: '是否翻译', default: 'false' },
          { name: 'extract_charts', type: 'boolean', required: false, description: '是否提取图表', default: 'true' },
        ],
        response_example: {
          status: 'complete',
          progress: 100,
          message: '分析完成',
          data: {
            success: true,
            originalText: '提取的原文...',
            translatedText: '翻译后的文本...',
            charts: [{ id: 'img_1', type: 'diagram', imageUrl: '/api/pdf-analyzer/image/img_1' }],
          }
        },
        curl_example: `curl -X POST "${BACKEND_URL}/api/pdf-analyzer/analyze/stream" \\
  -H "X-API-Key: your-api-key" \\
  -H "X-MinerU-API-Key: your-mineru-key" \\
  -F "file=@document.pdf" \\
  -F "translate=false"`,
        notes: '返回 SSE 事件流，需要使用 EventSource 或流式读取处理'
      },
      {
        method: 'GET',
        path: '/api/pdf-analyzer/image/{image_id}',
        name: '获取图表图片',
        description: '获取解析出的图表/图片',
        category: 'pdf-analyzer',
        parameters: [
          { name: 'image_id', type: 'path', required: true, description: '图片 ID' },
        ],
        curl_example: `curl "${BACKEND_URL}/api/pdf-analyzer/image/img_123"`,
      },
      {
        method: 'GET',
        path: '/api/pdf-analyzer/status',
        name: '服务状态',
        description: '检查 MinerU API 配置状态',
        category: 'pdf-analyzer',
        parameters: [],
        response_example: { configured: true, has_api_key: true },
        curl_example: `curl "${BACKEND_URL}/api/pdf-analyzer/status"`,
      },
    ]
  },
  {
    id: 'crawler',
    name: '数据爬虫',
    description: 'Twitter/X 和 YouTube 信源爬取服务',
    icon: 'Database',
    endpoints: [
      {
        method: 'POST',
        path: '/api/crawler/crawl/all',
        name: '爬取所有信源',
        description: '爬取所有配置的 Twitter 和 YouTube 信源',
        category: 'crawler',
        parameters: [
          { name: 'async_mode', type: 'query', required: false, description: '是否异步执行', default: 'false' },
        ],
        response_example: {
          success: true,
          message: '爬取完成',
          data: { twitter: { total_posts: 50 }, youtube: { total_videos: 30 } }
        },
        curl_example: `curl -X POST "${BACKEND_URL}/api/crawler/crawl/all"`,
      },
      {
        method: 'GET',
        path: '/api/crawler/sources',
        name: '获取信源列表',
        description: '获取所有配置的信源',
        category: 'crawler',
        parameters: [],
        response_example: {
          success: true,
          sources: {
            twitter: [{ name: 'OpenAI', handle: 'OpenAI' }],
            youtube: [{ name: 'Tech Channel', channel_id: 'UC...' }]
          }
        },
        curl_example: `curl "${BACKEND_URL}/api/crawler/sources"`,
      },
      {
        method: 'POST',
        path: '/api/crawler/sources',
        name: '添加信源',
        description: '添加新的 Twitter 或 YouTube 信源',
        category: 'crawler',
        parameters: [],
        request_body: { platform: 'twitter', name: 'OpenAI', handle: 'OpenAI' },
        curl_example: `curl -X POST "${BACKEND_URL}/api/crawler/sources" \\
  -H "Content-Type: application/json" \\
  -d '{"platform": "twitter", "name": "OpenAI", "handle": "OpenAI"}'`,
      },
      {
        method: 'GET',
        path: '/api/crawler/data/twitter',
        name: '获取 Twitter 数据',
        description: '获取已爬取的 Twitter 帖子数据',
        category: 'crawler',
        parameters: [],
        curl_example: `curl "${BACKEND_URL}/api/crawler/data/twitter"`,
      },
      {
        method: 'GET',
        path: '/api/crawler/data/youtube',
        name: '获取 YouTube 数据',
        description: '获取已爬取的 YouTube 视频数据',
        category: 'crawler',
        parameters: [],
        curl_example: `curl "${BACKEND_URL}/api/crawler/data/youtube"`,
      },
    ]
  },
  {
    id: 'translate',
    name: '翻译服务',
    description: '文本翻译 API',
    icon: 'Languages',
    endpoints: [
      {
        method: 'POST',
        path: '/api/translate',
        name: '翻译文本',
        description: '将文本从源语言翻译为目标语言',
        category: 'translate',
        parameters: [
          { name: 'X-API-Key', type: 'header', required: true, description: 'SiliconFlow API Key' },
        ],
        request_body: {
          text: 'Hello, world!',
          source_lang: 'en',
          target_lang: 'zh',
          max_chunk_size: 3000
        },
        response_example: {
          success: true,
          translated_text: '你好，世界！',
          source_lang: 'en',
          target_lang: 'zh'
        },
        curl_example: `curl -X POST "${BACKEND_URL}/api/translate" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{"text": "Hello, world!", "source_lang": "en", "target_lang": "zh"}'`,
      },
    ]
  },
  {
    id: 'chat',
    name: 'AI 对话',
    description: 'AI 聊天和术语解释服务',
    icon: 'MessageSquare',
    endpoints: [
      {
        method: 'POST',
        path: '/api/chat/',
        name: 'AI 对话',
        description: '发送消息给 AI 助手，获取回复',
        category: 'chat',
        parameters: [
          { name: 'X-API-Key', type: 'header', required: true, description: 'SiliconFlow API Key' },
        ],
        request_body: {
          message: '什么是机器学习？',
          system_prompt: '你是一个 AI 助手',
          model: 'Qwen/Qwen2.5-7B-Instruct'
        },
        response_example: {
          success: true,
          content: '机器学习是人工智能的一个分支...'
        },
        curl_example: `curl -X POST "${BACKEND_URL}/api/chat/" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{"message": "什么是机器学习？"}'`,
      },
      {
        method: 'POST',
        path: '/api/chat/stream',
        name: '流式 AI 对话',
        description: '发送消息给 AI 助手，流式返回回复',
        category: 'chat',
        parameters: [
          { name: 'X-API-Key', type: 'header', required: true, description: 'SiliconFlow API Key' },
        ],
        request_body: { message: '详细解释深度学习', stream: true },
        curl_example: `curl -X POST "${BACKEND_URL}/api/chat/stream" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{"message": "详细解释深度学习"}'`,
        notes: '返回 SSE 事件流'
      },
    ]
  },
  {
    id: 'knowledge',
    name: '知识库',
    description: '文档上传和知识库检索服务',
    icon: 'Brain',
    endpoints: [
      {
        method: 'POST',
        path: '/api/knowledge/upload',
        name: '上传文档',
        description: '上传文档到知识库',
        category: 'knowledge',
        parameters: [
          { name: 'X-API-Key', type: 'header', required: true, description: 'SiliconFlow API Key' },
          { name: 'file', type: 'file', required: true, description: '文档文件' },
          { name: 'team_key', type: 'form', required: false, description: '团队 Key', default: 'default' },
        ],
        curl_example: `curl -X POST "${BACKEND_URL}/api/knowledge/upload" \\
  -H "X-API-Key: your-api-key" \\
  -F "file=@document.pdf" \\
  -F "team_key=my-team"`,
      },
      {
        method: 'GET',
        path: '/api/knowledge/documents',
        name: '获取文档列表',
        description: '获取知识库中的文档列表',
        category: 'knowledge',
        parameters: [
          { name: 'team_key', type: 'query', required: false, description: '团队 Key' },
        ],
        curl_example: `curl "${BACKEND_URL}/api/knowledge/documents?team_key=my-team"`,
      },
    ]
  },
  {
    id: 'paper',
    name: '论文分析',
    description: '学术论文解析和分析服务',
    icon: 'FileText',
    endpoints: [
      {
        method: 'POST',
        path: '/api/paper/analyze',
        name: '分析论文',
        description: '上传论文进行 AI 分析',
        category: 'paper',
        parameters: [
          { name: 'X-API-Key', type: 'header', required: true, description: 'SiliconFlow API Key' },
          { name: 'file', type: 'file', required: false, description: '论文 PDF 文件' },
          { name: 'paper_text', type: 'form', required: false, description: '论文文本（与 file 二选一）' },
        ],
        curl_example: `curl -X POST "${BACKEND_URL}/api/paper/analyze" \\
  -H "X-API-Key: your-api-key" \\
  -F "file=@paper.pdf"`,
      },
      {
        method: 'POST',
        path: '/api/paper/chat',
        name: '与论文对话',
        description: '基于论文内容进行问答',
        category: 'paper',
        parameters: [
          { name: 'X-API-Key', type: 'header', required: true, description: 'SiliconFlow API Key' },
        ],
        request_body: {
          question: '这篇论文的主要贡献是什么？',
          paper_text: '论文内容...',
          chat_history: []
        },
        curl_example: `curl -X POST "${BACKEND_URL}/api/paper/chat" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{"question": "主要贡献是什么？", "paper_text": "论文内容..."}'`,
      },
    ]
  },
  {
    id: 'system',
    name: '系统',
    description: '系统健康检查和状态监控',
    icon: 'Activity',
    endpoints: [
      {
        method: 'GET',
        path: '/',
        name: 'API 状态',
        description: '获取 API 运行状态',
        category: 'system',
        parameters: [],
        response_example: {
          message: 'Athena API is running',
          version: '0.1.0',
          auto_crawl: true,
          crawl_interval_hours: 3
        },
        curl_example: `curl "${BACKEND_URL}/"`,
      },
      {
        method: 'GET',
        path: '/health',
        name: '健康检查',
        description: '服务健康检查',
        category: 'system',
        parameters: [],
        response_example: { status: 'healthy' },
        curl_example: `curl "${BACKEND_URL}/health"`,
      },
    ]
  },
]

interface APIParameter {
  name: string
  type: string
  required: boolean
  description: string
  default?: string
}

interface APIEndpoint {
  method: string
  path: string
  name: string
  description: string
  category: string
  parameters: APIParameter[]
  request_body?: Record<string, any>
  response_example?: Record<string, any>
  curl_example: string
  notes?: string
}

interface APICategory {
  id: string
  name: string
  description: string
  icon: string
  endpoints: APIEndpoint[]
}

// 方法颜色
const methodColors: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  POST: 'bg-blue-100 text-blue-700 border-blue-200',
  PUT: 'bg-amber-100 text-amber-700 border-amber-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
  PATCH: 'bg-purple-100 text-purple-700 border-purple-200',
}

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('已复制到剪贴板')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${className}`}
      title="复制"
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400" />
      )}
    </button>
  )
}

function EndpointCard({ endpoint, baseUrl }: { endpoint: APIEndpoint; baseUrl: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTestMode, setIsTestMode] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { apiKey, mineruApiKey } = useAppStore()

  const fullUrl = `${baseUrl}${endpoint.path}`

  const handleTest = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // 添加 API Key
      if (apiKey) {
        headers['X-API-Key'] = apiKey
      }
      if (mineruApiKey && endpoint.category === 'pdf-analyzer') {
        headers['X-MinerU-API-Key'] = mineruApiKey
      }

      const options: RequestInit = {
        method: endpoint.method,
        headers,
      }

      // 对于有请求体的方法
      if (endpoint.request_body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        options.body = JSON.stringify(endpoint.request_body)
      }

      const response = await fetch(fullUrl, options)
      const data = await response.json()
      setTestResult(JSON.stringify(data, null, 2))
    } catch (error: any) {
      setTestResult(`错误: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* 头部 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
      >
        <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${methodColors[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-sm text-gray-600 font-mono flex-1 text-left truncate">
          {endpoint.path}
        </code>
        <span className="text-sm text-gray-500 hidden sm:block">{endpoint.name}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* 描述 */}
          <p className="text-gray-600">{endpoint.description}</p>

          {/* 注意事项 */}
          {endpoint.notes && (
            <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700 border border-amber-100">
              <strong>注意：</strong> {endpoint.notes}
            </div>
          )}

          {/* 参数 */}
          {endpoint.parameters.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                参数
              </h4>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-2 font-medium">名称</th>
                      <th className="text-left p-2 font-medium">位置</th>
                      <th className="text-left p-2 font-medium">必填</th>
                      <th className="text-left p-2 font-medium">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.parameters.map((param) => (
                      <tr key={param.name} className="border-t border-gray-100">
                        <td className="p-2 font-mono text-cyan-600">{param.name}</td>
                        <td className="p-2 text-gray-500">{param.type}</td>
                        <td className="p-2">
                          {param.required ? (
                            <span className="text-red-500">是</span>
                          ) : (
                            <span className="text-gray-400">否</span>
                          )}
                        </td>
                        <td className="p-2 text-gray-600">
                          {param.description}
                          {param.default && (
                            <span className="text-gray-400 ml-1">(默认: {param.default})</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 请求体示例 */}
          {endpoint.request_body && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  请求体示例
                </span>
                <CopyButton text={JSON.stringify(endpoint.request_body, null, 2)} />
              </h4>
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
                {JSON.stringify(endpoint.request_body, null, 2)}
              </pre>
            </div>
          )}

          {/* 响应示例 */}
          {endpoint.response_example && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  响应示例
                </span>
                <CopyButton text={JSON.stringify(endpoint.response_example, null, 2)} />
              </h4>
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
                {JSON.stringify(endpoint.response_example, null, 2)}
              </pre>
            </div>
          )}

          {/* cURL 示例 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                cURL 命令
              </span>
              <CopyButton text={endpoint.curl_example} />
            </h4>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm whitespace-pre-wrap">
              {endpoint.curl_example}
            </pre>
          </div>

          {/* 在线测试 */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Play className="w-4 h-4" />
                在线测试
              </h4>
              <button
                onClick={() => setIsTestMode(!isTestMode)}
                className="text-sm text-cyan-600 hover:text-cyan-700"
              >
                {isTestMode ? '收起' : '展开测试面板'}
              </button>
            </div>

            {isTestMode && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={fullUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={handleTest}
                    disabled={isLoading}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        测试中...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        发送请求
                      </>
                    )}
                  </button>
                </div>

                {!apiKey && (
                  <p className="text-sm text-amber-600">
                    ⚠️ 未配置 API Key，部分接口可能无法测试。请在设置页面配置。
                  </p>
                )}

                {testResult && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">响应结果：</h5>
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm max-h-64">
                      {testResult}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CategorySection({ category, baseUrl }: { category: APICategory; baseUrl: string }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const Icon = iconMap[category.icon] || Activity

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl hover:from-cyan-100 hover:to-blue-100 transition-colors"
      >
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Icon className="w-5 h-5 text-cyan-600" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-gray-900">{category.name}</h3>
          <p className="text-sm text-gray-500">{category.description}</p>
        </div>
        <span className="text-sm text-gray-400">{category.endpoints.length} 个接口</span>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-3 pl-4">
          {category.endpoints.map((endpoint) => (
            <EndpointCard 
              key={`${endpoint.method}-${endpoint.path}`} 
              endpoint={endpoint} 
              baseUrl={baseUrl}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function APIDocsPage() {
  const [categories, setCategories] = useState<APICategory[]>([])
  const [baseUrl, setBaseUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchDocs()
  }, [])

  const fetchDocs = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/docs/api-list`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCategories(data.categories)
          setBaseUrl(data.base_url)
          setIsLoading(false)
          return
        }
      }
    } catch (error) {
      // 后端 API 不可用，使用静态数据
    }
    
    // 使用静态数据作为后备
    setCategories(STATIC_API_DOCS)
    setBaseUrl(BACKEND_URL)
    setIsLoading(false)
  }

  // 过滤分类和端点
  const filteredCategories = categories
    .filter(cat => !selectedCategory || cat.id === selectedCategory)
    .map(cat => ({
      ...cat,
      endpoints: cat.endpoints.filter(
        ep => !searchQuery || 
          ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ep.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(cat => cat.endpoints.length > 0)

  const totalEndpoints = categories.reduce((acc, cat) => acc + cat.endpoints.length, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-600">加载 API 文档...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium mb-4">
            <Server className="w-4 h-4" />
            API 文档中心
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Athena API Reference</h1>
          <p className="text-gray-600 mb-4">
            探索和测试 Athena 平台的所有 API 接口
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-emerald-500" />
              基础 URL: <code className="bg-gray-100 px-2 py-0.5 rounded">{baseUrl}</code>
            </span>
            <span>|</span>
            <span>{categories.length} 个分类</span>
            <span>|</span>
            <span>{totalEndpoints} 个接口</span>
          </div>
        </div>

        {/* 搜索和过滤 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索 API 接口..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">所有分类</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* 快速链接 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => {
            const Icon = iconMap[cat.icon] || Activity
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  selectedCategory === cat.id ? 'bg-cyan-700' : 'bg-gray-100'
                }`}>
                  {cat.endpoints.length}
                </span>
              </button>
            )
          })}
        </div>

        {/* API 列表 */}
        <div className="space-y-8">
          {filteredCategories.map(category => (
            <CategorySection key={category.id} category={category} baseUrl={baseUrl} />
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            没有找到匹配的 API 接口
          </div>
        )}

        {/* 帮助信息 */}
        <div className="mt-12 p-6 bg-white rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            更多资源
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <a
              href="https://github.com/Ryder-MHumble/Athena"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h4 className="font-medium text-gray-900">GitHub 仓库</h4>
              <p className="text-sm text-gray-500">查看源代码和贡献</p>
            </a>
            <a
              href="/settings"
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h4 className="font-medium text-gray-900">配置 API Key</h4>
              <p className="text-sm text-gray-500">设置 SiliconFlow 和 MinerU API Key</p>
            </a>
            <a
              href={`${baseUrl}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h4 className="font-medium text-gray-900">Swagger 文档</h4>
              <p className="text-sm text-gray-500">FastAPI 自动生成的文档</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

