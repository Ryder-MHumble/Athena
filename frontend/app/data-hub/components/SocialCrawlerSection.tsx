'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Database, Play, History, Check } from 'lucide-react'
import { platforms } from './utils'

export function SocialCrawlerSection() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [keywords, setKeywords] = useState('')
  const [crawlCount, setCrawlCount] = useState(100)

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId) 
        : [...prev, platformId]
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 头部说明 */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/60">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center flex-shrink-0">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">社媒数据采集</h2>
              <p className="text-gray-600 text-sm">
                基于{' '}
                <a 
                  href="https://github.com/NanmiCoder/MediaCrawler" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:underline"
                >
                  MediaCrawler
                </a>
                {' '}开源项目，支持小红书、抖音、快手、B站、微博等平台的数据采集。
              </p>
            </div>
          </div>
        </Card>

        {/* 平台选择 */}
        <Card className="p-5 bg-white/80 backdrop-blur-sm border-gray-200/60">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">选择采集平台</h3>
          <div className="grid grid-cols-3 gap-2">
            {platforms.filter(p => p.id !== 'all').map((platform) => (
              <button 
                key={platform.id} 
                onClick={() => togglePlatform(platform.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm ${
                  selectedPlatforms.includes(platform.id) 
                    ? 'border-cyan-500 bg-cyan-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${platform.color}`}></span>
                <span className={selectedPlatforms.includes(platform.id) ? 'text-cyan-600 font-medium' : 'text-gray-700'}>
                  {platform.label}
                </span>
                {selectedPlatforms.includes(platform.id) && (
                  <Check className="h-4 w-4 text-cyan-500 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* 配置选项 */}
        <Card className="p-5 bg-white/80 backdrop-blur-sm border-gray-200/60 space-y-4">
          <div>
            <label className="text-xs text-gray-600 mb-2 block">搜索关键词</label>
            <Input 
              placeholder="输入关键词，用逗号分隔" 
              value={keywords} 
              onChange={(e) => setKeywords(e.target.value)} 
              className="bg-white border-gray-200" 
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-2 block">爬取数量</label>
            <div className="flex items-center gap-3">
              <Input 
                type="number" 
                value={crawlCount} 
                onChange={(e) => setCrawlCount(parseInt(e.target.value) || 100)} 
                className="w-28 bg-white border-gray-200" 
              />
              <span className="text-xs text-gray-500">条/平台</span>
            </div>
          </div>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-3">
          <Button 
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-8" 
            disabled={selectedPlatforms.length === 0}
          >
            <Play className="h-4 w-4 mr-2" />
            开始采集
          </Button>
          <Button variant="outline">
            <History className="h-4 w-4 mr-2" />
            查看日志
          </Button>
        </div>

        {/* 免责声明 */}
        <Card className="p-4 bg-amber-50/80 border-amber-200">
          <p className="font-medium text-amber-800 text-sm mb-1">⚠️ 免责声明</p>
          <p className="text-xs text-amber-700">
            本功能仅供学习研究使用，请遵守相关平台的使用条款和法律法规。
          </p>
        </Card>
      </div>
    </div>
  )
}

