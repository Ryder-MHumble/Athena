'use client'

import { useState } from 'react'
import { Loader2, Youtube, ExternalLink, X, Calendar, Eye } from 'lucide-react'
import type { TwitterItem, YouTubeItem } from './types'
import { formatTime } from './utils'

interface TwitterDetailPanelProps {
  item: TwitterItem
  onClose: () => void
}

export function TwitterDetailPanel({ item, onClose }: TwitterDetailPanelProps) {
  const [loading, setLoading] = useState(true)
  
  const embedUrl = `https://platform.twitter.com/embed/Tweet.html?dnt=true&frame=false&hideCard=false&hideThread=false&id=${item.id}&lang=zh-cn&theme=light`

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center overflow-hidden">
            <img src="/X-logo.png" alt="X" className="w-4 h-4 object-contain" />
          </div>
          <span className="font-medium text-gray-900">推文详情</span>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-sky-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* iframe 容器 - 支持滚动但隐藏滚动条 */}
      <div 
        className="flex-1 overflow-y-scroll [&::-webkit-scrollbar]:hidden"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
        }}
      >
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        )}
        <iframe
          src={embedUrl}
          title="X Post"
          scrolling="no"
          frameBorder="0"
          allowTransparency={true}
          allowFullScreen={true}
          className="w-full border-0"
          style={{ 
            display: loading ? 'none' : 'block',
            height: '100vh',
            minHeight: '100%'
          }}
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  )
}

interface YouTubeDetailPanelProps {
  item: YouTubeItem
  onClose: () => void
}

export function YouTubeDetailPanel({ item, onClose }: YouTubeDetailPanelProps) {
  const publishTime = item.published_at || item.scraped_at
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
            <Youtube className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-medium text-gray-900">视频详情</span>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* 视频内容 */}
      <div className="flex-1 flex flex-col">
        <div className="p-4">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${item.id}?autoplay=1`}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full rounded-lg"
            />
          </div>
        </div>
        
        <div className="px-4 pb-4">
          <h2 className="font-semibold text-gray-900 text-lg leading-tight">{item.title}</h2>
          <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{item.source_name}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatTime(publishTime)}
            </span>
            {item.views && (
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {item.views}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

