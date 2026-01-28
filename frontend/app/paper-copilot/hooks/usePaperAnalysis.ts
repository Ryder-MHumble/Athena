/**
 * 论文分析功能 Hook
 */

import { useState, useRef, useEffect } from 'react'
import { api, PaperAnalysisResponse } from '@/lib/api'
import { toast } from 'sonner'

export function usePaperAnalysis() {
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

  // 规范化 Markdown
  const normalizeMarkdown = (text: string) => {
    if (!text) return ''
    return text
      .split('\n')
      .map((line) => line.replace(/^\s+/, ''))
      .join('\n')
  }

  // 判断是否已上传/分析
  const hasPaper = pdfUrl !== null || analysis !== null

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

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setUrl('')
      const objectUrl = URL.createObjectURL(selectedFile)
      setPdfUrl(objectUrl)
      toast.success('PDF 文件已选择，正在自动分析...')

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

  // 处理重新上传
  const handleReset = () => {
    setFile(null)
    setUrl('')
    setPdfUrl(null)
    setAnalysis(null)
    setPaperText('')
    setChatHistory([])
    setSpeechStreaming('')
    setStreamingChatContent('')
    setActiveTab('analysis')
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    if (speechStreamRef.current) {
      clearInterval(speechStreamRef.current)
      speechStreamRef.current = null
    }
    
    toast.success('已清除，可以重新上传论文')
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

  // 分屏拖动处理
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

  return {
    // State
    file,
    url,
    pdfUrl,
    analysis,
    isLoading,
    activeTab,
    splitPosition,
    chatQuestion,
    chatHistory,
    isChatLoading,
    streamingChatContent,
    speechStreaming,
    hasPaper,
    isDraggingSplit,
    // Refs
    fileInputRef,
    pdfContainerRef,
    // Setters
    setFile,
    setUrl,
    setActiveTab,
    setChatQuestion,
    setIsDraggingSplit,
    // Handlers
    handleFileSelect,
    handleAnalyze,
    handleReset,
    handleChatSend,
    normalizeMarkdown,
  }
}

