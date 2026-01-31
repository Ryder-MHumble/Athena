'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Repeat2, Eye, Clock, Languages, Loader2, Sparkles } from 'lucide-react'
import type { TwitterItem } from './types'
import { formatTime, formatNumber } from './utils'
import { DEFAULT_AVATAR, API_BASE } from './constants'
import { useAppStore } from '@/stores/useAppStore'

interface TwitterCardProps {
  item: TwitterItem
  isSelected: boolean
  onClick: () => void
}

export function TwitterCard({ item, isSelected, onClick }: TwitterCardProps) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const apiKey = useAppStore((state) => state.apiKey)

  const handleTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (translatedText) {
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
          text: item.text,
          target_language: 'zh',
        }),
      })

      if (!response.ok) {
        throw new Error('翻译失败')
      }

      const result = await response.json()
      setTranslatedText(result.translated)
      setShowTranslation(true)
    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setIsTranslating(false)
    }
  }

  const displayText = showTranslation && translatedText ? translatedText : item.text
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
          {/* 头部：头像、作者、时间 */}
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
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-900 text-sm truncate">
                  {item.author.name}
                </span>
                {item.author.verified && (
                  <span className="text-sky-500 text-xs flex-shrink-0">✓</span>
                )}
                <span className="text-gray-400 text-xs">@{item.author.username}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                <Clock className="h-3 w-3" />
                <span>{formatTime(item.created_at)}</span>
              </div>
            </div>
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
          
          {/* 推文内容 */}
          <p className="text-gray-700 text-sm leading-relaxed mt-3 whitespace-pre-wrap break-words line-clamp-4">
            {displayText}
          </p>
          
          {showTranslation && translatedText && (
            <span className="inline-block mt-1 text-xs text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">已翻译</span>
          )}
          
          {/* 媒体预览 */}
          {item.media && item.media.length > 0 && item.media[0].url && (
            <div className="mt-3 rounded-lg overflow-hidden bg-gray-100 max-h-36">
              <img 
                src={item.media[0].url} 
                alt="Media"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}
          
          {/* 统计数据 */}
          <div className="flex items-center gap-4 mt-3 text-gray-400 text-xs">
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
          </div>
        </div>
        
        {/* 右侧 AI 摘要区 */}
        {summary && (
          <div className="w-64 flex-shrink-0 border-l border-gray-100 p-4 bg-slate-50/50">
            <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-600 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>精华速览</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-6">
              {summary}
            </p>
            
            {item.key_points && item.key_points.length > 0 && (
              <div className="mt-2.5">
                <div className="text-xs font-medium text-gray-500 mb-1">关键信息</div>
                <ul className="space-y-1">
                  {item.key_points.slice(0, 3).map((point, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-cyan-500 flex-shrink-0">{idx + 1}</span>
                      <span className="line-clamp-2">{point}</span>
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
