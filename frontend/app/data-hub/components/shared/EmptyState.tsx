'use client'

/**
 * 空状态组件
 */

import React from 'react'
import { Globe, Search, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  type: 'no-data' | 'no-results'
  isCrawling: boolean
  onCrawl: () => void
}

export function EmptyState({ type, isCrawling, onCrawl }: EmptyStateProps) {
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
      <p className="text-sm mt-1">尝试更换搜索关键词或调整筛选条件</p>
    </div>
  )
}
