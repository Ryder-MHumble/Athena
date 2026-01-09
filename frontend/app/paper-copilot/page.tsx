'use client'

/**
 * 论文伴侣模块
 * 重构版：条件显示、PDF占比大、滑动翻页、三个tag
 */

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { api, PaperAnalysisResponse } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Upload, Loader2, FileText, MessageSquare, Mic, Bot, Send, X, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// 配置 PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function PaperCopilotPage() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [paperText, setPaperText] = useState<string>('')
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [analysis, setAnalysis] = useState<PaperAnalysisResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'analysis' | 'speech' | 'chat'>('analysis')
  const [splitPosition, setSplitPosition] = useState(40) // PDF 现在占 40%，右侧占 60%
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [streamingChatContent, setStreamingChatContent] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfContainerRef = useRef<HTMLDivElement>(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [isDraggingSplit, setIsDraggingSplit] = useState(false)
  const [speechStreaming, setSpeechStreaming] = useState('')
  const speechStreamRef = useRef<NodeJS.Timeout | null>(null)

  // 规范化 Markdown：去掉行首多余缩进，避免标题等语法失效
  const normalizeMarkdown = (text: string) => {
    if (!text) return ''
    return text
      .split('\n')
      .map(line => line.replace(/^\s+/, '')) // 去掉每行行首空格
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
      // 启动讲解建议流式渲染
      startSpeechStreaming(result.speech || '')
      
      // 如果是URL，需要下载PDF并设置PDF URL
      if (url.trim() && !file) {
        try {
          // 将 Arxiv URL 转换为 PDF URL
          let pdfUrlToDownload = url.trim()
          if (pdfUrlToDownload.includes('arxiv.org/abs/')) {
            pdfUrlToDownload = pdfUrlToDownload.replace('/abs/', '/pdf/') + '.pdf'
          } else if (!pdfUrlToDownload.includes('arxiv.org/pdf/')) {
            // 如果不是abs格式，尝试添加/pdf/前缀
            if (pdfUrlToDownload.includes('arxiv.org')) {
              const paperId = pdfUrlToDownload.split('/').pop()?.replace('.pdf', '') || ''
              pdfUrlToDownload = `https://arxiv.org/pdf/${paperId}.pdf`
            }
          }
          
          // 下载PDF并创建本地URL
          const response = await fetch(pdfUrlToDownload, {
            mode: 'cors',
            headers: {
              'Accept': 'application/pdf',
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
    setPageNumber(1)
    setNumPages(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 处理AI解读提问 - 支持流式输出
  const handleChatSend = async () => {
    if (!chatQuestion.trim() || !paperText || isChatLoading) return

    const userMessage = { role: 'user' as const, content: chatQuestion.trim() }
    setChatHistory(prev => [...prev, userMessage])
    const question = chatQuestion.trim()
    setChatQuestion('')
    setIsChatLoading(true)
    setStreamingChatContent('')

    try {
      // 尝试使用流式 API
      let fullContent = ''
      let isUsingStream = false

      // 尝试流式聊天（如果支持）
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
        // 如果流式 API 不可用，降级到普通 API
        if (!isUsingStream && fullContent === '') {
          const response = await api.chatWithPaper(question, paperText)
          fullContent = response.answer
        }
      }

      // 将完整回复添加到历史记录
      const assistantMessage = { role: 'assistant' as const, content: fullContent }
      setChatHistory(prev => [...prev, assistantMessage])
      setStreamingChatContent('')
    } catch (error: any) {
      toast.error(error.message || 'AI 解读失败')
      console.error('Chat error:', error)
    } finally {
      setIsChatLoading(false)
    }
  }

  // PDF 加载成功回调
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }

  const handleSplitMouseMove = (e: MouseEvent) => {
    if (!isDraggingSplit) return
    const container = document.getElementById('split-container')
    if (!container) return

    const rect = container.getBoundingClientRect()
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100
    setSplitPosition(Math.max(30, Math.min(85, newPosition)))
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
    // 卸载时清理讲解建议流式定时器
    return () => {
      if (speechStreamRef.current) {
        clearInterval(speechStreamRef.current)
        speechStreamRef.current = null
      }
    }
  }, [isDraggingSplit])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4 flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">论文伴侣</h1>
        </div>
        
        {/* 重新上传按钮 - 只在有论文时显示 */}
        {hasPaper && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重新上传
          </Button>
        )}
      </div>

      {/* 上传区域 - 只在没有论文时显示 */}
      {!hasPaper && (
        <Card className="glass border-0 shadow-lg p-6 mb-4 flex-shrink-0">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">上传论文开始分析</h2>
              <p className="text-sm text-gray-600">支持 PDF 文件上传或 Arxiv URL</p>
            </div>
            
            <div className="flex gap-3">
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                上传 PDF
              </Button>
              {file && (
                <span className="text-sm text-gray-600 self-center flex items-center gap-2 px-3">
                  {file.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </span>
              )}
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">或</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="输入 Arxiv URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && url.trim() && !file) {
                    e.preventDefault()
                    handleAnalyze()
                  }
                }}
                disabled={isLoading || !!file}
                className="flex-1"
              />
              <Button
                onClick={handleAnalyze}
                disabled={isLoading || (!file && !url.trim())}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    分析中
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    开始分析
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 分屏显示区域 - 只在有论文时显示 */}
      {hasPaper && (
        <div
          id="split-container"
          className="flex-1 flex gap-4 overflow-hidden min-h-0"
        >
          {/* 左侧：PDF 查看器 - 占比大 */}
          <div
            ref={pdfContainerRef}
            className="bg-white rounded-lg border border-gray-200 overflow-auto shadow-sm custom-scrollbar relative"
            style={{ width: `${splitPosition}%` }}
          >
            {pdfUrl ? (
              <div className="p-6">
                {/* 页面控制 - 固定在顶部 */}
                <div className="sticky top-0 bg-white z-10 pb-4 mb-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                      disabled={pageNumber <= 1}
                    >
                      上一页
                    </Button>
                    <span className="text-sm text-gray-600 px-3">
                      第 {pageNumber} 页 / 共 {numPages} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                      disabled={pageNumber >= numPages}
                    >
                      下一页
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Button variant="ghost" size="icon" onClick={() => setZoomScale((z) => Math.min(2, z + 0.1))}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setZoomScale((z) => Math.max(0.6, z - 0.1))}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setZoomScale(1)}>
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <span className="text-gray-500">单击页面左右侧可翻页</span>
                  </div>
                </div>
                
                {/* PDF 内容容器 - 加强滚动隔离 */}
                <div className="flex-1 overflow-y-auto flex justify-center bg-gray-100 rounded-lg relative" onWheel={(e) => {
                  // 阻止滚动传播到分割条
                  e.stopPropagation()
                }}>
                  {/* 左右点击区域翻页 */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1/6 cursor-pointer z-10"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    aria-label="上一页"
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1/6 cursor-pointer z-10"
                    onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                    aria-label="下一页"
                  />
                  <div className="flex items-center justify-center p-4">
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div className="flex items-center justify-center p-12">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                      }
                    >
                      {typeof window !== 'undefined' && (
                        <Page
                          pageNumber={pageNumber}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          className="shadow-2xl rounded-lg"
                          scale={zoomScale}
                          width={Math.max(300, Math.min(800, (window.innerWidth * splitPosition / 100 - 80)))}
                        />
                      )}
                    </Document>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">PDF 预览不可用（URL 模式）</p>
                </div>
              </div>
            )}
          </div>

          {/* 拖拽分隔条 */}
          <div
            className="w-1 bg-gray-200 cursor-col-resize hover:bg-blue-400 transition-colors flex-shrink-0"
          onMouseDown={() => setIsDraggingSplit(true)}
          />

          {/* 右侧：AI 分析结果 */}
          <div
            className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col"
            style={{ width: `${100 - splitPosition}%` }}
          >
            {/* 三个标签页 - 无论是否有内容都固定在顶部 */}
            <div className="flex border-b border-gray-200 bg-gray-50">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('analysis')}
                    className={`flex-1 rounded-none ${
                      activeTab === 'analysis'
                        ? 'bg-white border-b-2 border-blue-600 text-blue-600 font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    分析结果
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('speech')}
                    className={`flex-1 rounded-none ${
                      activeTab === 'speech'
                        ? 'bg-white border-b-2 border-purple-600 text-purple-600 font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    讲解建议
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 rounded-none ${
                      activeTab === 'chat'
                        ? 'bg-white border-b-2 border-green-600 text-green-600 font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    AI 解读
                  </Button>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-auto custom-scrollbar p-6">
              {isLoading && !analysis && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">AI 正在分析论文...</p>
                  </div>
                </div>
              )}

              {!isLoading && !analysis && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">分析结果将显示在这里</p>
                  </div>
                </div>
              )}

              {analysis && activeTab === 'analysis' && (
                    <div className="space-y-6">
                      {/* 核心问题 */}
                      <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-5">
                        <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          核心问题
                        </h3>
                        <p className="text-gray-800 leading-relaxed">{analysis.summary.coreProblem}</p>
                      </div>

                      {/* 先前困境 */}
                      <div className="border-l-4 border-yellow-500 bg-yellow-50 rounded-r-lg p-5">
                        <h3 className="text-lg font-bold text-yellow-900 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                          先前困境
                        </h3>
                        <p className="text-gray-800 leading-relaxed">{analysis.summary.previousDilemma}</p>
                      </div>

                      {/* 核心直觉 */}
                      <div className="border-l-4 border-purple-500 bg-purple-50 rounded-r-lg p-5">
                        <h3 className="text-lg font-bold text-purple-900 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                          核心直觉
                        </h3>
                        <p className="text-gray-800 leading-relaxed">{analysis.summary.coreIntuition}</p>
                      </div>

                      {/* 关键步骤 */}
                      <div className="border-l-4 border-green-500 bg-green-50 rounded-r-lg p-5">
                        <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          关键步骤
                        </h3>
                        <ol className="list-decimal pl-6 space-y-2">
                          {analysis.summary.keySteps.map((step, idx) => (
                            <li key={idx} className="text-gray-800 leading-relaxed">
                              <span className="font-semibold text-gray-900">第 {idx + 1} 步：</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* 创新点 */}
                      <div className="border-l-4 border-pink-500 bg-pink-50 rounded-r-lg p-5">
                        <h3 className="text-lg font-bold text-pink-900 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-pink-600 rounded-full"></span>
                          创新点
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm uppercase text-gray-600 mb-1">对比分析</p>
                            <p className="text-gray-800 bg-white p-3 rounded border border-pink-200">
                              {analysis.summary.innovations.comparison}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm uppercase text-gray-600 mb-1">本质创新</p>
                            <p className="text-gray-800 bg-white p-3 rounded border border-pink-200">
                              {analysis.summary.innovations.essence}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 边界与局限 */}
                      <div className="border-l-4 border-orange-500 bg-orange-50 rounded-r-lg p-5">
                        <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                          边界与局限
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm uppercase text-gray-600 mb-1">关键假设</p>
                            <p className="text-gray-800 bg-white p-3 rounded border border-orange-200">
                              {analysis.summary.boundaries.assumptions}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm uppercase text-gray-600 mb-1">未解决问题</p>
                            <p className="text-gray-800 bg-white p-3 rounded border border-orange-200">
                              {analysis.summary.boundaries.unsolved}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 一句话总结 */}
                      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-6 text-white">
                        <p className="text-sm font-semibold uppercase text-gray-300 mb-2">一句话总结</p>
                        <p className="text-lg leading-relaxed italic font-light">
                          "{analysis.summary.oneSentence}"
                        </p>
                      </div>
                    </div>
              )}

              {analysis && activeTab === 'speech' && (
                <div className="prose prose-sm max-w-none
                  prose-p:text-gray-800 prose-p:leading-relaxed prose-p:m-0
                  prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                  prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-xs prose-code:font-mono
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-3 prose-pre:rounded-lg
                  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                  prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
                  prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2
                  prose-li:text-gray-800 prose-li:text-sm prose-li:my-1
                  prose-blockquote:border-l-4 prose-blockquote:border-purple-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeHighlight]}
                  >
                    {normalizeMarkdown(speechStreaming || analysis.speech)}
                  </ReactMarkdown>
                </div>
              )}

              {analysis && activeTab === 'chat' && (
                    <div className="flex flex-col h-full">
                      {/* 对话历史 */}
                      <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar min-h-0">
                        {chatHistory.length === 0 && !isChatLoading && (
                          <div className="text-center text-gray-500 py-8">
                            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>开始提问，AI 会根据论文内容为你解答</p>
                          </div>
                        )}
                        {chatHistory.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {msg.role === 'assistant' && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                                msg.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {msg.role === 'assistant' ? (
                                <div className="prose prose-sm max-w-none prose-p:text-gray-800 prose-p:leading-relaxed">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex, rehypeHighlight]}
                                  >
                                    {msg.content}
                                  </ReactMarkdown>
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                              )}
                            </div>
                            {msg.role === 'user' && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                <MessageSquare className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="bg-gray-100 rounded-lg px-4 py-3 flex-1">
                              {streamingChatContent ? (
                                <div className="prose prose-sm max-w-none
                                  prose-p:text-gray-800 prose-p:leading-relaxed prose-p:m-0
                                  prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-2
                                  prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
                                  prose-strong:text-gray-900
                                  prose-code:text-purple-600 prose-code:bg-white prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-xs prose-code:font-mono
                                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-3 prose-pre:rounded-lg
                                  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                                  prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
                                  prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2
                                  prose-li:text-gray-800 prose-li:text-sm prose-li:my-1
                                  prose-blockquote:border-l-4 prose-blockquote:border-purple-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex, rehypeHighlight]}
                                  >
                                    {streamingChatContent}
                                  </ReactMarkdown>
                                </div>
                              ) : (
                                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 输入框 */}
                      <div className="flex gap-2 border-t border-gray-200 pt-4 flex-shrink-0">
                        <Textarea
                          value={chatQuestion}
                          onChange={(e) => setChatQuestion(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleChatSend()
                            }
                          }}
                          placeholder="输入你的问题..."
                          className="min-h-[60px] max-h-[120px] resize-none text-sm"
                          disabled={isChatLoading}
                        />
                        <Button
                          onClick={handleChatSend}
                          disabled={!chatQuestion.trim() || isChatLoading}
                          size="lg"
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        >
                          {isChatLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
