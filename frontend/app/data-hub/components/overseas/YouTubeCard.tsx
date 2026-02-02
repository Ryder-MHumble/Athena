'use client'

import { useState } from 'react'
import { Play, Youtube, Clock, Languages, Loader2, Sparkles } from 'lucide-react'
import type { YouTubeItem } from './types'
import { formatTime } from './utils'
import { API_BASE } from './constants'
import { useAppStore } from '@/stores/useAppStore'

interface YouTubeCardProps {
  item: YouTubeItem
  isSelected: boolean
  onClick: () => void
}

export function YouTubeCard({ item, isSelected, onClick }: YouTubeCardProps) {
  const thumbnail = item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`
  const publishTime = item.published_at || item.scraped_at
  
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const apiKey = useAppStore((state) => state.apiKey)

  const handleTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (translatedTitle) {
      setShowTranslation(!showTranslation)
      return
    }

    setIsTranslating(true)
    try {
      const response = await fetch(`${API_BASE}/api/crawler/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey || '',
        },
        body: JSON.stringify({
          text: item.title,
          target_language: 'zh',
        }),
      })

      if (!response.ok) {
        throw new Error('翻译失败')
      }

      const result = await response.json()
      setTranslatedTitle(result.translated)
      setShowTranslation(true)
    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setIsTranslating(false)
    }
  }

  const displayTitle = showTranslation && translatedTitle ? translatedTitle : item.title
  const summary = item.summary || item.ai_summary

  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-lg cursor-pointer overflow-hidden
        transition-all hover:shadow-md
        ${isSelected 
          ? 'ring-2 ring-cyan-500 shadow-md' 
          : 'shadow-sm border border-gray-100'
        }
      `}
    >
      <div className="flex">
        {/* 主内容区 */}
        <div className="flex-1 p-4 min-w-0">
          {/* 时间和来源 */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Youtube className="h-3 w-3 text-red-500" />
            <Clock className="h-3 w-3" />
            <span>{formatTime(publishTime)}</span>
            <span className="text-gray-300">·</span>
            <span className="truncate">{item.source_name}</span>
          </div>
          
          {/* 视频标题 */}
          <div className="flex items-start gap-2">
            <h3 className="font-medium text-gray-900 text-sm flex-1 line-clamp-2 leading-snug">
              {displayTitle}
            </h3>
            {/* 翻译按钮 */}
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className={`
                p-1.5 rounded-lg transition-colors flex-shrink-0
                ${showTranslation 
                  ? 'bg-cyan-100 text-cyan-600' 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                }
              `}
              title={showTranslation ? '显示原文' : '翻译为中文'}
            >
              {isTranslating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Languages className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {showTranslation && translatedTitle && (
            <span className="inline-block mt-1 text-xs text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">已翻译</span>
          )}
          
          {/* 视频描述 */}
          {item.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-2">
              {item.description}
            </p>
          )}
          
          {/* 观看数 */}
          {item.views && (
            <div className="text-xs text-gray-400 mt-2">{item.views}</div>
          )}
        </div>
        
        {/* 右侧缩略图 */}
        <div className="relative w-44 flex-shrink-0 bg-gray-100 group">
          <img 
            src={thumbnail} 
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
              <Play className="h-5 w-5 text-white ml-0.5" />
            </div>
          </div>
        </div>
        
        {/* 右侧 AI 摘要区 */}
        {summary && (
          <div className="w-56 flex-shrink-0 border-l border-gray-100 p-3 bg-slate-50/50">
            <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-600 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>精华速览</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
              {summary}
            </p>
            
            {item.key_points && item.key_points.length > 0 && (
              <div className="mt-2">
                <ul className="space-y-1">
                  {item.key_points.slice(0, 2).map((point, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-cyan-500 flex-shrink-0">{idx + 1}</span>
                      <span className="line-clamp-1">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
