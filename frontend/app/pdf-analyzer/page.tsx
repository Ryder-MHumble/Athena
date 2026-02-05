'use client'

/**
 * PDF 智析 - PDF 翻译与图表分析工具
 * 左右分屏布局：左侧原文/翻译预览，右侧图表与结构化信息
 * 
 * 重构说明：
 * - 使用 usePDFAnalysis Hook 统一管理分析任务
 * - 使用 useTranslation Hook 管理翻译任务
 * - 解决了任务状态混乱和资源泄漏问题
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Loader2, 
  Upload, 
  Languages, 
  Image as ImageIcon,
  BarChart3,
  Table2,
  PieChart,
  X,
  Download,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  FileSearch,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/useAppStore'
import { 
  AnalysisResultsTab
} from '@/components/paper-copilot'
import { usePDFAnalysis, useTranslation, ChartData } from '@/hooks/usePDFAnalysis'

// API 基础路径
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function PDFAnalyzerPage() {
  // 从全局 store 获取 API Key
  const { apiKey, mineruApiKey } = useAppStore()
  
  // 使用 PDF 分析 Hook
  const {
    status,
    progress,
    statusMessage,
    errorMessage,
    result,
    startAnalysis,
    cancelAnalysis,
    resetAnalysis,
    isAnalyzing,
    hasResult
  } = usePDFAnalysis(apiKey, mineruApiKey)
  
  // 使用翻译 Hook
  const {
    isTranslating,
    translateProgress,
    translatedContent,
    startTranslation,
    cancelTranslation
  } = useTranslation(apiKey)
  
  // 文件状态
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [urlMode, setUrlMode] = useState(false)
  
  // UI状态
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null)
  const [splitPosition, setSplitPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [displayLanguage, setDisplayLanguage] = useState<'zh' | 'en'>('zh')
  
  // 右侧Tab状态
  const [activeRightTab, setActiveRightTab] = useState<'charts' | 'analysis'>('charts')
  
  // 提取选项
  const [enableChartExtraction, setEnableChartExtraction] = useState(true)
  const [enablePaperAnalysis, setEnablePaperAnalysis] = useState(true)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 从 result 中提取数据
  const originalContent = result?.originalText || ''
  // 按照图片在markdown中的出现顺序排序
  const charts = (() => {
    const rawCharts = result?.charts || []
    if (!originalContent || rawCharts.length === 0) return rawCharts

    // 为每个图片找到它在markdown中的位置
    const chartsWithPosition = rawCharts.map(chart => {
      const imageName = chart.filename
      if (!imageName) return { ...chart, position: -1 }

      // 查找图片引用的位置（可能有多种格式）
      const patterns = [
        `images/${imageName}`,
        `![](images/${imageName})`,
        imageName
      ]

      let position = -1
      for (const pattern of patterns) {
        const index = originalContent.indexOf(pattern)
        if (index !== -1) {
          position = index
          break
        }
      }

      return { ...chart, position }
    })

    // 按位置排序（未找到的图片放到最后）
    return chartsWithPosition.sort((a, b) => {
      if (a.position === -1) return 1
      if (b.position === -1) return -1
      return a.position - b.position
    })
  })()

  const metadata = result?.metadata || {}
  const paperAnalysis = result?.paperAnalysis?.summary || null
  const paperText = result?.paperAnalysis?.paperText || ''
  
  // 实际显示的翻译内容（优先使用 Hook 的翻译结果，其次使用分析结果中的翻译）
  const displayTranslatedContent = translatedContent || result?.translatedText || ''

  // 文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('请选择 PDF 文件')
        return
      }
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error('文件大小不能超过 100MB')
        return
      }
      setFile(selectedFile)
      setUrl('')
    }
  }

  // 拖拽上传
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        toast.error('请选择 PDF 文件')
        return
      }
      setFile(droppedFile)
      setUrl('')
    }
  }, [])

  // 开始分析（使用 Hook）
  const handleStartAnalysis = useCallback(async () => {
    // 取消正在进行的翻译
    cancelTranslation()

    // 清空选中的图表（避免显示旧图表）
    setSelectedChart(null)

    // 开始分析
    await startAnalysis({
      file,
      url,
      translate: false,
      extractCharts: enableChartExtraction,
      enablePaperAnalysis: enablePaperAnalysis
    })
  }, [file, url, enableChartExtraction, startAnalysis, cancelTranslation])

  // 自动翻译（分析完成后自动触发）
  useEffect(() => {
    if (hasResult && originalContent && !displayTranslatedContent) {
      // 分析完成后自动开始翻译
      startTranslation(originalContent)
    }
  }, [hasResult, originalContent, displayTranslatedContent, startTranslation])
  
  // 点击图片跳转到对应位置并展开卡片
  const handleImageClick = (chart: ChartData) => {
    // 查找图片在 markdown 中的位置
    const imageName = chart.filename
    if (!imageName || !originalContent) return
    
    // 查找图片引用的位置
    const imageRef = `images/${imageName}`
    const index = originalContent.indexOf(imageRef)
    
    if (index !== -1) {
      // 计算在第几行
      const beforeText = originalContent.substring(0, index)
      const lines = beforeText.split('\n')
      const lineNumber = lines.length
      
      
      // 滚动到对应位置（通过查找元素）
      const markdownContainer = document.querySelector('.markdown-content')
      if (markdownContainer) {
        const allImages = markdownContainer.querySelectorAll('img')
        allImages.forEach((img: any) => {
          if (img.src.includes(chart.id)) {
            img.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // 高亮显示
            img.style.transition = 'all 0.3s ease'
            img.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.5)'
            img.style.transform = 'scale(1.02)'
            setTimeout(() => {
              img.style.boxShadow = 'none'
              img.style.transform = 'scale(1)'
            }, 2000)
          }
        })
      }
    }
    
    // 展开/折叠选中的卡片
    setSelectedChart(prevSelected => 
      prevSelected?.id === chart.id ? null : chart
    )
  }

  // 取消分析
  const handleCancel = useCallback(() => {
    cancelAnalysis()
    cancelTranslation()
  }, [cancelAnalysis, cancelTranslation])

  // 重置
  const handleReset = useCallback(() => {
    resetAnalysis()
    cancelTranslation()
    setFile(null)
    setUrl('')
    setSelectedChart(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [resetAnalysis, cancelTranslation])

  // 分割条拖拽
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100
    setSplitPosition(Math.min(Math.max(newPosition, 25), 75))
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 添加/移除鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])


  // 获取状态文本 - 优先使用后端返回的消息
  const getStatusText = () => {
    // 优先显示后端返回的详细消息
    if (statusMessage && statusMessage.length > 0) {
      return statusMessage
    }
    // 根据进度百分比提供更细粒度的默认文本
    if (progress > 0 && progress < 100) {
      if (progress < 20) {
        return '正在准备上传...'
      } else if (progress < 35) {
        return '正在上传文件到云端...'
      } else if (progress < 50) {
        return 'MinerU 正在解析 PDF 结构...'
      } else if (progress < 70) {
        return 'MinerU 正在识别文档内容...'
      } else if (progress < 85) {
        return '正在下载解析结果...'
      } else if (progress < 95) {
        return '正在处理图片和文本...'
      } else {
        return '即将完成...'
      }
    }
    // 根据状态提供默认文本
    switch (status) {
      case 'uploading': return '正在上传文件...'
      case 'parsing': return 'MinerU 正在解析 PDF...'
      case 'translating': return '正在翻译文档内容...'
      case 'extracting': return '正在提取图表...'
      case 'analyzing': return '正在分析内容...'
      case 'complete': return '分析完成'
      case 'error': return '分析失败'
      default: return ''
    }
  }

  // 获取图表类型图标
  const getChartIcon = (type: ChartData['type']) => {
    switch (type) {
      case 'bar': return <BarChart3 className="w-4 h-4" />
      case 'line': return <BarChart3 className="w-4 h-4 rotate-90" />
      case 'pie': return <PieChart className="w-4 h-4" />
      case 'table': return <Table2 className="w-4 h-4" />
      default: return <ImageIcon className="w-4 h-4" />
    }
  }

  // 获取图表类型名称
  const getChartTypeName = (type: ChartData['type']) => {
    const typeNames: Record<string, string> = {
      bar: '柱状图',
      line: '折线图',
      pie: '饼图',
      table: '表格',
      flowchart: '流程图',
      scatter: '散点图',
      heatmap: '热力图',
      diagram: '示意图',
      photo: '照片',
      other: '其他'
    }
    return typeNames[type] || '其他'
  }

  // 下载图表
  const handleDownloadChart = async (chart: ChartData) => {
    try {
      const response = await fetch(`${API_BASE}${chart.imageUrl}`, {
        headers: apiKey ? { 'X-API-Key': apiKey } : {}
      })
      if (!response.ok) throw new Error('下载失败')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${chart.title || 'chart'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('图表已下载')
    } catch (error) {
      toast.error('下载失败')
    }
  }

  // 导出分析结果
  const handleExportResults = () => {
    const exportData = {
      metadata,
      originalText: originalContent,
      translatedText: displayTranslatedContent,
      charts: charts.map(c => ({
        ...c,
        imageUrl: undefined // 移除 URL，只保留分析数据
      }))
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pdf-analysis-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('分析结果已导出')
  }

  // hasResult 和 isAnalyzing 已经从 usePDFAnalysis Hook 获取

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden p-4">
      {/* API Key 提示 */}
      {!apiKey && status === 'idle' && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>请先在<a href="/settings" className="underline font-medium">设置页面</a>配置 API Key 以使用 PDF 智析功能</span>
        </div>
      )}

      {/* 上传区域 - 只在没有分析结果时显示 */}
      {!hasResult && !isAnalyzing && status !== 'error' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl space-y-6 animate-fade-in">
            {/* 标题 */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/25">
                <FileSearch className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold gradient-text-primary">PDF 智析</h1>
              <p className="text-gray-500 text-sm">
                智能翻译 PDF 全文，提取并分析图表数据
              </p>
            </div>

            {/* 上传方式切换 */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setUrlMode(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !urlMode 
                    ? 'bg-cyan-100 text-cyan-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Upload className="w-4 h-4 inline-block mr-2" />
                本地上传
              </button>
              <button
                onClick={() => setUrlMode(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  urlMode 
                    ? 'bg-cyan-100 text-cyan-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <LinkIcon className="w-4 h-4 inline-block mr-2" />
                URL 链接
              </button>
            </div>

            {/* 上传区域 */}
            {!urlMode ? (
              <div
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
                  ${file 
                    ? 'border-cyan-400 bg-cyan-50/50' 
                    : 'border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/30'
                  }`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-3">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-cyan-100">
                      <FileText className="w-7 h-7 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4 inline-block mr-1" />
                      移除文件
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gray-100">
                      <Upload className="w-7 h-7 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">
                        拖拽 PDF 文件到此处，或点击选择
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        支持 PDF 格式，最大 100MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value)
                      setFile(null)
                    }}
                    placeholder="https://example.com/document.pdf"
                    className="w-full px-4 py-4 pr-12 rounded-xl border border-gray-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
                  />
                  <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    URL 将直接由 MinerU 解析，无需下载
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    支持 http:// 和 https:// 协议
                </p>
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    请确保 URL 可公开访问
                  </p>
                </div>
              </div>
            )}

            {/* 分析选项 */}
            <div className="flex items-center justify-center gap-6 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableChartExtraction}
                  onChange={(e) => setEnableChartExtraction(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-600">提取图表</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePaperAnalysis}
                  onChange={(e) => setEnablePaperAnalysis(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-600">AI 深度分析</span>
              </label>

              <div className="text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  自动翻译 | 图表提取 | AI 分析
                </span>
              </div>
            </div>

            {/* 开始分析按钮 */}
            <Button
              onClick={handleStartAnalysis}
              disabled={(!file && !url) || !apiKey || !mineruApiKey}
              className="w-full py-6 text-base font-medium rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {url ? '从 URL 解析并分析' : '开始智能分析'}
            </Button>

            {/* 功能说明 */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                <FileText className="w-6 h-6 mx-auto text-cyan-500 mb-2" />
                <p className="text-sm font-medium text-gray-700">Markdown 提取</p>
                <p className="text-xs text-gray-500 mt-1">结构化文本解析</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                <ImageIcon className="w-6 h-6 mx-auto text-teal-500 mb-2" />
                <p className="text-sm font-medium text-gray-700">图表提取</p>
                <p className="text-xs text-gray-500 mt-1">自动识别提取图表</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 分析进度 */}
      {isAnalyzing && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md space-y-8 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/25">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">{getStatusText()}</h2>
              <p className="text-sm text-gray-500">
                {file?.name || url.split('/').pop() || 'document.pdf'}
              </p>
            </div>

            {/* 进度条 */}
            <div className="space-y-2">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">{progress}%</p>
            </div>

            {/* 步骤指示器 - 基于进度百分比 */}
            <div className="flex items-center justify-center gap-3">
              {[
                { label: '上传', threshold: 20 },
                { label: '解析', threshold: 50 },
                { label: '下载', threshold: 75 },
                { label: '处理', threshold: 90 },
                { label: '完成', threshold: 100 }
              ].map((step, index) => {
                const isComplete = progress >= step.threshold
                const isActive = progress >= (index === 0 ? 0 : [0, 20, 50, 75, 90][index]) && progress < step.threshold
                
                return (
                  <div key={step.label} className="flex flex-col items-center gap-1">
                    <div 
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        isComplete 
                          ? 'bg-cyan-500 scale-110' 
                          : isActive 
                            ? 'w-5 bg-cyan-400 animate-pulse' 
                            : 'bg-gray-200'
                      }`}
                    />
                    <span className={`text-[10px] transition-colors ${
                      isComplete || isActive ? 'text-cyan-600 font-medium' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* 取消按钮 */}
            <Button
              variant="outline"
              onClick={handleCancel}
              className="mt-4"
            >
              取消分析
            </Button>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {status === 'error' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md space-y-6 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-100">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">分析失败</h2>
              <p className="text-sm text-red-500">{errorMessage}</p>
            </div>

            <Button onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              重新开始
            </Button>
          </div>
        </div>
      )}

      {/* 分析结果展示 - 左右分屏 */}
      {hasResult && (
        <div 
          ref={containerRef}
          className="flex-1 flex gap-1 min-h-0"
        >
          {/* 左侧：原文/翻译预览 */}
          <div 
            className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
            style={{ width: `${splitPosition}%` }}
          >
            {/* 顶部标签栏 */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-gray-700">解析内容</span>
                <span className="text-xs text-gray-500">
                  ({Math.round(originalContent.length / 1024)}KB)
                </span>
                
              </div>
              
              {/* 右侧：翻译和控制按钮 */}
              <div className="flex items-center gap-2">
                {/* 翻译进度或按钮 */}
                {isTranslating && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-cyan-600" />
                    <span className="text-xs text-gray-600">翻译中 {translateProgress}%</span>
                  </div>
                )}
                {!isTranslating && !displayTranslatedContent && originalContent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startTranslation(originalContent)}
                    className="h-7 px-3 text-xs"
                  >
                    <Languages className="w-3 h-3 mr-1" />
                    翻译
                  </Button>
                )}
                
                {/* 语言切换开关 */}
                {displayTranslatedContent && (
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
                <button
                      onClick={() => setDisplayLanguage('en')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                        displayLanguage === 'en'
                          ? 'bg-white text-cyan-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                      English
                </button>
                <button
                      onClick={() => setDisplayLanguage('zh')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                        displayLanguage === 'zh'
                          ? 'bg-white text-cyan-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                      中文
                </button>
              </div>
                )}
              
                {/* 缩放控制 */}
                <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500 w-10 text-center">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                </div>
              </div>
            </div>

            {/* 内容区域 - Markdown 渲染（自动滚动条）*/}
            <div 
              className="flex-1 overflow-y-auto p-6 hover:scrollbar-visible" 
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 transparent'
              }}
            >
              <style jsx>{`
                .hover:scrollbar-visible::-webkit-scrollbar {
                  width: 8px;
                }
                .hover:scrollbar-visible::-webkit-scrollbar-track {
                  background: transparent;
                }
                .hover:scrollbar-visible::-webkit-scrollbar-thumb {
                  background: #cbd5e1;
                  border-radius: 4px;
                }
                .hover:scrollbar-visible::-webkit-scrollbar-thumb:hover {
                  background: #94a3b8;
                }
                .hover:scrollbar-visible:not(:hover)::-webkit-scrollbar-thumb {
                  background: transparent;
                }
              `}</style>
              <div 
                className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-600 prose-a:text-cyan-600 prose-code:text-pink-600 prose-pre:bg-slate-100"
                style={{ fontSize: `${zoomLevel}%` }}
              >
                {(displayLanguage === 'en' ? originalContent : (displayTranslatedContent || originalContent)) ? (
                  <div 
                    className="markdown-content select-text"
                    onMouseUp={() => {
                      const selection = window.getSelection()
                      const selectedText = selection?.toString().trim()
                      if (selectedText && selectedText.length > 10) {
                        // 显示翻译按钮
                      }
                    }}
                    dangerouslySetInnerHTML={{
                      __html: (displayLanguage === 'en' ? originalContent : (displayTranslatedContent || originalContent))
                        .replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, (match, alt, src) => {
                          // 将 markdown 图片转换为带 API_BASE 的完整 URL
                          if (src.startsWith('images/')) {
                            const filename = src.split('/').pop()
                            const chart = charts.find(c => c.filename === filename)
                            if (chart) {
                              return `<img src="${API_BASE}${chart.imageUrl}" alt="${alt}" class="max-w-full h-auto rounded-lg shadow-sm my-4" />`
                            }
                          }
                          return `<img src="${src}" alt="${alt}" class="max-w-full h-auto rounded-lg shadow-sm my-4" />`
                        })
                        .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
                        .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>')
                        .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium mt-4 mb-2">$1</h3>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                        .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-slate-100 text-pink-600 text-sm">$1</code>')
                        .replace(/\n\n/g, '</p><p class="my-3">')
                        .split('\n')
                        .map(line => line.trim() ? `<p class="my-3">${line}</p>` : '')
                        .join('')
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>无内容</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 拖拽分隔条 */}
          <div
            className="w-1.5 bg-slate-200 cursor-col-resize hover:bg-cyan-400 transition-all flex-shrink-0 rounded-full"
            onMouseDown={() => setIsDragging(true)}
          />

          {/* 右侧：图表与结构化信息 */}
          <div 
            className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
            style={{ width: `${100 - splitPosition}%` }}
          >
            {/* 顶部操作栏 */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-gray-700">
                  图表分析
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-xs">
                    {charts.length}
                  </span>
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportResults}
                  className="text-xs h-8 border-slate-200 hover:border-slate-300"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  导出全部
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs h-8 border-slate-200 hover:border-slate-300"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  重新分析
                </Button>
              </div>
            </div>

            {/* 右侧Tab切换 */}
            <div className="flex-shrink-0 px-4 py-2 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveRightTab('charts')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    activeRightTab === 'charts' 
                      ? 'bg-white text-cyan-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📊 图表
                </button>
                
                {paperAnalysis && (
                  <button
                    onClick={() => setActiveRightTab('analysis')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                      activeRightTab === 'analysis' 
                        ? 'bg-white text-cyan-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    📝 分析
                  </button>
                )}
              </div>
            </div>

            {/* 右侧内容区域 */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {activeRightTab === 'charts' && (
                charts.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">未提取到图表</p>
                      <p className="text-xs mt-1">PDF 中可能不包含图表，或图表提取未启用</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                  {charts.map((chart) => {
                    const isExpanded = selectedChart?.id === chart.id
                    return (
                    <div
                      key={chart.id}
                        className={`group rounded-xl border transition-all overflow-hidden cursor-pointer ${
                          isExpanded 
                            ? 'border-cyan-400 shadow-lg ring-2 ring-cyan-200' 
                            : 'border-slate-200 hover:border-cyan-300 hover:shadow-md'
                      }`}
                        onClick={() => handleImageClick(chart)}
                    >
                        {/* 图片 */}
                        <div className="relative bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
                        {chart.imageUrl ? (
                          <img 
                            src={`${API_BASE}${chart.imageUrl}`}
                              alt={chart.filename || chart.title}
                              className="w-full h-auto object-contain transition-all duration-300"
                              style={{ 
                                maxHeight: isExpanded ? 'none' : '300px',
                                minHeight: '150px'
                              }}
                              onLoad={(e) => {
                                // 图片加载完成后自动调整
                                const img = e.target as HTMLImageElement
                              }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center min-h-[150px]">
                              <ImageIcon className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                          {/* 点击提示 */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur px-4 py-2 rounded-lg text-xs font-medium text-gray-700 shadow-lg">
                              <span className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                                点击跳转并查看分析
                              </span>
                        </div>
                        </div>
                          {/* 展开指示器 */}
                          {isExpanded && (
                            <div className="absolute top-2 right-2 bg-cyan-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              已选中
                              </div>
                            )}
                        </div>

                        {/* 图片信息 */}
                        <div className="p-3 bg-white">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 truncate flex-1 font-medium">
                              {chart.filename || chart.title}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownloadChart(chart)
                              }}
                              title="下载图片"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                )
              )}
              
              {activeRightTab === 'analysis' && paperAnalysis && (
                <AnalysisResultsTab 
                  analysis={{
                    summary: {
                      coreProblem: paperAnalysis.coreProblem,
                      previousDilemma: paperAnalysis.previousDilemma,
                      coreIntuition: paperAnalysis.coreIntuition,
                      keySteps: paperAnalysis.keySteps,
                      innovations: paperAnalysis.innovations,
                      boundaries: paperAnalysis.boundaries,
                      oneSentence: paperAnalysis.oneSentence
                    },
                    speech: '',
                    qa: [],
                    paper_text: paperText
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
