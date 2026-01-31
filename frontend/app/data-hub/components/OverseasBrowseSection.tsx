'use client'

/**
 * 海外信源浏览组件
 * 支持 YouTube 和 Twitter 内容展示
 * 默认使用新布局（左侧筛选 + 中间卡片列表）
 */

import React, { useState, useMemo, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2, Globe, RefreshCw, X } from 'lucide-react'

// 从模块导入
import {
  PLATFORMS,
  SORT_OPTIONS,
  TwitterCard,
  YouTubeCard,
  TwitterDetailPanel,
  YouTubeDetailPanel,
  useOverseasData,
  NewLayoutView,
  type OverseasItem,
  type TwitterItem,
  type YouTubeItem,
} from './overseas'

/**
 * 工具栏组件
 */
function Toolbar({
  selectedPlatform,
  searchTerm,
  sortOrder,
  isCrawling,
  resultCount,
  onPlatformChange,
  onSearchChange,
  onSortChange,
  onCrawl,
}: {
  selectedPlatform: string
  searchTerm: string
  sortOrder: string
  isCrawling: boolean
  resultCount: number
  onPlatformChange: (platform: any) => void
  onSearchChange: (term: string) => void
  onSortChange: (order: any) => void
  onCrawl: () => void
}) {
  return (
    <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-slate-200/60 bg-white z-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* 平台筛选 */}
        <div className="flex items-center gap-2">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon
            return (
              <button 
                key={platform.id} 
                onClick={() => onPlatformChange(platform.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedPlatform === platform.id 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {platform.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索账号名、内容或标题..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-64 pl-9 bg-white border-gray-200 focus:border-cyan-500"
            />
          </div>
          
          {/* 排序 */}
          <select
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-9 px-3 pr-8 rounded-md border border-gray-200 text-sm bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          
          {/* 爬取按钮 */}
          <Button
            onClick={onCrawl}
            disabled={isCrawling}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isCrawling ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isCrawling ? '爬取中...' : '重新爬取数据'}</span>
          </Button>
        </div>
      </div>
      
      {/* 搜索结果统计 */}
      {searchTerm && (
        <div className="mt-2 text-sm text-gray-500">
          找到 <span className="font-medium text-cyan-600">{resultCount}</span> 条结果
        </div>
      )}
    </div>
  )
}

/**
 * 空状态组件
 */
function EmptyState({ 
  type, 
  isCrawling, 
  onCrawl 
}: { 
  type: 'no-data' | 'no-results'
  isCrawling: boolean
  onCrawl: () => void 
}) {
  if (type === 'no-data') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Globe className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">暂无数据，请先运行爬虫任务</p>
        <p className="text-sm mt-2">点击下方按钮开始获取海外信源</p>
        <Button
          onClick={onCrawl}
          disabled={isCrawling}
          className="mt-4 bg-cyan-600 hover:bg-cyan-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isCrawling ? 'animate-spin' : ''}`} />
          {isCrawling ? '爬取中...' : '立即爬取'}
        </Button>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <Search className="h-16 w-16 mb-4 opacity-50" />
      <p className="text-lg font-medium">未找到匹配的内容</p>
      <p className="text-sm mt-1">尝试更换搜索关键词</p>
    </div>
  )
}

/**
 * 加载状态组件
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-600 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">加载海外信源数据...</p>
      </div>
    </div>
  )
}

/**
 * 瀑布流卡片网格组件
 * 使用 CSS columns 实现瀑布流，通过重新分配实现横向阅读顺序
 */
function CardGrid({ 
  items, 
  selectedId,
  onSelect 
}: { 
  items: OverseasItem[]
  selectedId: string | null
  onSelect: (item: OverseasItem) => void
}) {
  // 计算列数（与 CSS columns 保持同步）
  const getColumnCount = () => {
    if (typeof window === 'undefined') return 3
    if (window.innerWidth < 768) return 1
    if (window.innerWidth < 1280) return 2
    return 3
  }
  
  // 重新分配项目顺序以实现横向阅读
  // 原始顺序: [1,2,3,4,5,6,7,8,9]
  // CSS columns 会按列填充，所以我们重排为: [1,4,7,2,5,8,3,6,9]
  // 这样渲染后横向阅读就是: 1,2,3 | 4,5,6 | 7,8,9
  const [columnCount, setColumnCount] = useState(3)
  
  useEffect(() => {
    const handleResize = () => setColumnCount(getColumnCount())
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // 重排项目以实现横向优先的视觉顺序
  const reorderedItems = useMemo(() => {
    if (columnCount <= 1) return items
    
    const result: OverseasItem[] = []
    const rowCount = Math.ceil(items.length / columnCount)
    
    for (let col = 0; col < columnCount; col++) {
      for (let row = 0; row < rowCount; row++) {
        const index = row * columnCount + col
        if (index < items.length) {
          result.push(items[index])
        }
      }
    }
    return result
  }, [items, columnCount])

  return (
    <div 
      className="gap-4"
      style={{
        columnCount: columnCount,
        columnGap: '16px',
      }}
    >
      {reorderedItems.map((item, index) => (
        <div key={`card-${item.id}-${index}`} className="mb-4 break-inside-avoid">
          {item.platform === 'youtube' ? (
            <YouTubeCard 
              item={item as YouTubeItem}
              isSelected={selectedId === item.id}
              onClick={() => onSelect(item)}
            />
          ) : (
            <TwitterCard 
              item={item as TwitterItem}
              isSelected={selectedId === item.id}
              onClick={() => onSelect(item)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * 添加信源弹窗组件 - 支持批量添加
 */
function AddSourceModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: (urls: string[]) => Promise<void>
}) {
  const [urls, setUrls] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<Array<{ url: string; success: boolean; message: string }>>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urls.trim()) {
      setError('请输入 URL')
      return
    }

    // 解析多行 URL
    const urlList = urls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0)

    if (urlList.length === 0) {
      setError('请输入有效的 URL')
      return
    }

    // 验证所有 URL 格式
    const invalidUrls = urlList.filter(url => {
      const isTwitter = url.includes('x.com/') || url.includes('twitter.com/')
      const isYoutube = url.includes('youtube.com/')
      return !isTwitter && !isYoutube
    })

    if (invalidUrls.length > 0) {
      setError(`以下 URL 格式无效：\n${invalidUrls.join('\n')}`)
      return
    }

    setIsAdding(true)
    setError('')
    setResults([])
    
    try {
      await onAdd(urlList)
      setUrls('')
      onClose()
    } catch (err: any) {
      setError(err.message || '添加失败')
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    setUrls('')
    setError('')
    setResults([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">添加信源账号</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                账号 URL（支持批量添加，一行一个）
              </label>
              <textarea
                placeholder={`输入 X 或 YouTube 账号 URL，一行一个...\n\n例如：\nhttps://x.com/karpathy\nhttps://x.com/AndrewYNg\nhttps://youtube.com/@a16z`}
                value={urls}
                onChange={(e) => {
                  setUrls(e.target.value)
                  setError('')
                }}
                rows={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                支持格式：https://x.com/username 或 https://youtube.com/@channel
              </p>
              {error && <p className="mt-1.5 text-xs text-red-500 whitespace-pre-wrap">{error}</p>}
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              取消
            </Button>
            <Button
              type="submit"
              disabled={isAdding}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  添加中...
                </>
              ) : (
                '添加'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * 主组件 - 使用新布局
 */
export function OverseasBrowseSection() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [isAutoCrawling, setIsAutoCrawling] = useState(false)

  const handleAddSource = async (urls: string[]) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const errors: string[] = []
    let successCount = 0
    
    // 逐个添加信源
    for (const url of urls) {
      try {
        const response = await fetch(`${API_BASE}/api/crawler/sources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
        
        if (!response.ok) {
          const error = await response.json()
          errors.push(`${url}: ${error.detail || '添加失败'}`)
        } else {
          successCount++
        }
      } catch (err: any) {
        errors.push(`${url}: ${err.message || '网络错误'}`)
      }
    }
    
    // 如果有任何成功的，触发爬虫任务
    if (successCount > 0) {
      setIsAutoCrawling(true)
      try {
        const crawlResponse = await fetch(`${API_BASE}/api/crawler/crawl/all`, {
          method: 'POST',
        })
        if (!crawlResponse.ok) {
          console.warn('自动爬取失败，但信源已添加成功')
        }
      } catch (err) {
        console.warn('自动爬取失败:', err)
      } finally {
        setIsAutoCrawling(false)
      }
    }
    
    // 如果有错误，抛出
    if (errors.length > 0) {
      if (successCount > 0) {
        throw new Error(`成功添加 ${successCount} 个，失败 ${errors.length} 个:\n${errors.join('\n')}`)
      } else {
        throw new Error(errors.join('\n'))
      }
    }
  }

  return (
    <>
      <NewLayoutView onAddSource={() => setShowAddModal(true)} />
      <AddSourceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSource}
      />
      {/* 自动爬取提示 */}
      {isAutoCrawling && (
        <div className="fixed bottom-4 right-4 bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>正在获取新信源数据...</span>
        </div>
      )}
    </>
  )
}

/**
 * 旧版瀑布流布局（保留备用）
 */
export function OverseasBrowseSectionLegacy() {
  const [selectedItem, setSelectedItem] = useState<OverseasItem | null>(null)
  
  const {
    filteredItems,
    isLoading,
    isCrawling,
    error,
    selectedPlatform,
    searchTerm,
    sortOrder,
    setSelectedPlatform,
    setSearchTerm,
    setSortOrder,
    crawl,
  } = useOverseasData()

  const handleSelect = (item: OverseasItem) => {
    setSelectedItem(prev => prev?.id === item.id ? null : item)
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧卡片列表 */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        selectedItem ? 'mr-0' : ''
      }`}>
        <Toolbar
          selectedPlatform={selectedPlatform}
          searchTerm={searchTerm}
          sortOrder={sortOrder}
          isCrawling={isCrawling}
          resultCount={filteredItems.length}
          onPlatformChange={setSelectedPlatform}
          onSearchChange={setSearchTerm}
          onSortChange={setSortOrder}
          onCrawl={crawl}
        />

        {/* 卡片列表区域 */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 bg-gray-50/50">
          {isLoading ? (
            <LoadingState />
          ) : error && filteredItems.length === 0 ? (
            <EmptyState type="no-data" isCrawling={isCrawling} onCrawl={crawl} />
          ) : filteredItems.length > 0 ? (
            <CardGrid 
              items={filteredItems} 
              selectedId={selectedItem?.id || null}
              onSelect={handleSelect}
            />
          ) : (
            <EmptyState type="no-results" isCrawling={isCrawling} onCrawl={crawl} />
          )}
        </div>
      </div>

      {/* 右侧详情面板 */}
      {selectedItem && (
        <div className="w-[520px] flex-shrink-0 border-l border-gray-200 bg-white overflow-hidden">
          {selectedItem.platform === 'twitter' ? (
            <TwitterDetailPanel 
              item={selectedItem as TwitterItem} 
              onClose={() => setSelectedItem(null)}
            />
          ) : (
            <YouTubeDetailPanel 
              item={selectedItem as YouTubeItem} 
              onClose={() => setSelectedItem(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}
