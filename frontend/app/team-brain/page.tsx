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
    summary: `# Nvidia Q3 战略分析报告

## 核心发现

### 1. 数据中心业务强劲增长
- Q3数据中心收入增长 **147%** YoY，达到 $18.4B
- H100 GPU 需求持续火爆，供不应求
- 主要客户：云服务商（AWS、Azure、GCP）和大型科技公司

### 2. AI 芯片市场领导地位
- 在 AI 训练芯片市场占有率超过 **80%**
- Grace Hopper 超级芯片开始量产
- 预计 2024 年推出更强大的 B100 系列

### 3. 软件生态系统优势
- CUDA 生态系统护城河进一步加深
- 开发者数量突破 **400万**
- 推出新的 AI Enterprise 软件套件

### 4. 财务表现优异
| 指标 | Q3 2024 | YoY 增长 |
|------|---------|----------|
| 营收 | $18.1B | +206% |
| 净利润 | $9.2B | +1259% |
| 毛利率 | 75% | +7.5% |

### 5. 市场展望
- 预计 Q4 营收将达到 $20B
- AI 芯片需求将持续到 2025 年
- 面临来自 AMD 和定制芯片的竞争压力

## 战略建议

1. **持续关注供应链**: H100 产能提升对业绩影响巨大
2. **关注竞争动态**: AMD MI300X 即将上市，可能影响市场份额
3. **软件收入增长**: AI Enterprise 可能成为新的增长点
4. **地缘政治风险**: 中国市场的限制可能影响长期增长

## 结论

Nvidia 在 AI 时代占据绝对领先地位，短期内难以撼动。但需要密切关注竞争对手的追赶和监管环境的变化。`,
    timeAgo: '2小时前',
    tags: ['#硬件', '#AI'],
    icon: 'pdf',
    color: 'red',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    stats: { insights: 12, pages: 45, confidence: 94 }
  },
  {
    id: 'demo-2',
    title: 'Market_Analysis_2024.doc',
    description: '全球半导体市场趋势及预测...',
    summary: `# 2024全球半导体市场分析

## 市场规模与增长

### 整体市场
- 2024年全球半导体市场规模预计达到 **$5,844亿美元**
- YoY增长率约 **13.1%**
- 2025年预计将突破 **$6,000亿美元**

### 细分市场表现

#### 1. 存储芯片 (Memory)
- 市场规模: $1,320亿
- 增长率: +44.8%
- 驱动因素: AI服务器需求、智能手机复苏

#### 2. 逻辑芯片 (Logic)
- 市场规模: $1,891亿
- 增长率: +8.3%
- 主导厂商: TSMC、Samsung、Intel

#### 3. 模拟芯片 (Analog)
- 市场规模: $742亿
- 增长率: +6.2%
- 应用领域: 汽车、工业自动化

## 地区分布

| 地区 | 市场份额 | 增长率 |
|------|---------|--------|
| 亚太 | 65% | +15% |
| 北美 | 22% | +10% |
| 欧洲 | 9% | +7% |
| 其他 | 4% | +5% |

## 技术趋势

### 1. 先进制程持续推进
- **3nm** 量产进入成熟期 (TSMC, Samsung)
- **2nm** 进入试产阶段，2025年量产
- GAA晶体管技术成为主流

### 2. Chiplet 架构兴起
- 降低大芯片开发成本
- 提升良率和灵活性
- AMD、Intel 积极布局

### 3. AI 芯片专用化
- 训练芯片: Nvidia H100/H200 主导
- 推理芯片: 百花齐放，初创公司涌现
- 边缘AI芯片快速增长

## 行业挑战

1. **地缘政治**: 中美科技竞争加剧
2. **产能过剩**: 部分成熟制程面临库存压力
3. **人才短缺**: 全球半导体工程师缺口扩大
4. **环境压力**: 能耗和碳排放要求提高

## 投资建议

### 看好领域
- ✅ AI芯片（训练&推理）
- ✅ 汽车半导体（智能驾驶）
- ✅ 先进封装技术
- ✅ 化合物半导体（第三代）

### 谨慎领域
- ⚠️ 消费电子芯片
- ⚠️ 成熟制程产能
- ⚠️ 中低端存储芯片

## 结论

2024年半导体行业整体向好，AI浪潮带来新一轮成长周期。但需警惕地缘政治风险和周期性波动。建议重点关注AI、汽车和先进制程相关标的。`,
    timeAgo: '1天前',
    tags: ['#市场', '#2024'],
    icon: 'doc',
    color: 'cyan',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { insights: 18, pages: 67, confidence: 89 }
  },
  {
    id: 'demo-3',
    title: 'Competitor_Landscape.xlsx',
    description: '前5大竞争对手对比矩阵...',
    summary: `# AI芯片市场竞争格局分析

## 市场概览

当前AI芯片市场呈现**一超多强**格局：
- Nvidia 占据绝对领先地位（市占率 ~80%）
- AMD、Intel 加速追赶
- 云厂商自研芯片崛起
- 初创公司瞄准细分市场

---

## 主要竞争对手分析

### 1. Nvidia 🏆

**优势：**
- ✅ CUDA 生态系统强大，开发者基数大
- ✅ H100/H200 性能领先，供不应求
- ✅ 软硬件协同优化完善
- ✅ 品牌认知度最高

**劣势：**
- ❌ 价格昂贵（H100 单价 $25,000+）
- ❌ 供应链受限，交付周期长
- ❌ 能耗较高
- ❌ 面临反垄断审查

**市场份额：** ~80%  
**2024营收预测：** $60B+

---

### 2. AMD

**优势：**
- ✅ MI300X 性能接近 H100
- ✅ 价格更具竞争力（约便宜20%）
- ✅ 内存容量更大（192GB HBM3）
- ✅ ROCm 生态系统持续改善

**劣势：**
- ❌ 软件生态不如 CUDA 成熟
- ❌ 开发者熟悉度低
- ❌ 生产产能有限
- ❌ 品牌影响力不足

**市场份额：** ~5-10%  
**2024营收预测：** $4-6B

---

### 3. Intel

**优势：**
- ✅ Gaudi 2/3 针对推理优化
- ✅ 价格竞争力强
- ✅ 庞大的企业客户基础
- ✅ oneAPI 统一编程模型

**劣势：**
- ❌ 训练性能落后
- ❌ 生态系统薄弱
- ❌ 市场认可度低
- ❌ 多次跳票影响信誉

**市场份额：** ~2-3%  
**2024营收预测：** $1-2B

---

### 4. 云厂商自研芯片

#### Google TPU
- 专为TensorFlow优化
- 仅供内部使用
- v5 性能强劲

#### AWS Trainium/Inferentia  
- 针对特定工作负载优化
- 成本优势明显
- 市场影响力有限

#### Microsoft Maia
- 刚刚发布，尚未大规模部署
- 与Azure深度集成

**合计市场份额：** ~5-8%

---

### 5. 初创公司

- **Cerebras**: 超大晶圆级芯片
- **SambaNova**: DataScale 架构
- **Graphcore**: IPU智能处理器
- **Groq**: LPU语言处理单元

**特点：**
- 技术创新性强
- 瞄准特定应用场景
- 商业化进展缓慢
- 融资环境恶化

---

## 竞争力对比矩阵

| 指标 | Nvidia | AMD | Intel | 云厂商 | 初创 |
|------|--------|-----|-------|--------|------|
| 训练性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 推理性能 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 软件生态 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 价格竞争力 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 供应能力 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

---

## 市场趋势预测

### 短期（2024-2025）
- Nvidia 继续主导，但市占率可能下降到70%左右
- AMD MI300系列获得部分大客户采用
- 云厂商自研芯片内部占比提升

### 中期（2026-2027）
- 软件生态竞争加剧，开源框架普及
- 定制化AI芯片成为趋势
- Nvidia 市占率可能降至60%

### 长期（2028+）
- 市场进入多寡头竞争格局
- 专用AI芯片细分市场涌现
- 新的技术范式可能改变游戏规则

---

## 战略建议

### 对投资者
1. **核心持仓**: 继续配置 Nvidia，但降低仓位比例
2. **分散风险**: 适当配置 AMD 等追赶者
3. **长期关注**: 跟踪云厂商和有潜力的初创公司

### 对企业买家
1. **多元化供应**: 避免过度依赖单一供应商
2. **软件投资**: 提升算法效率，降低硬件依赖
3. **自研评估**: 大规模部署可考虑定制方案

### 对Nvidia客户
- ⚠️ 密切关注交付周期
- ⚠️ 评估AMD替代方案可行性
- ⚠️ 考虑混合部署策略`,
    timeAgo: '3天前',
    tags: ['#内部', '#战略'],
    icon: 'excel',
    color: 'emerald',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { insights: 25, pages: 89, confidence: 91 }
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
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 px-4 sm:px-6 lg:px-8 pt-8 pb-6">
            <div className="max-w-5xl mx-auto">
              {/* 标题和上传按钮 */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    团队知识库
                  </h1>
                  <p className="text-gray-600 text-sm">
                    即时访问团队的集体智慧，AI 助力知识沉淀
                  </p>
                </div>
                
                {/* 上传按钮 - 移到顶部右侧 */}
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
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
                <div className="mb-6 bg-white rounded-xl border border-purple-200 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">准备上传</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
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
              <div className="relative max-w-2xl mx-auto mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="搜索团队知识库..."
                  className="w-full h-12 pl-12 pr-12 text-base border-0 bg-white rounded-xl shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-purple-500/40 transition-all placeholder:text-gray-400"
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
                    className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-slate-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/50 transition-all shadow-sm"
                  >
                    {cat.label}
                    <span className="ml-1.5 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">{cat.count}</span>
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
                      onClick={() => {
                        // 使用演示数据创建模拟文档对象
                        const mockDoc: DocumentItem = {
                          id: doc.id,
                          title: doc.title,
                          file_url: '', // 演示模式不需要真实PDF
                          created_at: doc.created_at,
                          summary: doc.summary
                        }
                        setSelectedDoc(mockDoc)
                        setView('detail')
                        setReport(doc.summary) // 直接使用预设的分析报告
                        setChatHistory([])
                        setPageNumber(1)
                        setPdfUrl(null) // 演示模式不显示PDF
                        toast.success('已进入文档详情页（演示模式）')
                      }}
                      className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <h2 className="text-lg font-semibold text-gray-900">AI 洞察</h2>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                      智能分析
                    </span>
                  </div>
                  <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                    查看全部
                  </button>
                </div>

                {/* 洞察卡片 - 可点击 */}
                <div className="space-y-4">
                  {DEMO_INSIGHTS.map((insight) => (
                    <div
                      key={insight.id}
                      onClick={() => {
                        // 点击洞察时，如果有对应的文档，则打开详情页
                        if (documents.length > 0) {
                          handleDocClick(documents[0]) // 使用第一个文档作为示例
                        } else {
                          toast.info('演示数据，请先上传文档')
                        }
                      }}
                      className="group bg-gradient-to-br from-white to-purple-50/30 rounded-xl border border-purple-200 p-5 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-purple-700">{insight.source}</span>
                            <span className="text-xs text-gray-400 ml-1">• 第 {insight.page} 页</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                          insight.relevance === 'high' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {insight.relevance === 'high' ? '🔥 高度相关' : '相关'}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                        {insight.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4">
                        {insight.content}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            查看详情
                          </span>
                          <span className="flex items-center gap-1">
                            <Brain className="h-3.5 w-3.5" />
                            AI 生成
                          </span>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 详情视图
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 顶部工具栏 - 增强视觉效果 */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-200/60 bg-gradient-to-r from-purple-50 via-pink-50 to-white">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-sm transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{selectedDoc?.title}</h1>
            <p className="text-xs text-gray-500">
              创建于 {selectedDoc && new Date(selectedDoc.created_at).toLocaleDateString('zh-CN')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
              <Brain className="h-3.5 w-3.5 text-purple-600" />
              <span className="text-xs font-medium text-gray-700">AI 分析中</span>
            </div>
          </div>
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
                            <div className="relative w-16 h-16 mx-auto mb-4">
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 animate-ping"></div>
                              <div className="relative w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <Brain className="h-8 w-8 text-white animate-pulse" />
                              </div>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">AI 正在分析文档</p>
                            <p className="text-xs text-gray-500">提取关键信息与洞察...</p>
                          </div>
                        </div>
                      ) : report ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                          {/* 分析概览卡片 */}
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 border border-purple-200">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-purple-600" />
                                <span className="text-xs font-medium text-purple-900">关键洞察</span>
                              </div>
                              <p className="text-lg font-bold text-purple-600">{Math.floor(Math.random() * 10 + 5)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-3 border border-pink-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="h-4 w-4 text-pink-600" />
                                <span className="text-xs font-medium text-pink-900">分析维度</span>
                              </div>
                              <p className="text-lg font-bold text-pink-600">{Math.floor(Math.random() * 5 + 3)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-3 border border-cyan-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Brain className="h-4 w-4 text-cyan-600" />
                                <span className="text-xs font-medium text-cyan-900">置信度</span>
                              </div>
                              <p className="text-lg font-bold text-cyan-600">{Math.floor(Math.random() * 20 + 80)}%</p>
                            </div>
                          </div>

                          {/* AI 生成标识 */}
                          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200/50">
                            <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
                            <span className="text-xs text-purple-900 font-medium">AI 生成的智能报告</span>
                            <span className="ml-auto text-[10px] text-purple-600 bg-white px-2 py-0.5 rounded-full">实时分析</span>
                          </div>

                          {/* 报告内容 */}
                          <div className="prose prose-sm max-w-none
                            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-sm
                            prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                            prose-h2:text-base prose-h2:bg-gradient-to-r prose-h2:from-purple-600 prose-h2:to-pink-600 prose-h2:bg-clip-text prose-h2:text-transparent
                            prose-strong:text-gray-900 prose-strong:font-semibold
                            prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                            prose-ul:list-disc prose-ol:list-decimal
                            prose-li:text-gray-700 prose-li:text-sm prose-li:my-1
                            prose-blockquote:border-l-4 prose-blockquote:border-purple-400 prose-blockquote:bg-purple-50/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex, rehypeHighlight]}
                            >
                              {report}
                            </ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <Brain className="h-10 w-10 text-purple-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">等待 AI 分析</p>
                            <p className="text-xs text-gray-500">报告将自动生成</p>
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
