/**
 * 知识沉淀功能 Hook
 */

import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAppStore } from '@/stores/useAppStore'
import { toast } from 'sonner'

export interface DocumentItem {
  id: string
  title: string
  file_url: string
  created_at: string
  summary?: string
}

export function useTeamBrain() {
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
  const { teamKey } = useAppStore()

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

  // 生成报告
  const generateReport = async (doc: DocumentItem) => {
    setIsGeneratingReport(true)
    try {
      console.log(`Fetching content for document: ${doc.id}`)
      const contentResponse = await api.getDocumentContent(doc.id)
      
      if (!contentResponse.success || !contentResponse.content) {
        console.error('Failed to fetch document content')
        toast.error('获取文档内容失败')
        setIsGeneratingReport(false)
        return
      }
      
      console.log(`Document content fetched: ${contentResponse.chunk_count} chunks`)
      
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

  // 处理文档点击 - 进入详情页
  const handleDocClick = async (doc: DocumentItem) => {
    setSelectedDoc(doc)
    setView('detail')
    setReport('')
    setChatHistory([])
    setPageNumber(1)
    setPdfUrl(doc.file_url)
    
    await generateReport(doc)
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

  return {
    // State
    view,
    selectedDoc,
    documents,
    file,
    isUploading,
    isLoadingDocs,
    report,
    isGeneratingReport,
    activeTab,
    chatQuestion,
    chatHistory,
    isChatLoading,
    pdfUrl,
    numPages,
    pageNumber,
    teamKey,
    // Refs
    fileInputRef,
    // Setters
    setFile,
    setActiveTab,
    setChatQuestion,
    setPageNumber,
    // Handlers
    handleFileSelect,
    handleUpload,
    handleDocClick,
    handleBackToList,
    handleChatSend,
    onDocumentLoadSuccess,
    handleDownloadDocument,
  }
}

