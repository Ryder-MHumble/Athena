'use client'

import { useState, useRef, useEffect } from 'react'
import { Heart, MessageCircle, Repeat2, Eye, Clock, Languages, Loader2, Sparkles, ChevronUp } from 'lucide-react'
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
  const [isTextExpanded, setIsTextExpanded] = useState(false)
  const [isTextClamped, setIsTextClamped] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
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
  const hasMedia = item.media && item.media.length > 0 && item.media[0].url

  // 检测文本是否被截断
  useEffect(() => {
    if (textRef.current && !isTextExpanded) {
      const isClamped = textRef.current.scrollHeight > textRef.current.clientHeight
      setIsTextClamped(isClamped)
    }
  }, [displayText, isTextExpanded])

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
          {/* 头部：头像、作者、时间、翻译按钮 */}
          <div className="flex items-center gap-2 mb-2">
            <img 
              src={item.author.avatar} 
              alt={item.author.name}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR
              }}
            />
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-medium text-gray-900 text-sm truncate">
                {item.author.name}
              </span>
              {item.author.verified && (
                <span className="text-sky-500 text-xs flex-shrink-0">✓</span>
              )}
              <span className="text-gray-400 text-xs truncate">@{item.author.username}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
              <Clock className="h-3 w-3" />
              <span>{formatTime(item.created_at)}</span>
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
          <div className="relative">
            <p
              ref={textRef}
              className={`text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                isTextExpanded ? '' : 'line-clamp-3'
              }`}
            >
              {displayText}
            </p>
            {isTextClamped && !isTextExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsTextExpanded(true)
                }}
                className="text-cyan-600 hover:text-cyan-700 text-xs font-medium mt-1 flex items-center gap-1"
              >
                展开全文
              </button>
            )}
            {isTextExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsTextExpanded(false)
                }}
                className="text-cyan-600 hover:text-cyan-700 text-xs font-medium mt-1 flex items-center gap-1"
              >
                收起 <ChevronUp className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* 引用推文 */}
          {item.quoted_tweet && (
            <div
              className="mt-2 ml-2 p-3 border border-gray-200 rounded-lg bg-gray-50/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <img
                  src={item.quoted_tweet.author.avatar}
                  alt={item.quoted_tweet.author.name}
                  className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR
                  }}
                />
                <span className="font-medium text-gray-800 text-xs truncate">
                  {item.quoted_tweet.author.name}
                </span>
                {item.quoted_tweet.author.verified && (
                  <span className="text-sky-500 text-[10px] flex-shrink-0">✓</span>
                )}
                <span className="text-gray-400 text-[11px] truncate">
                  @{item.quoted_tweet.author.username}
                </span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed line-clamp-3 whitespace-pre-wrap break-words">
                {item.quoted_tweet.text}
              </p>
              {item.quoted_tweet.media && item.quoted_tweet.media.length > 0 && item.quoted_tweet.media[0].url && (
                <img
                  src={item.quoted_tweet.media[0].url}
                  alt="Quoted media"
                  className="mt-2 rounded-md max-h-32 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <div className="flex items-center gap-3 mt-1.5 text-gray-400 text-[11px]">
                <span className="flex items-center gap-0.5">
                  <Heart className="h-3 w-3" />
                  {formatNumber(item.quoted_tweet.stats.likes)}
                </span>
                <span className="flex items-center gap-0.5">
                  <Repeat2 className="h-3 w-3" />
                  {formatNumber(item.quoted_tweet.stats.retweets)}
                </span>
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {formatNumber(item.quoted_tweet.stats.views)}
                </span>
              </div>
            </div>
          )}

          {showTranslation && translatedText && (
            <span className="inline-block mt-1 text-xs text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">已翻译</span>
          )}
          
          {/* 统计数据 */}
          <div className="flex items-center gap-4 mt-2.5 text-gray-400 text-xs">
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
        
        {/* 右侧媒体预览（仅有媒体时显示） */}
        {hasMedia && (
          <div className="w-36 flex-shrink-0 bg-gray-100">
            <img 
              src={item.media![0].url} 
              alt="Media"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}
        
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
