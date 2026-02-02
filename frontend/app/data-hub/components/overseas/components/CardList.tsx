'use client'

/**
 * 卡片列表组件
 */

import React from 'react'
import { TwitterCard } from '../TwitterCard'
import { YouTubeCard } from '../YouTubeCard'
import type { OverseasItem, TwitterItem, YouTubeItem } from '../types'

interface CardListProps {
  items: OverseasItem[]
  selectedId: string | null
  onSelect: (item: OverseasItem) => void
}

export function CardList({ items, selectedId, onSelect }: CardListProps) {
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

