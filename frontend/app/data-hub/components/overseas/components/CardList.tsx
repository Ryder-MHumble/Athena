'use client'

/**
 * 卡片列表组件
 * 支持列表和网格两种布局
 */

import React from 'react'
import { TwitterCard } from '../TwitterCard'
import { YouTubeCard } from '../YouTubeCard'
import { TimelineView } from './TimelineView'
import type { OverseasItem, TwitterItem, YouTubeItem } from '../types'

export type ViewLayout = 'list' | 'grid' | 'timeline'

interface CardListProps {
  items: OverseasItem[]
  selectedId: string | null
  onSelect: (item: OverseasItem) => void
  layout?: ViewLayout
}

export function CardList({ items, selectedId, onSelect, layout = 'grid' }: CardListProps) {
  // 时间线布局
  if (layout === 'timeline') {
    return <TimelineView items={items} selectedId={selectedId} onSelect={onSelect} />
  }

  // 列表布局 - 一行一行展示
  if (layout === 'list') {
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

  // 网格布局 - 响应式网格 (最大2列)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

