'use client'

/**
 * 时间线日期分组组件
 * 显示单日的所有内容,支持折叠/展开和优雅的单列布局
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { TwitterCard } from '../TwitterCard'
import { YouTubeCard } from '../YouTubeCard'
import type { TimelineGroup, OverseasItem, TwitterItem, YouTubeItem } from '../types'

interface TimelineDayGroupProps {
  group: TimelineGroup
  selectedId: string | null
  onSelect: (item: OverseasItem) => void
  isFirst: boolean
}

export function TimelineDayGroup({ group, selectedId, onSelect, isFirst }: TimelineDayGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="relative group/day flex gap-6">
      {/* 左侧：日期信息和折叠按钮（固定宽度，sticky定位） */}
      <div className="w-44 flex-shrink-0">
        <div className={`sticky top-4 ${isFirst ? '' : 'pt-2'}`}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left bg-white rounded-xl px-4 py-3 border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-cyan-600" />
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-cyan-600 transition-colors ml-auto" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-cyan-600 transition-colors ml-auto" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {group.displayDate}
            </h3>
            <p className="text-xs text-gray-500">
              {group.count} 条内容
            </p>
            <div className="mt-2">
              <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
                {isExpanded ? '已展开' : '已折叠'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 右侧：时间轴和内容卡片 */}
      <div className="flex-1 min-w-0">
        {/* 内容卡片 */}
        {isExpanded && (
          <div className="space-y-4 pb-6">
            {group.items.map((item, index) => {
              const isSelected = selectedId === item.id
              const isLast = index === group.items.length - 1

              return (
                <div key={item.id} className="relative flex items-start gap-4">
                  {/* 时间轴线和连接节点 */}
                  <div className="relative flex flex-col items-center w-8 flex-shrink-0">
                    {/* 连接线 */}
                    {!isLast && (
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-cyan-200 to-transparent" />
                    )}
                    {/* 小圆点 */}
                    <div className="relative z-10 w-2 h-2 bg-cyan-300 rounded-full mt-6 shadow-sm" />
                  </div>

                  {/* 卡片内容 */}
                  <div className="flex-1 min-w-0">
                    {item.platform === 'twitter' ? (
                      <TwitterCard
                        item={item as TwitterItem}
                        isSelected={isSelected}
                        onClick={() => onSelect(item)}
                      />
                    ) : (
                      <YouTubeCard
                        item={item as YouTubeItem}
                        isSelected={isSelected}
                        onClick={() => onSelect(item)}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 折叠状态的提示 */}
        {!isExpanded && (
          <div className="flex items-start gap-4 pb-6">
            <div className="w-8 flex-shrink-0" />
            <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 border-dashed">
              <p className="text-sm text-gray-500 text-center">
                {group.count} 条内容已折叠，点击左侧展开查看
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
