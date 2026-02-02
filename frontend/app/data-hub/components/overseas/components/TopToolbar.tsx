'use client'

/**
 * 顶部工具栏组件
 */

import React, { useState } from 'react'
import { Search, RefreshCw, Plus, ChevronDown, User, X, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SORT_OPTIONS } from '../constants'
import { UnifiedFilterPanel } from './UnifiedFilterPanel'
import type { TopToolbarProps } from './types'

export function TopToolbar({
  searchTerm,
  sortOrder,
  isCrawling,
  resultCount,
  dateRange,
  accounts,
  selectedAccounts,
  selectedPlatforms,
  onSearchChange,
  onSortChange,
  onCrawl,
  onDateRangeChange,
  onAccountsChange,
  onPlatformsChange,
  onAddSource,
}: TopToolbarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // 计算激活的筛选数量
  const activeFilterCount = [
    selectedAccounts.length > 0,
    selectedPlatforms.length > 0,
    dateRange.start !== null || dateRange.end !== null,
    sortOrder !== 'newest'
  ].filter(Boolean).length

  return (
    <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-100">
      <div className="flex items-center gap-3">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索内容或账号..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200 focus:border-cyan-500 focus:bg-white h-10"
          />
        </div>
        
        {searchTerm && (
          <span className="text-sm text-gray-500 whitespace-nowrap">
            找到 <span className="font-medium text-cyan-600">{resultCount}</span> 条
          </span>
        )}

        {/* 统一筛选按钮 */}
        <div className="relative ml-auto">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`h-10 px-4 rounded-lg border text-sm font-medium flex items-center gap-2 transition-all ${
              activeFilterCount > 0 || isFilterOpen
                ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>筛选</span>
            {activeFilterCount > 0 && (
              <span className="bg-cyan-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          <UnifiedFilterPanel
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            accounts={accounts}
            selectedAccounts={selectedAccounts}
            selectedPlatforms={selectedPlatforms}
            dateRange={dateRange}
            sortOrder={sortOrder}
            onAccountsChange={onAccountsChange}
            onPlatformsChange={onPlatformsChange}
            onDateRangeChange={onDateRangeChange}
            onSortChange={onSortChange}
          />
        </div>

        {/* 当前筛选状态快捷显示 */}
        {(selectedAccounts.length > 0 || selectedPlatforms.length > 0) && (
          <div className="flex items-center gap-2">
            {selectedPlatforms.length > 0 && (
              <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 flex items-center gap-1.5">
                {selectedPlatforms.length} 个渠道
                <button 
                  onClick={() => onPlatformsChange([])}
                  className="hover:text-gray-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedAccounts.length > 0 && (
              <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {selectedAccounts.length} 个账号
                <button 
                  onClick={() => onAccountsChange([])}
                  className="hover:text-gray-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* 新增信源按钮 */}
        <Button
          onClick={onAddSource}
          variant="outline"
          size="sm"
          className="h-10 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>新增信源</span>
        </Button>
        
        {/* 刷新按钮 */}
        <Button
          onClick={onCrawl}
          disabled={isCrawling}
          size="sm"
          className="h-10 flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <RefreshCw className={`h-4 w-4 ${isCrawling ? 'animate-spin' : ''}`} />
          <span>{isCrawling ? '爬取中...' : '刷新'}</span>
        </Button>
      </div>
    </div>
  )
}

