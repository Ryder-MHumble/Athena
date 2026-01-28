/**
 * API 客户端配置
 * 统一管理后端 API 请求
 */

import ky from 'ky'
import { useAppStore } from '@/stores/useAppStore'

// 后端 API 基础 URL（根据部署环境调整）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * 获取 API Key（优先使用 store，其次环境变量）
 */
const getApiKey = (): string => {
  const storeKey = useAppStore.getState().apiKey
  if (storeKey) return storeKey
  
  // 回退到环境变量
  const envKey = process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY
  return envKey || ''
}

/**
 * 获取选中的模型
 */
const getSelectedModel = (): string => {
  return useAppStore.getState().selectedModel || 'Qwen/Qwen2.5-7B-Instruct'
}

/**
 * 创建 API 客户端实例
 * 自动添加 API Key 到请求头
 */
export const apiClient = ky.create({
  prefixUrl: `${API_BASE_URL}/api`,
  timeout: 300000, // 5 分钟超时（用于论文分析等长时间任务）
  hooks: {
    beforeRequest: [
      (request) => {
        // 获取 API Key 并添加到请求头
        const apiKey = getApiKey()
        if (apiKey) {
          request.headers.set('X-API-Key', apiKey)
        } else {
          console.warn('API Key not found. Please set NEXT_PUBLIC_SILICONFLOW_API_KEY in environment variables or configure it in settings.')
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error:', {
            url: response.url,
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          })
        }
        return response
      },
    ],
  },
})

/**
 * 聊天请求接口（术语通模块）
 */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  session_id: string  // 后端使用下划线命名
  message: string
  history?: ChatMessage[]
  thinking_mode?: boolean  // 思考模式（可选，前端控制）
  model?: string  // 指定使用的模型 ID（可选）
}

export interface ChatResponse {
  message: string
  session_id: string
}

/**
 * 论文分析请求接口
 */
export interface PaperAnalysisRequest {
  file?: File
  url?: string
}

export interface PaperAnalysisResponse {
  summary: {
    coreProblem: string
    previousDilemma: string
    coreIntuition: string
    keySteps: string[]
    innovations: {
      comparison: string
      essence: string
    }
    boundaries: {
      assumptions: string
      unsolved: string
    }
    oneSentence: string
  }
  speech: string // Markdown 格式的演讲稿
  qa: Array<{
    question: string
    answer: string
  }>
  paper_text: string // 论文文本内容（用于AI解读）
}

/**
 * 知识库搜索请求接口
 */
export interface SearchRequest {
  query: string
  top_k?: number  // 后端使用下划线命名
}

export interface SearchResponse {
  results: Array<{
    content: string
    metadata: {
      source?: string
      page_number?: number
    }
    similarity: number
  }>
  answer: string
}

// API 方法
export const api = {
  // 术语通 - 发送消息（非流式，保持兼容）
  chat: async (data: ChatRequest): Promise<ChatResponse> => {
    // 自动添加选中的模型
    const requestData = {
      ...data,
      model: data.model || getSelectedModel(),
    }
    return apiClient.post('chat/', { json: requestData }).json()
  },

  // 术语通 - 流式发送消息
  chatStream: async function* (data: ChatRequest) {
    try {
      // 自动添加选中的模型
      const requestData = {
        ...data,
        model: data.model || getSelectedModel(),
      }
      
      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': getApiKey(),
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`API error: ${response.status} - ${error}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (!reader) throw new Error('No response body')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines[lines.length - 1]

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim()
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            yield data
          }
        }
      }
    } catch (error: any) {
      throw new Error(`Stream error: ${error.message}`)
    }
  },

  // 论文伴侣 - 分析论文
  analyzePaper: async (data: PaperAnalysisRequest): Promise<PaperAnalysisResponse> => {
    const formData = new FormData()
    if (data.file) {
      formData.append('file', data.file)
    }
    if (data.url) {
      formData.append('url', data.url)
    }
    return apiClient.post('paper/analyze', { body: formData }).json()
  },

  // 论文伴侣 - AI 解读
  chatWithPaper: async (question: string, paperText: string): Promise<{ answer: string }> => {
    return apiClient.post('paper/chat', { 
      json: { question, paper_text: paperText } 
    }).json()
  },

  // 知识沉淀 - 上传文档
  uploadDocument: async (file: File, teamKey: string): Promise<{ success: boolean; message: string; document_id?: string; file_url?: string }> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('team_key', teamKey)
      
      // 使用原生 fetch API 来处理 FormData，避免 ky 可能的序列化问题
      const apiKey = getApiKey()
      const response = await fetch(`${API_BASE_URL}/api/knowledge/upload`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          // 不设置 Content-Type，让浏览器自动设置为 multipart/form-data
        },
        body: formData,
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload error:', { status: response.status, body: errorText })
        throw new Error(`Upload failed: ${response.status} - ${errorText}`)
      }
      
      return response.json()
    } catch (error: any) {
      console.error('Upload document error:', error)
      throw error
    }
  },

  // 知识沉淀 - 获取文档列表
  getDocuments: async (teamKey?: string): Promise<{ success: boolean; documents: any[]; count: number }> => {
    const params = teamKey ? `?team_key=${teamKey}` : ''
    return apiClient.get(`knowledge/documents${params}`).json()
  },

  // 知识沉淀 - 获取文档内容（用于生成报告）
  getDocumentContent: async (documentId: string): Promise<{ success: boolean; document_id: string; title: string; content: string; chunk_count: number }> => {
    return apiClient.get(`knowledge/document/${documentId}`).json()
  },

  // 知识沉淀 - 搜索
  searchKnowledge: async (data: SearchRequest): Promise<SearchResponse> => {
    // 确保 top_k 有默认值
    const requestData = {
      query: data.query,
      top_k: data.top_k || 5,
    }
    return apiClient.post('knowledge/search', { json: requestData }).json()
  },

  // 知识沉淀 - 与文档进行问答
  chatWithDocument: async (data: SearchRequest): Promise<SearchResponse> => {
    const requestData = {
      query: data.query,
      top_k: data.top_k || 5,
    }
    return apiClient.post('knowledge/chat', { json: requestData }).json()
  },

  // 知识沉淀 - 生成结构化报告
  generateReport: async (documentId: string, content: string): Promise<{ success: boolean; report: string }> => {
    return apiClient.post('knowledge/generate-report', { 
      json: { document_id: documentId, content } 
    }).json()
  },
}

