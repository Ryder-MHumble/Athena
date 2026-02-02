'use client'

/**
 * 数据中心新布局视图
 * 左侧渠道筛选 + 中间卡片列表（按时间统一排序）
 */

import React, { useState } from 'react'
import { TwitterDetailPanel, YouTubeDetailPanel } from './DetailPanels'
import { useOverseasData } from './useOverseasData'
import { filterByDateRange } from './utils'
import type { OverseasItem, TwitterItem, YouTubeItem } from './types'
import type { DateRange } from './components/types'

// 导入拆分后的组件
import {
  SidebarFilter,
  TopToolbar,
  CardList,
  EmptyState,
  LoadingState,
} from './components'

/**
 * 新布局主组件
 */
export function NewLayoutView({
  onAddSource,
}: {
  onAddSource: () => void
}) {
  const [selectedItem, setSelectedItem] = useState<OverseasItem | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  })

  const {
    filteredItems: baseFilteredItems,
    sourceAccounts,
    isLoading,
    isCrawling,
    error,
    selectedPlatforms,
    selectedAccounts,
    searchTerm,
    sortOrder,
    setSelectedPlatforms,
    setSelectedAccounts,
    setSearchTerm,
    setSortOrder,
    crawl,
  } = useOverseasData()

  // 应用日期范围过滤
  const filteredItems = filterByDateRange(baseFilteredItems, dateRange)

  // 选择/取消选择卡片
  const handleSelect = (item: OverseasItem) => {
    setSelectedItem((prev) => (prev?.id === item.id ? null : item))
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-gray-50">
      {/* 左侧筛选栏 */}
      <SidebarFilter
        selectedPlatforms={selectedPlatforms}
        onPlatformsChange={setSelectedPlatforms}
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
          selectedPlatforms={selectedPlatforms}
          onSearchChange={setSearchTerm}
          onSortChange={setSortOrder}
          onCrawl={crawl}
          onDateRangeChange={setDateRange}
          onAccountsChange={setSelectedAccounts}
          onPlatformsChange={setSelectedPlatforms}
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
        <div className="w-[520px] flex-shrink-0 border-l border-gray-200 bg-white">
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
