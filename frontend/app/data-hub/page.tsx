'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  Search, 
  Settings2, 
  ExternalLink, 
  Heart, 
  MessageCircle, 
  Share2,
  TrendingUp,
  Sparkles,
  Play,
  RefreshCw,
  LayoutGrid,
  List,
  X,
  Clock,
  Globe,
  Filter,
  Database
} from 'lucide-react'

// 模拟数据 - 实际会从后端获取
const mockPosts = [
  {
    id: '8823901',
    platform: 'xiaohongshu',
    platformLabel: '小红书',
    platformColor: 'bg-red-500',
    author: {
      name: 'FashionGuru_99',
      avatar: '👩',
      verified: true
    },
    title: 'Must-have summer aesthetic essentials ☀️✨',
    content: 'Just got these amazing pieces for my summer collection. The colors are absolutely vibrant and the quality is top notch! I\'ve been looking for something breathable yet stylish for the Shanghai heatwaves.',
    imageCount: 4,
    likes: '12.4k',
    comments: 342,
    shares: 89,
    tags: ['#summer', '#fashion', '#ootd'],
    crawledAt: 'Oct 24, 2023',
    sentiment: { score: 92, label: 'Positive' },
    url: 'https://www.xiaohongshu.com/explore/8823901'
  },
  {
    id: '9912834',
    platform: 'douyin',
    platformLabel: '抖音',
    platformColor: 'bg-gray-900',
    author: {
      name: 'TechAnalyst',
      avatar: '🧑‍💻',
      verified: false
    },
    title: 'What is the future of AI in content aggregation?',
    content: 'With the rise of LLMs, the way we consume and aggregate data is shifting rapidly...',
    imageCount: 0,
    videoLength: '12:45',
    likes: '2.1k',
    comments: 156,
    shares: 0,
    tags: ['Tech', 'AI'],
    crawledAt: '5 hrs ago',
    sentiment: { score: 78, label: 'Neutral' },
    url: 'https://www.douyin.com/video/9912834'
  },
  {
    id: '7734521',
    platform: 'weibo',
    platformLabel: '微博',
    platformColor: 'bg-orange-500',
    author: {
      name: 'CafeHunter',
      avatar: '☕',
      verified: true
    },
    title: 'Hidden Gem in Shanghai: The Silent Cafe',
    content: 'Found this incredibly peaceful spot near the bund...',
    imageCount: 2,
    likes: '3.4k',
    comments: 82,
    shares: 0,
    tags: ['cafe', 'shanghai'],
    crawledAt: '3 days ago',
    sentiment: { score: 88, label: 'Positive' },
    url: 'https://weibo.com/7734521'
  },
  {
    id: '5567823',
    platform: 'bilibili',
    platformLabel: 'B站',
    platformColor: 'bg-pink-500',
    author: {
      name: 'RetroGamerCN',
      avatar: '🎮',
      verified: false
    },
    title: 'Reviewing the top 10 mechanical keyboards of 2024',
    content: 'Clicky, tactile, or linear? Today we dive deep into the...',
    imageCount: 0,
    videoLength: '18:32',
    likes: '45k',
    comments: '1.2k',
    shares: '5.5k',
    tags: ['keyboard', 'review'],
    crawledAt: '1 day ago',
    sentiment: { score: 85, label: 'Positive' },
    url: 'https://www.bilibili.com/video/5567823'
  }
]

const platforms = [
  { id: 'all', label: '全部', icon: Globe },
  { id: 'xiaohongshu', label: '小红书', color: 'bg-red-500' },
  { id: 'douyin', label: '抖音', color: 'bg-gray-900' },
  { id: 'weibo', label: '微博', color: 'bg-orange-500' },
  { id: 'bilibili', label: 'B站', color: 'bg-pink-500' },
  { id: 'kuaishou', label: '快手', color: 'bg-orange-400' },
  { id: 'zhihu', label: '知乎', color: 'bg-blue-500' },
]

export default function DataHubPage() {
  const [viewMode, setViewMode] = useState<'cards' | 'crawler'>('cards')
  const [selectedPost, setSelectedPost] = useState<typeof mockPosts[0] | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid')

  // 过滤数据
  const filteredPosts = mockPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlatform = selectedPlatform === 'all' || post.platform === selectedPlatform
    return matchesSearch && matchesPlatform
  })

  // 统计数据
  const stats = {
    totalPosts: '12,450',
    avgSentiment: '8.5',
    totalEngagement: '842.1k',
    postsGrowth: '+12%',
    sentimentChange: '+0.5%',
    engagementGrowth: '+4.2%'
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b border-slate-200/60 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* 左侧：模式切换 */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className={viewMode === 'cards' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              数据浏览
            </Button>
            <Button
              variant={viewMode === 'crawler' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('crawler')}
              className={viewMode === 'crawler' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              爬虫配置
            </Button>
          </div>

          {/* 右侧：搜索和筛选 */}
          {viewMode === 'cards' && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-9 bg-white border-gray-200 focus:border-cyan-500"
                />
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`p-1.5 rounded ${layoutMode === 'grid' ? 'bg-white shadow-sm text-cyan-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={`p-1.5 rounded ${layoutMode === 'list' ? 'bg-white shadow-sm text-cyan-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      {viewMode === 'cards' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：数据统计和帖子列表 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 统计卡片 */}
            <div className="flex-shrink-0 p-4 sm:p-6 border-b border-slate-200/60">
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">采集总量</span>
                    <div className="p-1.5 rounded-lg bg-cyan-50">
                      <Database className="h-4 w-4 text-cyan-600" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">{stats.totalPosts}</span>
                    <span className="text-sm text-emerald-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      {stats.postsGrowth}
                    </span>
                  </div>
                </Card>
                <Card className="p-4 border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">情感指数</span>
                    <div className="p-1.5 rounded-lg bg-amber-50">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">{stats.avgSentiment}<span className="text-base text-gray-400">/10</span></span>
                    <span className="text-sm text-emerald-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      {stats.sentimentChange}
                    </span>
                  </div>
                </Card>
                <Card className="p-4 border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">互动总量</span>
                    <div className="p-1.5 rounded-lg bg-rose-50">
                      <Heart className="h-4 w-4 text-rose-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">{stats.totalEngagement}</span>
                    <span className="text-sm text-emerald-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      {stats.engagementGrowth}
                    </span>
                  </div>
                </Card>
              </div>
            </div>

            {/* 平台筛选 */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2 overflow-x-auto">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                      selectedPlatform === platform.id
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {platform.color && (
                      <span className={`w-2 h-2 rounded-full ${platform.color}`}></span>
                    )}
                    {platform.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 帖子列表 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className={layoutMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-3'}>
                {filteredPosts.map((post) => (
                  <Card
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md hover:border-cyan-300 ${
                      selectedPost?.id === post.id ? 'border-cyan-500 ring-1 ring-cyan-500/20 bg-cyan-50/30' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 头像 */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg">
                        {post.author.avatar}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* 作者信息 */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{post.author.name}</span>
                          {post.author.verified && (
                            <span className="text-cyan-500">✓</span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded text-white ${post.platformColor}`}>
                            {post.platformLabel}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">{post.crawledAt}</span>
                        </div>
                        
                        {/* 标题 */}
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                        
                        {/* 内容预览 */}
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.content}</p>
                        
                        {/* 互动数据 */}
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.comments}
                          </span>
                          {post.shares > 0 && (
                            <span className="flex items-center gap-1">
                              <Share2 className="h-4 w-4" />
                              {post.shares}
                            </span>
                          )}
                          {post.imageCount > 0 && (
                            <span className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                              {post.imageCount} 图
                            </span>
                          )}
                          {post.videoLength && (
                            <span className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 flex items-center gap-1">
                              <Play className="h-3 w-3" />
                              {post.videoLength}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：详情面板 */}
          {selectedPost && (
            <div className="w-96 border-l border-slate-200/60 flex flex-col overflow-hidden">
              {/* 详情头部 */}
              <div className="flex-shrink-0 p-4 border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">内容详情</span>
                  <button 
                    onClick={() => setSelectedPost(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* 详情内容 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 作者信息 */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xl">
                    {selectedPost.author.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{selectedPost.author.name}</span>
                      {selectedPost.author.verified && (
                        <span className="text-cyan-500">✓</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className={`text-xs px-1.5 py-0.5 rounded text-white ${selectedPost.platformColor}`}>
                        {selectedPost.platformLabel}
                      </span>
                      <span>ID: #{selectedPost.id}</span>
                    </div>
                  </div>
                </div>

                {/* 标题 */}
                <h2 className="text-lg font-bold text-gray-900">{selectedPost.title}</h2>

                {/* 图片占位 */}
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border border-gray-200">
                  <span className="text-gray-400 text-sm">图片预览</span>
                </div>

                {/* 内容 */}
                <p className="text-gray-600 leading-relaxed">{selectedPost.content}</p>

                {/* 标签 */}
                <div className="flex flex-wrap gap-2">
                  {selectedPost.tags.map((tag, i) => (
                    <span key={i} className="text-cyan-600 text-sm bg-cyan-50 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>

                {/* 数据统计 */}
                <div className="grid grid-cols-3 gap-3 py-4 border-y border-gray-200">
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{selectedPost.likes}</p>
                    <p className="text-xs text-gray-500">点赞</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{selectedPost.comments}</p>
                    <p className="text-xs text-gray-500">评论</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{selectedPost.shares || '-'}</p>
                    <p className="text-xs text-gray-500">分享</p>
                  </div>
                </div>

                {/* AI 情感分析 */}
                <Card className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-cyan-600" />
                    <span className="font-medium text-cyan-900">AI 情感分析</span>
                  </div>
                  <p className="text-sm text-cyan-800">
                    该内容情感倾向为{' '}
                    <span className={selectedPost.sentiment.label === 'Positive' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                      {selectedPost.sentiment.label === 'Positive' ? '积极' : '中性'} ({selectedPost.sentiment.score}%)
                    </span>
                  </p>
                </Card>

                {/* 打开原文按钮 */}
                <a
                  href={selectedPost.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    查看原文
                  </Button>
                </a>

                {/* 底部信息 */}
                <p className="text-xs text-gray-400 text-center">
                  采集时间: {selectedPost.crawledAt} • ID: {selectedPost.id}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 爬虫配置模式 */
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 配置说明 */}
            <Card className="p-6 bg-white">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-cyan-50">
                  <Settings2 className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">爬虫配置中心</h2>
                  <p className="text-gray-600 mb-4">
                    配置和管理多平台数据采集任务。基于{' '}
                    <a 
                      href="https://github.com/NanmiCoder/MediaCrawler" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:underline"
                    >
                      MediaCrawler
                    </a>
                    {' '}开源项目，支持小红书、抖音、快手、B站、微博、贴吧、知乎等平台。
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      上次运行: 2 小时前
                    </span>
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-4 w-4" />
                      已采集: 12,450 条
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 平台配置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.filter(p => p.id !== 'all').map((platform) => (
                <Card key={platform.id} className="p-4 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${platform.color}`}></span>
                      <span className="font-medium text-gray-900">{platform.label}</span>
                    </div>
                    <Button size="sm" variant="outline" className="border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                      配置
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">搜索关键词</label>
                      <Input 
                        placeholder="输入关键词，用逗号分隔"
                        className="bg-white border-gray-200"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">爬取数量</span>
                      <span className="text-gray-900">100 条/次</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">状态</span>
                      <span className="text-emerald-600">已配置</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* 运行按钮 */}
            <div className="flex justify-center gap-4">
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white px-8">
                <Play className="h-4 w-4 mr-2" />
                开始爬取
              </Button>
              <Button variant="outline" className="border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                查看日志
              </Button>
            </div>

            {/* 免责声明 */}
            <Card className="p-4 bg-amber-50 border-amber-200">
              <p className="font-medium text-amber-800 mb-1">⚠️ 免责声明</p>
              <p className="text-sm text-amber-700">
                本功能仅供学习研究使用，请遵守相关平台的使用条款和法律法规。
                禁止用于商业用途或任何非法活动。
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
