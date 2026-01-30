'use client'

import { Heart, MessageCircle, Repeat2, Eye, Clock } from 'lucide-react'
import type { TwitterItem } from './types'
import { formatTime, formatNumber } from './utils'
import { DEFAULT_AVATAR, TEXT_MAX_LINES } from './constants'

interface TwitterCardProps {
  item: TwitterItem
  isSelected: boolean
  onClick: () => void
}

export function TwitterCard({ item, isSelected, onClick }: TwitterCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-xl p-4 cursor-pointer h-fit
        transition-all hover:shadow-lg border overflow-hidden
        ${isSelected 
          ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-lg' 
          : 'border-gray-200 hover:border-sky-300'
        }
      `}
    >
      {/* 作者信息 */}
      <div className="flex items-start gap-3">
        <img 
          src={item.author.avatar} 
          alt={item.author.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_AVATAR
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-900 truncate max-w-[120px]">
              {item.author.name}
            </span>
            {item.author.verified && (
              <span className="text-sky-500 text-xs flex-shrink-0">✓</span>
            )}
            <span className="text-gray-400 text-sm truncate">@{item.author.username}</span>
          </div>
        </div>
      </div>
      
      {/* 推文内容 - 限制最大行数 */}
      <p 
        className="text-gray-700 text-sm mt-3 whitespace-pre-wrap break-words overflow-hidden"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: TEXT_MAX_LINES,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {item.text}
      </p>
      
      {/* 媒体预览 - 限制高度 */}
      {item.media && item.media.length > 0 && item.media[0].url && (
        <div className="mt-3 rounded-lg overflow-hidden bg-gray-100 max-h-48">
          <img 
            src={item.media[0].url} 
            alt="Media"
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}
      
      {/* 统计数据和时间 */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-gray-500 text-xs">
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {formatNumber(item.stats.replies)}
        </span>
        <span className="flex items-center gap-1">
          <Repeat2 className="h-3.5 w-3.5" />
          {formatNumber(item.stats.retweets)}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" />
          {formatNumber(item.stats.likes)}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {formatNumber(item.stats.views)}
        </span>
        <span className="flex items-center gap-1 ml-auto text-gray-400">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(item.created_at)}
        </span>
      </div>
    </div>
  )
}

