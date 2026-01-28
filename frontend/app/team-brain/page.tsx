'use client'

/**
 * 知识沉淀模块 - 完全重构版
 * 列表页：显示所有文档卡片
 * 详情页：左侧文档预览，右侧AI总结和AI解读
 */

import { useState, useRef, useEffect } from 'react'
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
import { Upload, Search, FileText, Loader2, Brain, ArrowLeft, Bot, Send, X, Download, Sparkles, Clock, Eye, ExternalLink, TrendingUp, Hash, Grid3X3 } from 'lucide-react'
import { toast } from 'sonner'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface DocumentItem {
  id: string
  title: string
  file_url: string
  created_at: string
  summary?: string
}

// 静态演示数据
const DEMO_CATEGORIES = [
  { id: 'strategy', label: '战略规划', count: 12 },
  { id: 'reports', label: '季度报告', count: 8 },
  { id: 'analysis', label: '竞品分析', count: 15 },
  { id: 'research', label: '市场调研', count: 6 },
]

const DEMO_RECENT_DOCS = [
  {
    id: 'demo-1',
    title: 'Nvidia_Q3_Strategy.pdf',
    description: 'Q3季度收入综合分析报告...',
    timeAgo: '2小时前',
    tags: ['#硬件', '#AI'],
    icon: 'pdf',
    color: 'red',
  },
  {
    id: 'demo-2',
    title: 'Market_Analysis_2024.doc',
    description: '全球半导体市场趋势及预测...',
    timeAgo: '1天前',
    tags: ['#市场', '#2024'],
    icon: 'doc',
    color: 'cyan',
  },
  {
    id: 'demo-3',
    title: 'Competitor_Landscape.xlsx',
    description: '前5大竞争对手对比矩阵...',
    timeAgo: '3天前',
    tags: ['#内部', '#战略'],
    icon: 'excel',
    color: 'emerald',
  },
]

const DEMO_INSIGHTS = [
  {
    id: 'insight-1',
    source: 'Q3_Nvidia_Strategy.pdf',
    page: 12,
    title: '数据中心收入增长',
    content: '报告显示数据中心领域的收入增长超出预期15%，主要受H100 GPU需求驱动。这与我们内部对AI基础设施的预测一致...',
    relevance: 'high',
  },
]

export default function TeamBrainPage() {
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [report, setReport] = useState<string>('')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [activeTab, setActiveTab] = useState<'report' | 'source' | 'chat'>('report')
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { teamKey, apiKey } = useAppStore()

  // 页面加载时获取文档列表
  useEffect(() => {
    loadDocuments()
  }, [])

  // 加载文档列表
  const loadDocuments = async () => {
    setIsLoadingDocs(true)
    try {
      const result = await api.getDocuments(teamKey)
      if (result.success) {
        setDocuments(result.documents)
      }
    } catch (error: any) {
      console.error('Error loading documents:', error)
      toast.error('加载文档列表失败')
    } finally {
      setIsLoadingDocs(false)
    }
  }

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        setFile(selectedFile)
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
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        // 重新加载文档列表
        await loadDocuments()
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
    setReport('')
    setChatHistory([])
    setPageNumber(1)
    setPdfUrl(doc.file_url)
    
    // 自动生成报告
    await generateReport(doc)
  }

  // 生成报告
  const generateReport = async (doc: DocumentItem) => {
    setIsGeneratingReport(true)
    try {
      // 1. 先获取文档的完整内容
      console.log(`Fetching content for document: ${doc.id}`)
      const contentResponse = await api.getDocumentContent(doc.id)
      
      if (!contentResponse.success || !contentResponse.content) {
        console.error('Failed to fetch document content')
        toast.error('获取文档内容失败')
        setIsGeneratingReport(false)
        return
      }
      
      console.log(`Document content fetched: ${contentResponse.chunk_count} chunks`)
      
      // 2. 使用文档内容生成报告
      const reportResponse = await api.generateReport(doc.id, contentResponse.content)
      
      if (reportResponse.success) {
        console.log('Report generated successfully')
        setReport(reportResponse.report)
      } else {
        console.error('Failed to generate report')
        toast.error('生成报告失败')
      }
    } catch (error: any) {
      console.error('Error generating report:', error)
      toast.error(error.message || '生成报告失败')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // 处理返回列表
  const handleBackToList = () => {
    setView('list')
    setSelectedDoc(null)
    setReport('')
    setChatHistory([])
    setPdfUrl(null)
  }

  // 处理AI问答
  const handleChatSend = async () => {
    if (!chatQuestion.trim() || !selectedDoc || isChatLoading) return

    const userMessage = { role: 'user' as const, content: chatQuestion.trim() }
    setChatHistory(prev => [...prev, userMessage])
    setChatQuestion('')
    setIsChatLoading(true)

    try {
      const response = await api.chatWithDocument({
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
  }

  // 下载文档
  const handleDownloadDocument = () => {
    if (selectedDoc?.file_url) {
      const link = document.createElement('a')
      link.href = selectedDoc.file_url
      link.download = selectedDoc.title + '.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('文档下载开始')
    }
  }

  // 列表视图
  if (view === 'list') {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          {/* 页面头部区域 */}
          <div className="bg-gradient-to-b from-slate-50 to-white px-4 sm:px-6 lg:px-8 pt-8 pb-6">
            <div className="max-w-5xl mx-auto text-center">
              {/* 标题 */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                团队知识库
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                即时访问团队的集体智慧
              </p>

              {/* 搜索框 */}
              <div className="relative max-w-2xl mx-auto mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="搜索团队知识库..."
                  className="w-full h-12 pl-12 pr-12 text-base border-0 bg-white rounded-xl shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-cyan-500/40 transition-all placeholder:text-gray-400"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  /
                </div>
              </div>

              {/* 分类标签 */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {DEMO_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-slate-200 text-gray-600 hover:border-cyan-300 hover:text-cyan-600 hover:bg-cyan-50/50 transition-all shadow-sm"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-5xl mx-auto space-y-8">
              {/* 最近文档区域 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900">最近文档</h2>
                  </div>
                  <button className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                    查看全部
                  </button>
                </div>

                {/* 文档卡片网格 - 演示数据 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {DEMO_RECENT_DOCS.map((doc) => (
                    <div
                      key={doc.id}
                      className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer"
                    >
                      {/* 卡片头部 */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          doc.color === 'red' ? 'bg-red-100' :
                          doc.color === 'cyan' ? 'bg-cyan-100' : 'bg-emerald-100'
                        }`}>
                          {doc.icon === 'pdf' ? (
                            <FileText className={`h-5 w-5 ${doc.color === 'red' ? 'text-red-600' : 'text-gray-600'}`} />
                          ) : doc.icon === 'doc' ? (
                            <FileText className="h-5 w-5 text-cyan-600" />
                          ) : (
                            <Grid3X3 className="h-5 w-5 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] text-gray-400">{doc.timeAgo}</span>
                        </div>
                      </div>

                      {/* 标题和描述 */}
                      <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                        {doc.description}
                      </p>

                      {/* 标签 */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400">标签:</span>
                        {doc.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 实际文档列表 */}
                {isLoadingDocs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-cyan-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">加载文档中...</p>
                    </div>
                  </div>
                ) : documents.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleDocClick(doc)}
                        className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-gray-400">
                              {new Date(doc.created_at).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                          {doc.summary || '点击查看详情'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">标签:</span>
                          <span className="text-[10px] text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">
                            #PDF
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 团队洞察区域 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-cyan-500" />
                  <h2 className="text-lg font-semibold text-gray-900">团队洞察</h2>
                </div>

                {/* 洞察卡片 */}
                {DEMO_INSIGHTS.map((insight) => (
                  <div
                    key={insight.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-cyan-600" />
                        <span className="text-sm font-medium text-cyan-600">{insight.source}</span>
                        <span className="text-xs text-gray-400">• 第 {insight.page} 页</span>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        insight.relevance === 'high' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {insight.relevance === 'high' ? '高度相关' : '相关'}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 mb-2">{insight.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      ...{insight.content}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <button className="flex items-center gap-1 hover:text-cyan-600 transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                        预览
                      </button>
                      <button className="flex items-center gap-1 hover:text-cyan-600 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                        复制摘要
                      </button>
                      <button className="flex items-center gap-1 hover:text-cyan-600 transition-colors">
                        <Send className="h-3.5 w-3.5" />
                        分享
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 上传区块 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900">添加文档</h2>
                  </div>
                </div>
                
                {/* 上传卡片 */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 hover:border-cyan-400 p-8 transition-all hover:bg-cyan-50/30 active:scale-[0.99] cursor-pointer group"
                >
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-100 group-hover:bg-cyan-200 transition-colors">
                        <Upload className="h-6 w-6 text-cyan-600" />
                      </div>
                    </div>
                    <div>
                      {file ? (
                        <>
                          <p className="font-semibold text-gray-900">✓ {file.name}</p>
                          <p className="text-sm text-gray-500">准备上传</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-gray-900">选择 PDF 文件上传</p>
                          <p className="text-sm text-gray-500">单个文件最大 50MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 上传按钮 */}
                {file && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-medium"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          上传中...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          确认上传
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      variant="outline"
                    >
                      取消
                    </Button>
                  </div>
                )}
              </div>

              {/* 空状态 */}
              {!isLoadingDocs && documents.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 mb-4">
                    <Brain className="h-8 w-8 text-cyan-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">开始构建你的知识库</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                    上传文档到知识库，AI 将帮助你提取关键信息和洞察
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    上传第一个文档
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 详情视图
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
            <FileText className="h-4 w-4 text-purple-600" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 truncate">{selectedDoc?.title}</h1>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="flex-1 overflow-hidden px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto h-full">
          <div className="flex gap-6 h-full overflow-hidden">
            {/* 左侧：文档预览 */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full">
                {pdfUrl ? (
                  <>
                    <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        第 {pageNumber} 页 / 共 {numPages} 页
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                          disabled={pageNumber <= 1}
                          className="text-xs h-8"
                        >
                          上一页
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                          disabled={pageNumber >= numPages}
                          className="text-xs h-8"
                        >
                          下一页
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadDocument}
                          className="text-xs h-8"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          下载
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 p-4">
                      <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                          </div>
                        }
                      >
                        <Page
                          pageNumber={pageNumber}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          className="shadow-lg rounded-lg overflow-hidden"
                          width={Math.min(600, window.innerWidth * 0.35)}
                        />
                      </Document>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">文档预览不可用</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：报告、原文、问答 */}
            <div className="w-96 flex flex-col min-w-0">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full">
                {/* 标签页 */}
                <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('report')}
                    className={`flex-1 rounded-none text-xs sm:text-sm font-medium ${
                      activeTab === 'report'
                        ? 'bg-white border-b-2 border-purple-600 text-purple-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Brain className="h-4 w-4 mr-1.5" />
                    报告
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('source')}
                    className={`flex-1 rounded-none text-xs sm:text-sm font-medium ${
                      activeTab === 'source'
                        ? 'bg-white border-b-2 border-purple-600 text-purple-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FileText className="h-4 w-4 mr-1.5" />
                    原文
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 rounded-none text-xs sm:text-sm font-medium ${
                      activeTab === 'chat'
                        ? 'bg-white border-b-2 border-pink-600 text-pink-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Bot className="h-4 w-4 mr-1.5" />
                    问答
                  </Button>
                </div>

                {/* 内容区 */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {activeTab === 'report' ? (
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                      {isGeneratingReport ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-purple-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-600">AI 正在生成报告...</p>
                          </div>
                        </div>
                      ) : report ? (
                        <div className="prose prose-sm max-w-none
                          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-sm
                          prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2
                          prose-strong:text-gray-900
                          prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                          prose-ul:list-disc prose-ol:list-decimal">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex, rehypeHighlight]}
                          >
                            {report}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <Brain className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">生成的报告将在此显示</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : activeTab === 'source' ? (
                    <div className="flex-1 overflow-auto p-6">
                      <div className="text-center text-gray-500">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm mb-4">左侧为文档原文预览</p>
                        <Button
                          onClick={handleDownloadDocument}
                          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          下载原文
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {chatHistory.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <Bot className="h-10 w-10 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">开始提问，AI 会为你解答</p>
                            </div>
                          </div>
                        ) : (
                          chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              {msg.role === 'assistant' && (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center">
                                  <Bot className="h-3 w-3 text-white" />
                                </div>
                              )}
                              <div
                                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                  msg.role === 'user'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                {msg.role === 'assistant' ? (
                                  <div className="prose prose-sm max-w-none prose-p:m-0 prose-p:text-gray-900 prose-p:text-xs">
                                    <ReactMarkdown>
                                      {msg.content}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  <p className="text-xs leading-relaxed">{msg.content}</p>
                                )}
                              </div>
                              {msg.role === 'user' && (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center">
                                  <Send className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                          ))
                        )}
                        {isChatLoading && (
                          <div className="flex gap-3 justify-start">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <Loader2 className="h-3 w-3 animate-spin text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 输入框 */}
                      <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0 space-y-2">
                        <div className="flex gap-2">
                          <textarea
                            value={chatQuestion}
                            onChange={(e) => setChatQuestion(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleChatSend()
                              }
                            }}
                            placeholder="输入问题..."
                            className="flex-1 resize-none rounded-lg border border-gray-300 p-2 text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                            rows={2}
                            disabled={isChatLoading}
                          />
                          <Button
                            onClick={handleChatSend}
                            disabled={!chatQuestion.trim() || isChatLoading}
                            size="sm"
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                          >
                            {isChatLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
