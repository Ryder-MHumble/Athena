'use client'

/**
 * 知识沉淀模块 - 完全重构版
 * 列表页：显示所有文档卡片
 * 详情页：左侧文档预览，右侧AI总结和AI解读
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { api, SearchResponse } from '@/lib/api'
import { useAppStore } from '@/stores/useAppStore'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'
import { Upload, Search, FileText, Loader2, Brain, ArrowLeft, Bot, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface DocumentItem {
  id: string
  name: string
  uploadedAt: string
  content?: string
  pdfUrl?: string
}

export default function TeamBrainPage() {
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [summary, setSummary] = useState<string>('')
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary' | 'chat'>('summary')
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { teamKey } = useAppStore()

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        setFile(selectedFile)
        const objectUrl = URL.createObjectURL(selectedFile)
        setPdfUrl(objectUrl)
        toast.success('文件已选择')
      } else {
        toast.error('目前仅支持 PDF 文件')
      }
    }
  }

  // 处理文档上传
  const handleUpload = async () => {
    if (!file) {
      toast.error('请选择要上传的文件')
      return
    }

    if (!teamKey) {
      toast.error('请先在设置页面配置团队访问密钥')
      return
    }

    setIsUploading(true)

    try {
      const result = await api.uploadDocument(file, teamKey)
      if (result.success) {
        toast.success('文档上传成功！')
        
        // 添加到文档列表
        const newDoc: DocumentItem = {
          id: `doc-${Date.now()}`,
          name: file.name,
          uploadedAt: new Date().toISOString(),
          pdfUrl: pdfUrl || undefined,
        }
        setDocuments(prev => [newDoc, ...prev])
        
        setFile(null)
        setPdfUrl(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toast.error(result.message || '上传失败')
      }
    } catch (error: any) {
      toast.error(error.message || '上传失败，请检查网络连接')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  // 处理文档点击 - 进入详情页
  const handleDocClick = async (doc: DocumentItem) => {
    setSelectedDoc(doc)
    setView('detail')
    setSummary('')
    setChatHistory([])
    
    // 如果有PDF URL，加载PDF
    if (doc.pdfUrl) {
      setPdfUrl(doc.pdfUrl)
    }
    
    // 生成AI总结
    if (doc.content) {
      setIsGeneratingSummary(true)
      try {
        // 使用搜索API获取文档内容并生成总结
        const result = await api.searchKnowledge({
          query: '请总结这篇文档的主要内容',
          top_k: 10,
        })
        setSummary(result.answer)
      } catch (error: any) {
        toast.error('生成总结失败')
        console.error('Summary error:', error)
      } finally {
        setIsGeneratingSummary(false)
      }
    }
  }

  // 处理返回列表
  const handleBackToList = () => {
    setView('list')
    setSelectedDoc(null)
    setSummary('')
    setChatHistory([])
    setPdfUrl(null)
  }

  // 处理AI解读提问
  const handleChatSend = async () => {
    if (!chatQuestion.trim() || !selectedDoc || isChatLoading) return

    const userMessage = { role: 'user' as const, content: chatQuestion.trim() }
    setChatHistory(prev => [...prev, userMessage])
    setChatQuestion('')
    setIsChatLoading(true)

    try {
      const response = await api.searchKnowledge({
        query: chatQuestion.trim(),
        top_k: 5,
      })
      const assistantMessage = { role: 'assistant' as const, content: response.answer }
      setChatHistory(prev => [...prev, assistantMessage])
    } catch (error: any) {
      toast.error(error.message || 'AI 解读失败')
      console.error('Chat error:', error)
    } finally {
      setIsChatLoading(false)
    }
  }

  // PDF加载成功
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }

  // 列表视图
  if (view === 'list') {
    return (
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">知识沉淀</h1>
          </div>
        </div>

        {/* 上传区域 */}
        <Card className="glass border-0 shadow-lg p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
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
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {file ? file.name : '上传文档'}
              </Button>
            </div>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  上传中
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  上传
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* 文档列表 */}
        {documents.length === 0 ? (
          <Card className="glass border-0 shadow-xl p-12 text-center bg-white/90 backdrop-blur-sm">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400 opacity-50" />
            <p className="text-gray-600 mb-2">还没有上传任何文档</p>
            <p className="text-sm text-gray-500">点击上方按钮上传你的第一个文档</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="glass border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer p-6 bg-white/90 backdrop-blur-sm"
                onClick={() => handleDocClick(doc)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex-shrink-0">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate mb-1">{doc.name}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.uploadedAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 详情视图
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4 flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">{selectedDoc?.name}</h1>
        </div>
      </div>
      
      {/* 分屏显示 */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* 左侧：文档预览 */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-auto shadow-sm custom-scrollbar">
          {pdfUrl ? (
            <div className="p-6">
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
              </div>
              <div className="flex justify-center">
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="shadow-xl"
                    width={Math.min(800, window.innerWidth * 0.4)}
                  />
                </Document>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">文档预览不可用</p>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：AI总结和AI解读 */}
        <div className="w-[40%] bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col">
          {/* 标签页 */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <Button
              variant="ghost"
              onClick={() => setActiveTab('summary')}
              className={`flex-1 rounded-none ${
                activeTab === 'summary'
                  ? 'bg-white border-b-2 border-purple-600 text-purple-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI 总结
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
            {activeTab === 'summary' && (
              <div>
                {isGeneratingSummary ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-3" />
                    <span className="text-gray-600">AI 正在生成总结...</span>
                  </div>
                ) : summary ? (
                  <div className="prose prose-sm max-w-none 
                    prose-p:text-gray-800 prose-p:leading-relaxed 
                    prose-headings:text-gray-900 prose-headings:font-semibold
                    prose-strong:text-gray-900
                    prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                    prose-ul:list-disc prose-ol:list-decimal">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex, rehypeHighlight]}
                    >
                      {summary}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>点击文档查看AI总结</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar min-h-0">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>开始提问，AI 会根据文档内容为你解答</p>
                    </div>
                  )}
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
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
                          <Send className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-lg px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                      </div>
                    </div>
                  )}
                </div>

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
    </div>
  )
}
