'use client'

/**
 * 数据中心新布局视图
 * 左侧渠道筛选 + 中间卡片列表（按时间统一排序）
 */

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2, Globe, RefreshCw, Plus, Youtube, Twitter, Calendar, ChevronDown, User, X } from 'lucide-react'
import { TwitterCard } from './TwitterCard'
import { YouTubeCard } from './YouTubeCard'
import { TwitterDetailPanel, YouTubeDetailPanel } from './DetailPanels'
import { useOverseasData } from './useOverseasData'
import type { OverseasItem, TwitterItem, YouTubeItem, OverseasPlatform } from './types'
import { SORT_OPTIONS } from './constants'

interface SourceAccount {
  name: string
  platform: 'twitter' | 'youtube'
}

/**
 * 左侧筛选栏 - 只保留信源渠道筛选
 */
function SidebarFilter({
  selectedPlatform,
  onPlatformChange,
}: {
  selectedPlatform: OverseasPlatform
  onPlatformChange: (platform: OverseasPlatform) => void
}) {
  const platforms = [
    { id: 'all' as OverseasPlatform, label: '全部', icon: Globe },
    { id: 'youtube' as OverseasPlatform, label: 'YouTube', icon: Youtube },
    { id: 'twitter' as OverseasPlatform, label: 'X (Twitter)', icon: Twitter },
  ]

  return (
    <div className="w-44 flex-shrink-0 bg-white flex flex-col border-r border-gray-100">
      {/* 信源渠道筛选 */}
      <div className="p-3">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-2">信源渠道</h3>
        <div className="space-y-0.5">
          {platforms.map((platform) => {
            const Icon = platform.icon
            const isSelected = selectedPlatform === platform.id
            return (
              <button
                key={platform.id}
                onClick={() => onPlatformChange(platform.id)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                  transition-all text-left
                  ${isSelected 
                    ? 'bg-cyan-50 text-cyan-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`h-4 w-4 ${isSelected ? 'text-cyan-600' : 'text-gray-400'}`} />
                <span>{platform.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * 账号筛选下拉菜单 - 支持多选、搜索、根据平台过滤
 */
function AccountFilterDropdown({
  accounts,
  selectedAccounts,
  selectedPlatform,
  onAccountsChange,
}: {
  accounts: SourceAccount[]
  selectedAccounts: string[]
  selectedPlatform: 'all' | 'twitter' | 'youtube'
  onAccountsChange: (accounts: string[]) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // 根据平台过滤账号列表
  const filteredByPlatform = selectedPlatform === 'all' 
    ? accounts 
    : accounts.filter(a => a.platform === selectedPlatform)
  
  // 根据搜索词过滤
  const filteredAccounts = searchTerm 
    ? filteredByPlatform.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : filteredByPlatform

  // 显示文本
  const displayText = selectedAccounts.length === 0 
    ? '全部账号' 
    : selectedAccounts.length === 1 
      ? selectedAccounts[0]
      : `已选 ${selectedAccounts.length} 个账号`

  // 切换单个账号选中状态
  const toggleAccount = (accountName: string) => {
    if (selectedAccounts.includes(accountName)) {
      onAccountsChange(selectedAccounts.filter(a => a !== accountName))
    } else {
      onAccountsChange([...selectedAccounts, accountName])
    }
  }

  // 全选当前过滤列表
  const selectAll = () => {
    const allNames = filteredAccounts.map(a => a.name)
    onAccountsChange(allNames)
  }

  // 清空选择
  const clearAll = () => {
    onAccountsChange([])
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-4 rounded-lg border border-gray-200 bg-white flex items-center gap-2 hover:border-gray-300 transition-colors shadow-sm min-w-[180px]"
      >
        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="text-gray-700 truncate text-sm font-medium">{displayText}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ml-auto ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 z-20 w-[280px] overflow-hidden">
            {/* 搜索框 */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索账号名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            {/* 快捷操作 */}
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
              >
                全选
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                清空
              </button>
              <span className="ml-auto text-xs text-gray-400">
                {filteredAccounts.length} 个账号
              </span>
            </div>
            
            {/* 账号列表 */}
            <div className="max-h-[320px] overflow-y-auto py-1">
              {filteredAccounts.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                  {searchTerm ? '未找到匹配的账号' : '暂无账号'}
                </div>
              ) : (
                filteredAccounts.map((account) => {
                  const isSelected = selectedAccounts.includes(account.name)
                  return (
                    <button
                      key={account.name}
                      onClick={() => toggleAccount(account.name)}
                      className={`
                        w-full px-4 py-2.5 text-left transition-colors flex items-center gap-3
                        ${isSelected ? 'bg-cyan-50' : 'hover:bg-gray-50'}
                      `}
                    >
                      {/* 复选框 */}
                      <div className={`
                        w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                        ${isSelected ? 'bg-cyan-600 border-cyan-600' : 'border-gray-300'}
                      `}>
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      
                      {/* 平台图标 */}
                      {account.platform === 'twitter' ? (
                        <Twitter className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <Youtube className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      
                      {/* 账号名称 */}
                      <span className={`truncate text-sm ${isSelected ? 'text-cyan-700 font-medium' : 'text-gray-700'}`}>
                        {account.name}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * 时间筛选下拉菜单
 */
function DateFilterDropdown({
  dateRange,
  onDateRangeChange,
}: {
  dateRange: { start: string | null; end: string | null }
  onDateRangeChange: (range: { start: string | null; end: string | null }) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  const datePresets = [
    { label: '全部时间', value: { start: null, end: null } },
    { label: '今天', value: { start: 'today', end: 'today' } },
    { label: '近 3 天', value: { start: '3days', end: null } },
    { label: '近 7 天', value: { start: '7days', end: null } },
    { label: '近 30 天', value: { start: '30days', end: null } },
  ]

  const getActiveLabel = () => {
    if (!dateRange.start && !dateRange.end) return '全部时间'
    if (dateRange.start === 'today') return '今天'
    if (dateRange.start === '3days') return '近 3 天'
    if (dateRange.start === '7days') return '近 7 天'
    if (dateRange.start === '30days') return '近 30 天'
    return '自定义'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white flex items-center gap-2 hover:border-gray-300 transition-colors shadow-sm"
      >
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-gray-700">{getActiveLabel()}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[180px]">
            {datePresets.map((preset) => {
              const isActive = getActiveLabel() === preset.label
              return (
                <button
                  key={preset.label}
                  onClick={() => {
                    onDateRangeChange(preset.value)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full px-3 py-2 text-sm text-left transition-colors
                    ${isActive ? 'bg-cyan-50 text-cyan-700' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  {preset.label}
                </button>
              )
            })}
            
            {/* 自定义日期 */}
            <div className="border-t border-gray-100 p-3 mt-1">
              <div className="text-xs text-gray-500 mb-2">自定义范围</div>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateRange.start && !['today', '3days', '7days', '30days'].includes(dateRange.start) ? dateRange.start : ''}
                  onChange={(e) => {
                    onDateRangeChange({ ...dateRange, start: e.target.value || null })
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  placeholder="开始日期"
                />
                <input
                  type="date"
                  value={dateRange.end && dateRange.end !== 'today' ? dateRange.end : ''}
                  onChange={(e) => {
                    onDateRangeChange({ ...dateRange, end: e.target.value || null })
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  placeholder="结束日期"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * 顶部工具栏 - 包含时间筛选、账号筛选、新增信源
 */
function TopToolbar({
  searchTerm,
  sortOrder,
  isCrawling,
  resultCount,
  dateRange,
  accounts,
  selectedAccounts,
  selectedPlatform,
  onSearchChange,
  onSortChange,
  onCrawl,
  onDateRangeChange,
  onAccountsChange,
  onAddSource,
}: {
  searchTerm: string
  sortOrder: string
  isCrawling: boolean
  resultCount: number
  dateRange: { start: string | null; end: string | null }
  accounts: SourceAccount[]
  selectedAccounts: string[]
  selectedPlatform: 'all' | 'twitter' | 'youtube'
  onSearchChange: (term: string) => void
  onSortChange: (order: any) => void
  onCrawl: () => void
  onDateRangeChange: (range: { start: string | null; end: string | null }) => void
  onAccountsChange: (accounts: string[]) => void
  onAddSource: () => void
}) {
  return (
    <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-100">
      <div className="flex items-center gap-2">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索账号名、内容或标题..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200 focus:border-cyan-500 focus:bg-white"
          />
        </div>
        
        {searchTerm && (
          <span className="text-sm text-gray-500 whitespace-nowrap">
            找到 <span className="font-medium text-cyan-600">{resultCount}</span> 条
          </span>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* 账号筛选 */}
          <AccountFilterDropdown
            accounts={accounts}
            selectedAccounts={selectedAccounts}
            selectedPlatform={selectedPlatform}
            onAccountsChange={onAccountsChange}
          />
          
          {/* 时间筛选 */}
          <DateFilterDropdown
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
          />
          
          {/* 排序 */}
          <select
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-9 px-3 pr-8 rounded-lg border border-gray-200 text-sm bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-sm"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          
          {/* 新增信源按钮 */}
          <Button
            onClick={onAddSource}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>新增信源</span>
          </Button>
          
          {/* 刷新按钮 */}
          <Button
            onClick={onCrawl}
            disabled={isCrawling}
            size="sm"
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isCrawling ? 'animate-spin' : ''}`} />
            <span>{isCrawling ? '爬取中...' : '重新爬取'}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * 卡片列表
 */
function CardList({
  items,
  selectedId,
  onSelect,
}: {
  items: OverseasItem[]
  selectedId: string | null
  onSelect: (item: OverseasItem) => void
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id}>
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
 * 空状态
 */
function EmptyState({
  type,
  isCrawling,
  onCrawl,
}: {
  type: 'no-data' | 'no-results'
  isCrawling: boolean
  onCrawl: () => void
}) {
  if (type === 'no-data') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Globe className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-base font-medium">暂无数据</p>
        <p className="text-sm mt-1">点击下方按钮开始获取海外信源</p>
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
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Search className="h-12 w-12 mb-3 opacity-50" />
      <p className="text-base font-medium">未找到匹配的内容</p>
      <p className="text-sm mt-1">尝试更换搜索关键词</p>
    </div>
  )
}

/**
 * 加载状态
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">加载中...</p>
      </div>
    </div>
  )
}

/**
 * 根据日期范围过滤数据
 */
function filterByDateRange(
  items: OverseasItem[],
  dateRange: { start: string | null; end: string | null }
): OverseasItem[] {
  if (!dateRange.start && !dateRange.end) return items
  
  const now = new Date()
  let startDate: Date | null = null
  let endDate: Date | null = null
  
  if (dateRange.start === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  } else if (dateRange.start === '3days') {
    startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  } else if (dateRange.start === '7days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (dateRange.start === '30days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  } else if (dateRange.start) {
    startDate = new Date(dateRange.start)
  }
  
  if (dateRange.end && dateRange.end !== 'today') {
    endDate = new Date(dateRange.end)
    endDate.setHours(23, 59, 59)
  }
  
  return items.filter(item => {
    const dateStr = item.platform === 'twitter' 
      ? (item as TwitterItem).created_at 
      : ((item as YouTubeItem).published_at || (item as YouTubeItem).scraped_at)
    const itemDate = new Date(dateStr)
    if (startDate && itemDate < startDate) return false
    if (endDate && itemDate > endDate) return false
    return true
  })
}

/**
 * 新布局主组件
 */
export function NewLayoutView({
  onAddSource,
}: {
  onAddSource: () => void
}) {
  const [selectedItem, setSelectedItem] = useState<OverseasItem | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  })

  const {
    filteredItems: baseFilteredItems,
    sourceAccounts,
    isLoading,
    isCrawling,
    error,
    selectedPlatform,
    selectedAccounts,
    searchTerm,
    sortOrder,
    setSelectedPlatform,
    setSelectedAccounts,
    setSearchTerm,
    setSortOrder,
    crawl,
  } = useOverseasData()

  const filteredItems = filterByDateRange(baseFilteredItems, dateRange)

  const handleSelect = (item: OverseasItem) => {
    setSelectedItem((prev) => (prev?.id === item.id ? null : item))
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-gray-50">
      {/* 左侧筛选栏 */}
      <SidebarFilter
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
      />

      {/* 中间内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopToolbar
          searchTerm={searchTerm}
          sortOrder={sortOrder}
          isCrawling={isCrawling}
          resultCount={filteredItems.length}
          dateRange={dateRange}
          accounts={sourceAccounts}
          selectedAccounts={selectedAccounts}
          selectedPlatform={selectedPlatform}
          onSearchChange={setSearchTerm}
          onSortChange={setSortOrder}
          onCrawl={crawl}
          onDateRangeChange={setDateRange}
          onAccountsChange={setSelectedAccounts}
          onAddSource={onAddSource}
        />

        {/* 卡片列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <LoadingState />
          ) : error && filteredItems.length === 0 ? (
            <EmptyState type="no-data" isCrawling={isCrawling} onCrawl={crawl} />
          ) : filteredItems.length > 0 ? (
            <CardList
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
        <div className="w-[420px] flex-shrink-0 border-l border-gray-200 bg-white overflow-hidden">
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
