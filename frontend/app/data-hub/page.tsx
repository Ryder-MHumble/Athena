'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Settings2 } from 'lucide-react'
import { CrawlerUrlSection, SocialCrawlerSection, DataBrowseSection, ViewMode, CrawlerMode } from './components'

export default function DataHubPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [crawlerMode, setCrawlerMode] = useState<CrawlerMode>('url')

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b border-slate-200/60 px-4 sm:px-6 py-3 bg-white z-20">
        <div className="flex items-center gap-2">
          {/* 主模式切换 */}
          <Button 
            variant={viewMode === 'cards' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('cards')}
            className={viewMode === 'cards' 
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            数据浏览
          </Button>
          <Button 
            variant={viewMode === 'crawler' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('crawler')}
            className={viewMode === 'crawler' 
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }
          >
            <Settings2 className="h-4 w-4 mr-2" />
            爬虫配置
          </Button>
          
          {/* 爬虫子模式切换 */}
          {viewMode === 'crawler' && (
            <>
              <div className="w-px h-6 bg-gray-200 mx-2" />
              <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
                <button 
                  onClick={() => setCrawlerMode('url')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    crawlerMode === 'url' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                  }`}
                >
                  URL 爬取
                </button>
                <button 
                  onClick={() => setCrawlerMode('social')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    crawlerMode === 'social' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                  }`}
                >
                  国内社媒
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      {viewMode === 'cards' ? (
        <DataBrowseSection />
      ) : (
        crawlerMode === 'url' ? <CrawlerUrlSection /> : <SocialCrawlerSection />
      )}
    </div>
  )
}
