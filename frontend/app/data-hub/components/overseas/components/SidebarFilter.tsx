'use client'

/**
 * 左侧平台筛选栏组件
 */

import React from 'react'
import { Globe, Youtube, Twitter } from 'lucide-react'
import type { OverseasPlatform } from '../types'

interface SidebarFilterProps {
  selectedPlatforms: OverseasPlatform[]
  onPlatformsChange: (platforms: OverseasPlatform[]) => void
}

const PLATFORMS = [
  { id: 'all' as OverseasPlatform, label: '全部', icon: Globe },
  { id: 'youtube' as OverseasPlatform, label: 'YouTube', icon: Youtube },
  { id: 'twitter' as OverseasPlatform, label: 'X (Twitter)', icon: Twitter },
]

export function SidebarFilter({
  selectedPlatforms,
  onPlatformsChange,
}: SidebarFilterProps) {
  const handleClick = (platformId: OverseasPlatform) => {
    if (platformId === 'all') {
      // 点击"全部"时清空选择（即选中全部）
      onPlatformsChange([])
    } else {
      // 多选逻辑
      if (selectedPlatforms.includes(platformId)) {
        onPlatformsChange(selectedPlatforms.filter(p => p !== platformId))
      } else {
        onPlatformsChange([...selectedPlatforms.filter(p => p !== 'all'), platformId])
      }
    }
  }

  const isAllSelected = selectedPlatforms.length === 0

  return (
    <div className="w-44 flex-shrink-0 bg-white flex flex-col border-r border-gray-100">
      <div className="p-3">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-2">
          信源渠道
        </h3>
        <div className="space-y-0.5">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon
            const isSelected = platform.id === 'all' 
              ? isAllSelected 
              : selectedPlatforms.includes(platform.id)
            return (
              <button
                key={platform.id}
                onClick={() => handleClick(platform.id)}
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

