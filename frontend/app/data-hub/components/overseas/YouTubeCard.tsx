'use client'

import { Play, Youtube, Calendar } from 'lucide-react'
import type { YouTubeItem } from './types'
import { formatTime } from './utils'

interface YouTubeCardProps {
  item: YouTubeItem
  isSelected: boolean
  onClick: () => void
}

export function YouTubeCard({ item, isSelected, onClick }: YouTubeCardProps) {
  const thumbnail = item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`
  const publishTime = item.published_at || item.scraped_at
  
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-xl overflow-hidden cursor-pointer h-fit
        transition-all hover:shadow-lg border
        ${isSelected 
          ? 'border-red-500 ring-2 ring-red-500/20 shadow-lg' 
          : 'border-gray-200 hover:border-red-300'
        }
      `}
    >
      {/* 缩略图 */}
      <div className="relative aspect-video bg-gray-100">
        <img 
          src={thumbnail} 
          alt={item.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
            <Play className="h-6 w-6 text-white ml-1" />
          </div>
        </div>
        {/* 平台标识 */}
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
          <Youtube className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
      
      {/* 视频信息 */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{item.title}</h3>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span className="truncate">{item.source_name}</span>
          <span className="flex items-center gap-1 flex-shrink-0 ml-2">
            <Calendar className="h-3 w-3" />
            {formatTime(publishTime)}
          </span>
        </div>
        {item.views && (
          <div className="text-xs text-gray-400 mt-1">{item.views}</div>
        )}
      </div>
    </div>
  )
}

