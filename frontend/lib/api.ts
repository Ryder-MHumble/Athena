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
  // 术语通 - 发送消息
  chat: async (data: ChatRequest): Promise<ChatResponse> => {
    return apiClient.post('chat/', { json: data }).json()
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
  uploadDocument: async (file: File, teamKey: string): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('team_key', teamKey)
    return apiClient.post('knowledge/upload', { body: formData }).json()
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
}

