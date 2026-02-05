'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  Link2, Globe, X, Clock, Loader2, Plus, History, Zap, FileDown, 
  Trash2, Copy, Check, AlertCircle, PlayCircle, Youtube, ExternalLink
} from 'lucide-react'
import Image from 'next/image'
import { firecrawl, FirecrawlScrapeResponse, FirecrawlScrapeData, ScrapeHistoryItem } from '@/lib/firecrawl'
import { detectPlatform, extractTwitterId, extractYoutubeId, exportToCSV, formatDateTime } from './utils'
import { ContentFormat } from './types'

// Twitter 嵌入组件
function TwitterEmbed({ tweetId }: { tweetId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = `
        <blockquote class="twitter-tweet" data-theme="light">
          <a href="https://twitter.com/x/status/${tweetId}"></a>
        </blockquote>
      `
      if ((window as any).twttr?.widgets) {
        (window as any).twttr.widgets.load(containerRef.current)
      }
    }
  }, [tweetId])
  
  return (
    <div ref={containerRef} className="twitter-embed min-h-[300px] flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  )
}

// YouTube 嵌入组件
function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  )
}

export function CrawlerUrlSection() {
  // 状态管理
  const [urlInputs, setUrlInputs] = useState<string[]>([''])
  const [scrapeStatus, setScrapeStatus] = useState<'idle' | 'scraping'>('idle')
  const [scrapeProgress, setScrapeProgress] = useState({ current: 0, total: 0 })
  const [currentResult, setCurrentResult] = useState<FirecrawlScrapeResponse | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string>('')
  const [scrapeHistory, setScrapeHistory] = useState<ScrapeHistoryItem[]>([])
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ScrapeHistoryItem | null>(null)
  const [copied, setCopied] = useState(false)
  const [viewFormat, setViewFormat] = useState<ContentFormat>('markdown')
  const [showEmbed, setShowEmbed] = useState(true)

  // 加载 Twitter widgets 脚本
  useEffect(() => {
    if (!(window as any).twttr) {
      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  // 从 localStorage 加载历史记录
  useEffect(() => {
    const saved = localStorage.getItem('scrapeHistory')
    if (saved) {
      try {
        setScrapeHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load scrape history:', e)
      }
    }
  }, [])

  // 保存历史记录
  const saveHistory = useCallback((history: ScrapeHistoryItem[]) => {
    localStorage.setItem('scrapeHistory', JSON.stringify(history.slice(0, 100)))
  }, [])

  // URL 操作函数
  const addUrlInput = () => setUrlInputs([...urlInputs, ''])
  const updateUrlInput = (index: number, value: string) => {
    const newInputs = [...urlInputs]
    newInputs[index] = value
    setUrlInputs(newInputs)
  }
  const removeUrlInput = (index: number) => {
    if (urlInputs.length > 1) setUrlInputs(urlInputs.filter((_, i) => i !== index))
  }
  const handlePasteUrls = (text: string) => {
    const urls = text.split(/[\n,]/).map(u => u.trim()).filter(u => u && u.startsWith('http'))
    if (urls.length > 0) setUrlInputs(urls)
  }

  // 执行批量爬取
  const handleBatchScrape = async () => {
    const validUrls = urlInputs.filter(u => u.trim())
    if (validUrls.length === 0) return
    
    setScrapeStatus('scraping')
    setScrapeProgress({ current: 0, total: validUrls.length })
    setCurrentResult(null)
    setSelectedHistoryItem(null)
    
    const newHistoryItems: ScrapeHistoryItem[] = []
    
    for (let i = 0; i < validUrls.length; i++) {
      setScrapeProgress({ current: i + 1, total: validUrls.length })
      setCurrentUrl(validUrls[i].trim())
      
      const result = await firecrawl.scrape({
        url: validUrls[i].trim(),
        formats: ['markdown', 'html'],
        timeout: 60000,
      })
      
      setCurrentResult(result)
      
      const historyItem: ScrapeHistoryItem = {
        id: Date.now().toString() + i,
        url: validUrls[i].trim(),
        title: result.data?.metadata?.title || validUrls[i].trim(),
        status: result.success ? 'success' : 'error',
        timestamp: Date.now(),
        data: result.data,
        error: result.error,
      }
      newHistoryItems.push(historyItem)
    }
    
    const updatedHistory = [...newHistoryItems, ...scrapeHistory]
    setScrapeHistory(updatedHistory)
    saveHistory(updatedHistory)
    setScrapeStatus('idle')
  }

  // 复制内容
  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  // 删除历史记录
  const handleDeleteHistory = (id: string) => {
    const newHistory = scrapeHistory.filter(item => item.id !== id)
    setScrapeHistory(newHistory)
    saveHistory(newHistory)
    if (selectedHistoryItem?.id === id) {
      setSelectedHistoryItem(null)
      setCurrentResult(null)
    }
  }

  // 清空历史记录
  const handleClearHistory = () => {
    setScrapeHistory([])
    localStorage.removeItem('scrapeHistory')
    setSelectedHistoryItem(null)
    setCurrentResult(null)
  }

  // 选择历史记录
  const handleSelectHistory = (item: ScrapeHistoryItem) => {
    setSelectedHistoryItem(item)
    setCurrentResult({ success: item.status === 'success', data: item.data, error: item.error })
    setCurrentUrl(item.url)
  }

  // 渲染预览内容
  const renderPreview = (data: FirecrawlScrapeData | undefined, url: string) => {
    if (!data) return null
    
    const platform = detectPlatform(url)
    
    if (showEmbed && platform === 'twitter') {
      const tweetId = extractTwitterId(url)
      if (tweetId) {
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
              <img src="/X-logo.png" alt="X" className="h-5 w-5 object-contain" />
              <span>X 嵌入预览</span>
            </div>
            <TwitterEmbed tweetId={tweetId} />
          </div>
        )
      }
    }
    
    if (showEmbed && platform === 'youtube') {
      const videoId = extractYoutubeId(url)
      if (videoId) {
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-red-500 font-medium">
              <Youtube className="h-5 w-5" />
              <span>YouTube 嵌入预览</span>
            </div>
            <YouTubeEmbed videoId={videoId} />
          </div>
        )
      }
    }
    
    const content = viewFormat === 'markdown' ? data.markdown : data.html
    return (
      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
        {content || '暂无内容'}
      </pre>
    )
  }

  // 当前显示的数据
  const displayData = selectedHistoryItem?.data || currentResult?.data
  const displayUrl = selectedHistoryItem?.url || currentUrl

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
      {/* 左列：URL 输入 */}
      <div className="w-80 border-r border-gray-200/60 flex flex-col bg-white/50">
        <div className="p-4 border-b border-gray-200/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
              <Link2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">网页爬取</h2>
              <p className="text-xs text-gray-500">支持 X、YouTube 预览</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              Powered by Firecrawl
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">输入 URL</span>
            <div className="flex items-center gap-2 text-xs">
              <button onClick={addUrlInput} className="text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                <Plus className="h-3 w-3" />添加
              </button>
              <button onClick={() => navigator.clipboard.readText().then(handlePasteUrls)} className="text-gray-500 hover:text-gray-700">
                批量粘贴
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {urlInputs.map((url, index) => (
              <div key={index} className="flex items-center gap-2 group">
                <div className="flex-1 relative">
                  <Input
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => updateUrlInput(index, e.target.value)}
                    className="h-9 text-sm bg-white border-gray-200 focus:border-cyan-500 pr-12"
                  />
                  {url && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {detectPlatform(url) === 'twitter' && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#1DA1F2]/10 text-[#1DA1F2] rounded">X</span>
                      )}
                      {detectPlatform(url) === 'youtube' && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500/10 text-red-500 rounded">YT</span>
                      )}
                    </div>
                  )}
                </div>
                {urlInputs.length > 1 && (
                  <button onClick={() => removeUrlInput(index)} className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-400 text-center">
            {urlInputs.filter(u => u.trim()).length} 个有效 URL
          </div>
        </div>

        <div className="p-4 border-t border-gray-200/60">
          <Button
            onClick={handleBatchScrape}
            disabled={urlInputs.every(u => !u.trim()) || scrapeStatus === 'scraping'}
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
          >
            {scrapeStatus === 'scraping' ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />爬取中 ({scrapeProgress.current}/{scrapeProgress.total})</>
            ) : (
              <><PlayCircle className="h-4 w-4 mr-2" />开始爬取</>
            )}
          </Button>
        </div>
      </div>

      {/* 中列：预览区域 */}
      <div className="flex-1 flex flex-col min-w-0 bg-white/30">
        {/* 工具栏 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/60 bg-white/50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">内容预览</span>
            {displayData && (
              <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
                <button onClick={() => setViewFormat('markdown')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${viewFormat === 'markdown' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                  Markdown
                </button>
                <button onClick={() => setViewFormat('html')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${viewFormat === 'html' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                  HTML
                </button>
              </div>
            )}
          </div>
          {displayData && (
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" checked={showEmbed} onChange={(e) => setShowEmbed(e.target.checked)}
                className="rounded border-gray-300 text-cyan-500 focus:ring-cyan-500" />
              嵌入预览
            </label>
          )}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
          {scrapeStatus === 'idle' && !displayData && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-4">
                <Globe className="h-12 w-12 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-500">输入 URL 开始爬取</p>
              <p className="text-sm mt-1">X 和 YouTube 链接可渲染嵌入组件</p>
            </div>
          )}

          {scrapeStatus === 'scraping' && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-cyan-100 border-t-cyan-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-cyan-600">{scrapeProgress.current}</span>
                </div>
              </div>
              <p className="text-gray-600 font-medium">正在爬取...</p>
              <p className="text-sm text-gray-400 mt-1">{scrapeProgress.current} / {scrapeProgress.total}</p>
            </div>
          )}

          {scrapeStatus === 'idle' && displayData && (
            <div className="space-y-4">
              {/* 元信息 */}
              <Card className="p-4 bg-white border-gray-200/60">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {displayData.metadata?.favicon && (
                      <img src={displayData.metadata.favicon} alt="" className="w-6 h-6 rounded" 
                        onError={(e) => (e.currentTarget.style.display = 'none')} />
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{displayData.metadata?.title || displayUrl}</h3>
                      <a href={displayUrl} target="_blank" rel="noopener noreferrer" 
                        className="text-sm text-cyan-600 hover:underline truncate flex items-center gap-1">
                        {displayUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(
                    viewFormat === 'markdown' ? displayData.markdown || '' : displayData.html || ''
                  )}>
                    {copied ? <><Check className="h-4 w-4 mr-1 text-green-500" />已复制</> : <><Copy className="h-4 w-4 mr-1" />复制</>}
                  </Button>
                </div>
              </Card>

              {/* 预览内容 */}
              <Card className="p-4 bg-white border-gray-200/60 max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-hide">
                {currentResult?.success === false ? (
                  <div className="flex items-start gap-3 text-red-600">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">爬取失败</p>
                      <p className="text-sm mt-1">{currentResult.error}</p>
                    </div>
                  </div>
                ) : (
                  renderPreview(displayData, displayUrl)
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* 右列：历史记录 */}
      <div className="w-72 border-l border-gray-200/60 flex flex-col bg-white/50">
        <div className="p-4 border-b border-gray-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">爬取历史</span>
              <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{scrapeHistory.length}</span>
            </div>
          </div>
          {scrapeHistory.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => exportToCSV(scrapeHistory, viewFormat)} className="flex-1 text-xs">
                <FileDown className="h-4 w-4 mr-1" />
                导出 CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearHistory} className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs">
                <Trash2 className="h-4 w-4 mr-1" />
                清空
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
          {scrapeHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Clock className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm">暂无历史记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scrapeHistory.map((item) => {
                const platform = detectPlatform(item.url)
                const isSelected = selectedHistoryItem?.id === item.id
                return (
                  <div key={item.id} onClick={() => handleSelectHistory(item)}
                    className={`p-3 rounded-xl cursor-pointer transition-all group ${
                      isSelected ? 'bg-cyan-50 border-2 border-cyan-300 shadow-sm' : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm'
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${item.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {platform === 'twitter' && <img src="/X-logo.png" alt="X" className="h-4 w-4 object-contain" />}
                          {platform === 'youtube' && <Youtube className="h-4 w-4 text-red-500" />}
                          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{item.url}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDateTime(item.timestamp)}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteHistory(item.id) }}
                        className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

