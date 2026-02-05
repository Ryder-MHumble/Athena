'use client'

/**
 * 时间线视图组件
 * 优雅的垂直时间轴布局,按天分组显示内容
 */

import { Clock } from 'lucide-react'
import { groupItemsByDay } from '../utils'
import { TimelineDayGroup } from './TimelineDayGroup'
import type { OverseasItem } from '../types'

interface TimelineViewProps {
  items: OverseasItem[]
  selectedId: string | null
  onSelect: (item: OverseasItem) => void
}

export function TimelineView({ items, selectedId, onSelect }: TimelineViewProps) {
  const groups = groupItemsByDay(items)

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-cyan-400" />
        </div>
        <p className="text-gray-400 text-sm">暂无时间线数据</p>
      </div>
    )
  }

  return (
    <div className="relative max-w-6xl mx-auto px-6 py-6">
      {/* 日期分组 */}
      <div className="space-y-8">
        {groups.map((group, index) => (
          <TimelineDayGroup
            key={group.date}
            group={group}
            selectedId={selectedId}
            onSelect={onSelect}
            isFirst={index === 0}
          />
        ))}
      </div>

      {/* 底部统计 */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          已显示全部 {items.length} 条内容
        </p>
      </div>
    </div>
  )
}
