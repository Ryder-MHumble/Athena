/**
 * PDF 分析任务管理 Hook
 * 
 * 功能：
 * 1. 统一管理 PDF 分析任务的状态
 * 2. 处理 SSE 流的创建、监听和清理
 * 3. 提供取消任务的功能
 * 4. 处理重试和错误
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

// API 基础路径
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// 图表类型定义
export interface ChartData {
  id: string
  type: 'bar' | 'line' | 'pie' | 'table' | 'flowchart' | 'scatter' | 'heatmap' | 'diagram' | 'photo' | 'other'
  imageUrl: string
  pageNumber: number
  title: string
  summary: string
  keyPoints: string[]
  category?: string
  filename?: string
}

// 分析状态
export type AnalysisStatus = 'idle' | 'uploading' | 'parsing' | 'translating' | 'extracting' | 'analyzing' | 'complete' | 'error'

// 分析结果
export interface AnalysisResult {
  originalText: string
  translatedText: string
  charts: ChartData[]
  metadata: Record<string, any>
  paperAnalysis?: {
    summary: any
    paperText: string
  }
}

// 分析选项
export interface AnalysisOptions {
  file?: File | null
  url?: string
  translate?: boolean
  extractCharts?: boolean
  enablePaperAnalysis?: boolean
}

// Hook 返回类型
export interface UsePDFAnalysisReturn {
  // 状态
  status: AnalysisStatus
  progress: number
  statusMessage: string
  errorMessage: string
  result: AnalysisResult | null
  taskId: string | null
  
  // 操作
  startAnalysis: (options: AnalysisOptions) => Promise<void>
  cancelAnalysis: () => void
  resetAnalysis: () => void
  
  // 计算属性
  isAnalyzing: boolean
  hasResult: boolean
}

// SSE 事件数据类型
interface SSEEventData {
  status: AnalysisStatus
  progress: number
  message: string
  data?: {
    success: boolean
    originalText: string
    translatedText: string
    charts: ChartData[]
    metadata: Record<string, any>
    paperAnalysis?: {
      summary: any
      paperText: string
    }
  }
}

export function usePDFAnalysis(apiKey: string, mineruApiKey: string): UsePDFAnalysisReturn {
  // 状态
  const [status, setStatus] = useState<AnalysisStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)
  const isCleaningUp = useRef(false)
  
  // 清理函数
  const cleanup = useCallback(async () => {
    if (isCleaningUp.current) return
    isCleaningUp.current = true
    
    try {
      // 取消 fetch 请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      
      // 释放 reader
      if (readerRef.current) {
        try {
          await readerRef.current.cancel()
          readerRef.current.releaseLock()
        } catch {
          // 忽略错误
        }
        readerRef.current = null
      }
      
      // 如果有任务 ID，通知后端取消
      if (taskId) {
        try {
          await fetch(`${API_BASE}/api/pdf-analyzer/cancel/${taskId}`, {
            method: 'POST',
            headers: { 'X-API-Key': apiKey }
          })
        } catch {
          // 忽略取消请求的错误
        }
      }
    } finally {
      isCleaningUp.current = false
    }
  }, [taskId, apiKey])
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])
  
  // 开始分析
  const startAnalysis = useCallback(async (options: AnalysisOptions) => {
    const { file, url, translate = false, extractCharts = true, enablePaperAnalysis = false } = options
    
    // 验证输入
    if (!file && !url) {
      toast.error('请先选择文件或输入 URL')
      return
    }
    
    if (!apiKey) {
      toast.error('请先在设置页面配置 SiliconFlow API Key')
      return
    }
    
    if (!mineruApiKey) {
      toast.error('请先在设置页面配置 MinerU API Key')
      return
    }
    
    if (url && !url.trim()) {
      toast.error('请输入有效的 URL')
      return
    }
    
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('URL 必须以 http:// 或 https:// 开头')
      return
    }
    
    // 清理之前的请求
    await cleanup()
    
    // 重置状态
    setStatus('uploading')
    setProgress(0)
    setErrorMessage('')
    setStatusMessage(url ? '正在准备从 URL 解析...' : '正在准备上传文件...')
    setResult(null)
    setTaskId(null)
    
    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()
    
    try {
      // 准备 FormData
      const formData = new FormData()
      if (file) {
        formData.append('file', file)
      } else if (url) {
        formData.append('url', url.trim())
      }
      formData.append('translate', translate.toString())
      formData.append('extract_charts', extractCharts.toString())
      formData.append('enable_paper_analysis', enablePaperAnalysis.toString())
      
      // 发送请求
      const response = await fetch(`${API_BASE}/api/pdf-analyzer/analyze/stream`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'X-MinerU-API-Key': mineruApiKey,
        },
        body: formData,
        signal: abortControllerRef.current.signal,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error ${response.status}`)
      }
      
      // 获取任务 ID
      const responseTaskId = response.headers.get('X-Task-Id')
      if (responseTaskId) {
        setTaskId(responseTaskId)
      }
      
      // 处理 SSE 流
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }
      
      readerRef.current = reader
      const decoder = new TextDecoder()
      let buffer = ''
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            break
          }
          
          // 解码并添加到缓冲区
          buffer += decoder.decode(value, { stream: true })
          
          // 处理完整的 SSE 事件
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // 保留最后一个不完整的行
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const rawData = line.slice(6).trim()
                if (!rawData) continue
                
                const eventData: SSEEventData = JSON.parse(rawData)
                
                // 更新状态
                setStatus(eventData.status)
                setProgress(eventData.progress)
                setStatusMessage(eventData.message)
                
                // 处理完成事件
                if (eventData.status === 'complete' && eventData.data) {
                  const analysisResult: AnalysisResult = {
                    originalText: eventData.data.originalText || '',
                    translatedText: eventData.data.translatedText || '',
                    charts: eventData.data.charts || [],
                    metadata: eventData.data.metadata || {},
                    paperAnalysis: eventData.data.paperAnalysis
                  }
                  
                  setResult(analysisResult)
                  
                  if (analysisResult.originalText.length > 0) {
                    toast.success(`分析完成！提取了 ${analysisResult.originalText.length} 字符，${analysisResult.charts.length} 张图片`)
                  } else {
                    toast.warning('分析完成，但未提取到文本内容')
                  }
                }
                
                // 处理错误事件
                if (eventData.status === 'error') {
                  setErrorMessage(eventData.message)
                  toast.error(`分析失败: ${eventData.message}`)
                }
                
              } catch {
                // JSON 解析失败，跳过
              }
            }
          }
        }
      } finally {
        // 确保 reader 被释放
        try {
          reader.releaseLock()
        } catch {
          // 忽略
        }
        readerRef.current = null
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatus('idle')
        setStatusMessage('分析已取消')
        return
      }
      
      setStatus('error')
      setErrorMessage(error.message || '分析过程中发生错误')
      toast.error(`分析失败: ${error.message}`)
    }
  }, [apiKey, mineruApiKey, cleanup])
  
  // 取消分析
  const cancelAnalysis = useCallback(() => {
    cleanup()
    setStatus('idle')
    setProgress(0)
    setStatusMessage('分析已取消')
  }, [cleanup])
  
  // 重置分析
  const resetAnalysis = useCallback(() => {
    cleanup()
    setStatus('idle')
    setProgress(0)
    setStatusMessage('')
    setErrorMessage('')
    setResult(null)
    setTaskId(null)
  }, [cleanup])
  
  // 计算属性
  const isAnalyzing = ['uploading', 'parsing', 'translating', 'extracting', 'analyzing'].includes(status)
  const hasResult = status === 'complete' && result !== null && result.originalText.length > 0
  
  return {
    status,
    progress,
    statusMessage,
    errorMessage,
    result,
    taskId,
    startAnalysis,
    cancelAnalysis,
    resetAnalysis,
    isAnalyzing,
    hasResult
  }
}

/**
 * 翻译管理 Hook
 */
export interface UseTranslationReturn {
  isTranslating: boolean
  translateProgress: number
  translatedContent: string
  startTranslation: (text: string) => Promise<void>
  cancelTranslation: () => void
}

export function useTranslation(apiKey: string): UseTranslationReturn {
  const [isTranslating, setIsTranslating] = useState(false)
  const [translateProgress, setTranslateProgress] = useState(0)
  const [translatedContent, setTranslatedContent] = useState('')
  
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const cancelTranslation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsTranslating(false)
    setTranslateProgress(0)
  }, [])
  
  const startTranslation = useCallback(async (text: string) => {
    if (!apiKey || !text) return
    
    // 取消之前的翻译
    cancelTranslation()
    
    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()
    
    setIsTranslating(true)
    setTranslateProgress(0)
    setTranslatedContent('')
    
    try {
      // 分块处理
      const chunkSize = 3000
      const chunks: string[] = []
      
      const paragraphs = text.split('\n\n')
      let currentChunk = ''
      
      for (const para of paragraphs) {
        if (currentChunk.length + para.length > chunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk)
          currentChunk = para
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + para
        }
      }
      
      if (currentChunk) {
        chunks.push(currentChunk)
      }
      
      // 逐块翻译
      const translatedChunks: string[] = []
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const progress = Math.round(((i + 1) / chunks.length) * 100)
        setTranslateProgress(progress)
        
        const response = await fetch(`${API_BASE}/api/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({
            text: chunk,
            source_lang: 'en',
            target_lang: 'zh',
            max_chunk_size: chunkSize
          }),
          signal: abortControllerRef.current?.signal
        })
        
        if (!response.ok) {
          throw new Error(`翻译块 ${i + 1}/${chunks.length} 失败`)
        }
        
        const data = await response.json()
        translatedChunks.push(data.translated_text)
        
        // 更新部分翻译结果
        setTranslatedContent(translatedChunks.join('\n\n'))
      }
      
      toast.success('翻译完成！')
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error('翻译失败: ' + error.message)
      }
    } finally {
      setIsTranslating(false)
      setTranslateProgress(0)
      abortControllerRef.current = null
    }
  }, [apiKey, cancelTranslation])
  
  // 组件卸载时取消
  useEffect(() => {
    return () => {
      cancelTranslation()
    }
  }, [cancelTranslation])
  
  return {
    isTranslating,
    translateProgress,
    translatedContent,
    startTranslation,
    cancelTranslation
  }
}

