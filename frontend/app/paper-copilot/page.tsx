'use client'

/**
 * 论文伴侣模块
 * 模块化版本：使用独立组件提高代码可维护性
 * 新增：会话持久化功能，避免切换页面后分析结果丢失
 */

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { api, PaperAnalysisResponse } from '@/lib/api'
import { FileText, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { pdfjs } from 'react-pdf'
import { useAppStore, PaperSession } from '@/stores/useAppStore'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// 模块化组件导入
import {
  UploadArea,
  TabSelector,
  PDFViewer,
  AnalysisResultsTab,
  SpeechTab,
  ChatTab,
} from '@/components/paper-copilot'

// 配置 PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function PaperCopilotPage() {
  // Store hooks
  // Store hooks - 获取会话列表而不仅仅是当前会话
  const { currentPaperSession, savePaperSession, clearCurrentSession, paperSessions, loadPaperSession } = useAppStore()

  // State management
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [paperText, setPaperText] = useState<string>('')
  const [analysis, setAnalysis] = useState<PaperAnalysisResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'analysis' | 'speech' | 'chat'>('analysis')
  const [splitPosition, setSplitPosition] = useState(45)
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [streamingChatContent, setStreamingChatContent] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfContainerRef = useRef<HTMLDivElement>(null)
  const [isDraggingSplit, setIsDraggingSplit] = useState(false)
  const [speechStreaming, setSpeechStreaming] = useState('')
  const speechStreamRef = useRef<NodeJS.Timeout | null>(null)
  const [showSessionRestore, setShowSessionRestore] = useState(false)

  // 会话已初始化标记，防止多次恢复
  const [sessionInitialized, setSessionInitialized] = useState(false)

  // 组件挂载时恢复之前的会话 - 改进逻辑，从 paperSessions 中获取最后一个
  useEffect(() => {
    if (sessionInitialized) return

    setSessionInitialized(true)
    
    // 优先使用 currentPaperSession，否则使用 paperSessions 中的最后一个
    const sessionToRestore = currentPaperSession || (paperSessions && paperSessions.length > 0 ? paperSessions[0] : null)
    
    if (!sessionToRestore) return

    // 恢复会话数据
    setAnalysis(sessionToRestore.analysis)
    setPaperText(sessionToRestore.paperText)
    setChatHistory(sessionToRestore.chatHistory)
    setSplitPosition(sessionToRestore.splitPosition)
    setActiveTab(sessionToRestore.activeTab)
    
    // 如果有 PDF URL 或文件，尝试恢复 PDF 显示
    if (sessionToRestore.analysis?.paper_url) {
      setPdfUrl(sessionToRestore.analysis.paper_url)
    }

    // 如果有讲解内容，开始流式效果
    if (sessionToRestore.analysis?.speech) {
      startSpeechStreaming(sessionToRestore.analysis.speech)
    }

    setShowSessionRestore(true)
    toast.success(`已恢复上次的分析: ${sessionToRestore.fileName}`)
    
    // 3 秒后隐藏恢复提示
    setTimeout(() => setShowSessionRestore(false), 3000)
  }, [sessionInitialized])

  // 当分析、聊天记录、标签签位置改变时，自动保存会话
  useEffect(() => {
    if (!analysis || !sessionInitialized) return

    const session: PaperSession = {
      id: currentPaperSession?.id || `session-${Date.now()}`,
      fileName: currentPaperSession?.fileName || file?.name || 'Untitled Paper',
      uploadedAt: currentPaperSession?.uploadedAt || Date.now(),
      analysis,
      paperText,
      chatHistory,
      splitPosition,
      activeTab,
    }

    savePaperSession(session)
  }, [analysis, chatHistory, splitPosition, activeTab, paperText, sessionInitialized])

  // 规范化 Markdown：去掉行首多余缩进，避免标题等语法失效
  const normalizeMarkdown = (text: string) => {
    if (!text) return ''
    return text
      .split('\n')
      .map((line) => line.replace(/^\s+/, ''))
      .join('\n')
  }

  // 判断是否已上传/分析
  const hasPaper = pdfUrl !== null || analysis !== null

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setUrl('')
      const objectUrl = URL.createObjectURL(selectedFile)
      setPdfUrl(objectUrl)
      toast.success('PDF 文件已选择，正在自动分析...')

      // 自动触发分析
      setIsLoading(true)
      setAnalysis(null)
      setChatHistory([])

      try {
        const result = await api.analyzePaper({
          file: selectedFile,
        })
        setAnalysis(result)
        setPaperText(result.paper_text || '')
        startSpeechStreaming(result.speech || '')
        toast.success('论文分析完成')
      } catch (error: any) {
        toast.error(error.message || '分析失败，请检查文件或网络连接')
        console.error('Paper analysis error:', error)
      } finally {
        setIsLoading(false)
      }
    } else {
      toast.error('请选择 PDF 文件')
    }
  }

  // 处理文件上传和分析
  const handleAnalyze = async () => {
    if (!file && !url.trim()) {
      toast.error('请上传 PDF 文件或输入 Arxiv URL')
      return
    }

    setIsLoading(true)
    setAnalysis(null)
    setChatHistory([])

    try {
      const result = await api.analyzePaper({
        file: file || undefined,
        url: url.trim() || undefined,
      })
      setAnalysis(result)
      setPaperText(result.paper_text || '')
      startSpeechStreaming(result.speech || '')

      // 如果是URL，需要下载PDF并设置PDF URL
      if (url.trim() && !file) {
        try {
          let pdfUrlToDownload = url.trim()
          if (pdfUrlToDownload.includes('arxiv.org/abs/')) {
            pdfUrlToDownload = pdfUrlToDownload.replace('/abs/', '/pdf/') + '.pdf'
          } else if (!pdfUrlToDownload.includes('arxiv.org/pdf/')) {
            if (pdfUrlToDownload.includes('arxiv.org')) {
              const paperId = pdfUrlToDownload.split('/').pop()?.replace('.pdf', '') || ''
              pdfUrlToDownload = `https://arxiv.org/pdf/${paperId}.pdf`
            }
          }

          const response = await fetch(pdfUrlToDownload, {
            mode: 'cors',
            headers: {
              Accept: 'application/pdf',
            },
          })
          if (response.ok) {
            const blob = await response.blob()
            const objectUrl = URL.createObjectURL(blob)
            setPdfUrl(objectUrl)
            toast.success('PDF已下载并加载')
          } else {
            console.warn('Failed to download PDF:', response.status)
            toast.warning('无法下载PDF，但分析结果已生成')
            setPdfUrl(null)
          }
        } catch (error) {
          console.error('Failed to download PDF:', error)
          toast.warning('无法下载PDF，但分析结果已生成')
          setPdfUrl(null)
        }
      }

      toast.success('论文分析完成')
    } catch (error: any) {
      toast.error(error.message || '分析失败，请检查文件或网络连接')
      console.error('Paper analysis error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 启动讲解建议 tab 的前端流式打字效果
  const startSpeechStreaming = (fullText: string) => {
    if (speechStreamRef.current) {
      clearInterval(speechStreamRef.current)
      speechStreamRef.current = null
    }
    if (!fullText) {
      setSpeechStreaming('')
      return
    }
    setSpeechStreaming('')
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setSpeechStreaming(fullText.slice(0, currentIndex + 40))
        currentIndex += 40
      } else {
        if (speechStreamRef.current) {
          clearInterval(speechStreamRef.current)
        }
        speechStreamRef.current = null
      }
    }, 40)
    speechStreamRef.current = interval
  }

  // 处理重新上传
  const handleReset = () => {
    setFile(null)
    setUrl('')
    setPdfUrl(null)
    setAnalysis(null)
    setPaperText('')
    setChatHistory([])
    setSpeechStreaming('')
    clearCurrentSession()
    setSessionInitialized(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 处理AI解读提问 - 支持流式输出
  const handleChatSend = async () => {
    if (!chatQuestion.trim() || !paperText || isChatLoading) return

    const userMessage = { role: 'user' as const, content: chatQuestion.trim() }
    setChatHistory((prev) => [...prev, userMessage])
    const question = chatQuestion.trim()
    setChatQuestion('')
    setIsChatLoading(true)
    setStreamingChatContent('')

    try {
      let fullContent = ''
      let isUsingStream = false

      try {
        for await (const event of api.chatStream({
          session_id: `paper-${Date.now()}`,
          message: question,
          history: [],
          thinking_mode: false,
        })) {
          if (event.type === 'content') {
            fullContent += event.delta
            setStreamingChatContent(fullContent)
            isUsingStream = true
          }
        }
      } catch {
        if (!isUsingStream && fullContent === '') {
          const response = await api.chatWithPaper(question, paperText)
          fullContent = response.answer
        }
      }

      const assistantMessage = { role: 'assistant' as const, content: fullContent }
      setChatHistory((prev) => [...prev, assistantMessage])
      setStreamingChatContent('')
    } catch (error: any) {
      toast.error(error.message || 'AI 解读失败')
      console.error('Chat error:', error)
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleSplitMouseMove = (e: MouseEvent) => {
    if (!isDraggingSplit) return
    const container = document.getElementById('split-container')
    if (!container) return

    const rect = container.getBoundingClientRect()
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100
    setSplitPosition(Math.max(45, Math.min(80, newPosition)))
  }

  const handleSplitMouseUp = () => setIsDraggingSplit(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleSplitMouseMove)
      window.addEventListener('mouseup', handleSplitMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleSplitMouseMove)
        window.removeEventListener('mouseup', handleSplitMouseUp)
      }
    }
    return () => {
      if (speechStreamRef.current) {
        clearInterval(speechStreamRef.current)
        speechStreamRef.current = null
      }
    }
  }, [isDraggingSplit])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 sm:gap-6">
      {/* Header - 包含标题和重新上传按钮 */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4">
        {/* <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">论文伴侣</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">AI 智能分析论文 • 快速理解核心观点</p>
        </div> */}

        {/* 重新上传按钮 - 只在有论文时显示 */}
        {hasPaper && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-sm border-gray-300 hover:border-gray-400 hover:bg-gray-50 flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重新上传
          </Button>
        )}
      </div>

      {/* 上传区域 - 只在没有论文时显示 */}
      {!hasPaper && (
        <UploadArea
          file={file}
          url={url}
          isLoading={isLoading}
          onFileSelect={handleFileSelect}
          onFileRemove={() => {
            setFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
          onUrlChange={setUrl}
          onAnalyze={handleAnalyze}
          fileInputRef={fileInputRef}
        />
      )}

      {/* 分屏显示区域 - 只在有论文时显示 */}
      {hasPaper && (
        <div
          id="split-container"
          className="flex-1 flex gap-3 overflow-hidden min-h-0"
        >
          {/* 左侧：PDF 查看器 */}
          <div
            ref={pdfContainerRef}
            className="bg-white rounded-xl border border-gray-200 overflow-auto shadow-md custom-scrollbar relative flex-shrink-0"
            style={{ width: `${splitPosition}%` }}
          >
            <PDFViewer pdfUrl={pdfUrl} width={`${splitPosition}%`} />
          </div>

          {/* 拖拽分隔条 */}
          <div
            className="w-1.5 bg-gradient-to-b from-gray-200 via-cyan-300 to-gray-200 cursor-col-resize hover:from-cyan-400 hover:via-cyan-500 hover:to-cyan-400 transition-all flex-shrink-0 rounded-full"
            onMouseDown={() => setIsDraggingSplit(true)}
          />

          {/* 右侧：AI 分析结果 */}
          <div
            className="bg-gradient-to-b from-white to-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-md flex flex-col"
            style={{ width: `${100 - splitPosition}%` }}
          >
            {/* 标签页选择器 */}
            <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

            {/* 内容区域 */}
            <div className="flex-1 overflow-auto custom-scrollbar p-6 sm:p-8">
              {isLoading && !analysis && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="inline-block p-3 rounded-full bg-cyan-100">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                    </div>
                    <p className="text-gray-600 font-medium">AI 正在分析论文...</p>
                    <p className="text-xs text-gray-500">这可能需要几秒钟</p>
                  </div>
                </div>
              )}

              {!isLoading && !analysis && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="inline-block p-4 rounded-full bg-gray-100">
                      <FileText className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">分析结果将显示在这里</p>
                    <p className="text-xs text-gray-500">上传或选择论文开始分析</p>
                  </div>
                </div>
              )}

              {analysis && activeTab === 'analysis' && <AnalysisResultsTab analysis={analysis} />}

              {analysis && activeTab === 'speech' && (
                <SpeechTab speech={normalizeMarkdown(speechStreaming || analysis.speech)} />
              )}

              {analysis && activeTab === 'chat' && (
                <ChatTab
                  chatHistory={chatHistory}
                  chatQuestion={chatQuestion}
                  onQuestionChange={setChatQuestion}
                  onSend={handleChatSend}
                  isLoading={isChatLoading}
                  streamingContent={streamingChatContent}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
