'use client'

/**
 * 知识沉淀模块 - 简化版
 * 列表页：文档卡片展示
 * 详情页：分析报告 + 原文预览 + 下载
 */

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useAppStore } from '@/stores/useAppStore'
import { 
  Upload, Search, FileText, Loader2, Brain, ArrowLeft, 
  Download, Sparkles, Clock, Eye, RefreshCw, Trash2, X,
  CheckCircle, AlertCircle, Timer
} from 'lucide-react'
import { toast } from 'sonner'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface DocumentItem {
  id: string
  title: string
  file_url: string
  analysis_report?: string
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
  created_at: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// 状态图标和颜色
const statusConfig = {
  pending: { icon: Timer, color: 'text-gray-400', bg: 'bg-gray-100', label: '等待分析', animate: false },
  analyzing: { icon: Loader2, color: 'text-cyan-600', bg: 'bg-cyan-100', label: '分析中', animate: true },
  completed: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: '已完成', animate: false },
  failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100', label: '分析失败', animate: false },
}

export default function TeamBrainPage() {
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [activeTab, setActiveTab] = useState<'report' | 'preview'>('report')
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { teamKey, apiKey } = useAppStore()

  // 页面加载时获取文档列表
  useEffect(() => {
    loadDocuments()
  }, [])

  // 自动刷新分析中的文档
  useEffect(() => {
    const hasAnalyzing = documents.some(d => d.status === 'analyzing' || d.status === 'pending')
    if (hasAnalyzing) {
      const interval = setInterval(loadDocuments, 5000)
      return () => clearInterval(interval)
    }
  }, [documents])

  // 加载文档列表
  const loadDocuments = async () => {
    setIsLoadingDocs(true)
    try {
      const res = await fetch(`${API_BASE}/api/knowledge/documents?team_key=${teamKey}`, {
        headers: { 'X-API-Key': apiKey }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setDocuments(data.documents)
        }
      }
    } catch (error: any) {
      console.error('Error loading documents:', error)
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
      const formData = new FormData()
      formData.append('file', file)
      formData.append('team_key', teamKey)

      const res = await fetch(`${API_BASE}/api/knowledge/upload`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
        body: formData
      })

      const result = await res.json()
      
      if (result.success) {
        toast.success('文档上传成功，正在后台分析...')
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
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
  const handleDocClick = (doc: DocumentItem) => {
    setSelectedDoc(doc)
    setView('detail')
    setPageNumber(1)
    setActiveTab('report')
  }

  // 处理返回列表
  const handleBackToList = () => {
    setView('list')
    setSelectedDoc(null)
  }

  // 下载文档
  const handleDownloadDocument = () => {
    if (selectedDoc?.file_url) {
      window.open(selectedDoc.file_url, '_blank')
      toast.success('文档下载开始')
    }
  }

  // 删除文档
  const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定要删除这个文档吗？')) return

    try {
      const res = await fetch(`${API_BASE}/api/knowledge/document/${docId}?team_key=${teamKey}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey }
      })
      
      if (res.ok) {
        toast.success('文档已删除')
        await loadDocuments()
      } else {
        toast.error('删除失败')
      }
    } catch {
      toast.error('删除失败')
    }
  }

  // PDF加载成功
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  // 列表视图
  if (view === 'list') {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          {/* 页面头部区域 */}
          <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 px-4 sm:px-6 lg:px-8 pt-8 pb-6">
            <div className="max-w-5xl mx-auto">
              {/* 标题和上传按钮 */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    团队知识库
                  </h1>
                  <p className="text-gray-600 text-sm">
                    上传文档，AI 自动分析并生成可视化报告
                  </p>
                </div>
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  上传文档
                </Button>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="hidden"
                />
              </div>

              {/* 文件选择提示 */}
              {file && (
                <div className="mb-6 bg-white rounded-xl border border-violet-200 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">准备上传并分析</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading}
                        size="sm"
                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            上传中
                          </>
                        ) : (
                          '确认上传'
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setFile(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 搜索框 */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="搜索团队知识库..."
                  className="w-full h-12 pl-12 pr-12 text-base border-0 bg-white rounded-xl shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-violet-500/40 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-5xl mx-auto">
              {/* 文档统计 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">所有文档</h2>
                  <span className="text-sm text-gray-500">({documents.length})</span>
                </div>
                <Button
                  onClick={loadDocuments}
                  variant="ghost"
                  size="sm"
                  disabled={isLoadingDocs}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingDocs ? 'animate-spin' : ''}`} />
                  刷新
                </Button>
              </div>

              {/* 文档列表 */}
              {isLoadingDocs && documents.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">加载文档中...</p>
                  </div>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <FileText className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium text-gray-600">暂无文档</p>
                  <p className="text-sm text-gray-400 mt-1">点击上方按钮上传第一个文档</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => {
                    const status = statusConfig[doc.status] || statusConfig.pending
                    const StatusIcon = status.icon
                    
                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleDocClick(doc)}
                        className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-violet-300 hover:shadow-lg transition-all cursor-pointer relative"
                      >
                        {/* 删除按钮 */}
                        <button
                          onClick={(e) => handleDeleteDocument(doc.id, e)}
                          className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        {/* 卡片头部 */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-violet-600" />
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate pr-6">
                              {doc.title}
                            </h3>
                            <span className="text-xs text-gray-400">
                              {new Date(doc.created_at).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </div>

                        {/* 状态标签 */}
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          <StatusIcon className={`h-3.5 w-3.5 ${status.animate ? 'animate-spin' : ''}`} />
                          {status.label}
                        </div>

                        {/* 分析预览（如果有） */}
                        {doc.status === 'completed' && doc.analysis_report && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                              <Brain className="h-3.5 w-3.5" />
                              <span>AI 分析报告已生成</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
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
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-slate-200/60 bg-white">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{selectedDoc?.title}</h1>
            <p className="text-xs text-gray-500">
              创建于 {selectedDoc && new Date(selectedDoc.created_at).toLocaleDateString('zh-CN')}
            </p>
          </div>
          <Button
            onClick={handleDownloadDocument}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            下载原文
          </Button>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6">
        <div className="max-w-7xl mx-auto h-full">
          {/* 标签页切换 */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'report'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Brain className="h-4 w-4" />
              分析报告
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'preview'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Eye className="h-4 w-4" />
              原文预览
            </button>
          </div>

          {/* 内容区 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-[calc(100%-60px)]">
            {activeTab === 'report' ? (
              <div className="h-full overflow-y-auto p-6 sm:p-8">
                {selectedDoc?.status === 'analyzing' || selectedDoc?.status === 'pending' ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full opacity-20 animate-ping"></div>
                        <div className="relative w-20 h-20 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Brain className="h-10 w-10 text-white animate-pulse" />
                        </div>
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-2">AI 正在分析文档</p>
                      <p className="text-sm text-gray-500">提取关键信息，生成可视化报告...</p>
                      <p className="text-xs text-gray-400 mt-4">页面会自动刷新</p>
                    </div>
                  </div>
                ) : selectedDoc?.status === 'failed' ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">分析失败</p>
                      <p className="text-sm text-gray-500">请尝试重新上传文档</p>
                    </div>
                  </div>
                ) : selectedDoc?.analysis_report ? (
                  <div className="max-w-4xl mx-auto">
                    {/* AI 生成标识 */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200/50 mb-6">
                      <Sparkles className="h-4 w-4 text-violet-600 animate-pulse" />
                      <span className="text-sm text-violet-900 font-medium">AI 生成的智能分析报告</span>
                    </div>

                    {/* 报告内容 - 渲染 HTML */}
                    <div 
                      className="prose prose-violet max-w-none
                        [&_.report-container]:space-y-6
                        [&_.report-section]:bg-white [&_.report-section]:rounded-xl [&_.report-section]:border [&_.report-section]:border-gray-200 [&_.report-section]:p-5 [&_.report-section]:shadow-sm
                        [&_.report-section_h2]:text-lg [&_.report-section_h2]:font-semibold [&_.report-section_h2]:text-gray-900 [&_.report-section_h2]:mb-3 [&_.report-section_h2]:pb-2 [&_.report-section_h2]:border-b [&_.report-section_h2]:border-gray-100
                        [&_.report-section_p]:text-gray-700 [&_.report-section_p]:leading-relaxed
                        [&_.report-section_ul]:space-y-2 [&_.report-section_ul]:mt-2
                        [&_.report-section_li]:text-gray-700 [&_.report-section_li]:flex [&_.report-section_li]:items-start [&_.report-section_li]:gap-2
                        [&_.report-section_li::before]:content-['•'] [&_.report-section_li::before]:text-violet-500 [&_.report-section_li::before]:font-bold
                      "
                      dangerouslySetInnerHTML={{ __html: selectedDoc.analysis_report }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">暂无分析报告</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {selectedDoc?.file_url ? (
                  <>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <span className="text-sm font-medium text-gray-700">
                        第 {pageNumber} 页 / 共 {numPages || '?'} 页
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                          disabled={pageNumber <= 1}
                        >
                          上一页
                        </Button>
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
                    <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-100">
                      <Document
                        file={selectedDoc.file_url}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                          </div>
                        }
                        error={
                          <div className="text-center text-gray-500">
                            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
                            <p>无法加载 PDF 预览</p>
                            <Button onClick={handleDownloadDocument} className="mt-4" variant="outline">
                              下载原文查看
                            </Button>
                          </div>
                        }
                      >
                        <Page
                          pageNumber={pageNumber}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          className="shadow-lg rounded-lg overflow-hidden"
                          width={Math.min(800, typeof window !== 'undefined' ? window.innerWidth * 0.6 : 800)}
                        />
                      </Document>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-gray-500">文档预览不可用</p>
                      <Button onClick={handleDownloadDocument} className="mt-4" variant="outline">
                        下载原文查看
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
