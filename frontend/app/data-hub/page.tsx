'use client'

import { useState, useEffect } from 'react'
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
  Database,
  Eye,
  ThumbsUp,
  Coins,
  Star,
  Loader2,
  Columns
} from 'lucide-react'

// 导入真实数据
import biliData from '@/CrawlData/bili/json/creator_contents_2026-01-26.json'
import xhsData from '@/CrawlData/xhs/json/search_contents_2026-01-26.json'
import zhihuData from '@/CrawlData/zhihu/json/search_contents_2026-01-26.json'

// 统一数据格式接口
interface UnifiedPost {
  id: string
  platform: 'bilibili' | 'xiaohongshu' | 'zhihu'
  platformLabel: string
  platformColor: string
  type: 'video' | 'normal' | 'answer' | 'article'
  author: {
    name: string
    avatar: string
    id: string
    verified?: boolean
  }
  title: string
  content: string
  cover?: string
  url: string
  stats: {
    likes: number | string
    comments: number | string
    shares?: number | string
    views?: number | string
    coins?: number | string
    favorites?: number | string
  }
  createTime: number
  tags?: string[]
  videoLength?: string
}

// 数据转换函数
function transformData(): UnifiedPost[] {
  const posts: UnifiedPost[] = []

  // 转换B站数据
  biliData.slice(0, 20).forEach((item: any) => {
    // 将 HTTP 图片 URL 转换为 HTTPS，避免混合内容问题
    // B站数据字段：video_cover_url（封面）, avatar（头像）
    const coverUrl = item.video_cover_url ? item.video_cover_url.replace('http://', 'https://') : undefined
    const avatarUrl = item.avatar ? item.avatar.replace('http://', 'https://') : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%23f472b6"/><text x="16" y="21" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">B</text></svg>'
    
    posts.push({
      id: item.video_id,
      platform: 'bilibili',
      platformLabel: 'B站',
      platformColor: 'bg-pink-500',
      type: 'video',
      author: {
        name: item.nickname || 'B站用户',
        avatar: avatarUrl,
        id: item.user_id
      },
      title: item.title || '无标题',
      content: item.desc || '暂无描述',
      cover: coverUrl,
      url: item.video_url,
      stats: {
        likes: item.liked_count,
        comments: item.video_comment,
        shares: item.video_share_count,
        views: item.video_play_count,
        coins: item.video_coin_count,
        favorites: item.video_favorite_count
      },
      createTime: item.create_time * 1000,
      videoLength: '视频'
    })
  })

  // 转换小红书数据
  xhsData.slice(0, 20).forEach((item: any) => {
    // 小红书数据字段：image_list（图片列表，逗号分隔）, avatar（头像）
    const coverUrl = item.image_list ? item.image_list.split(',')[0].trim().replace('http://', 'https://') : undefined
    const avatarUrl = item.avatar ? item.avatar.replace('http://', 'https://') : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%23ef4444"/><text x="16" y="21" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">小</text></svg>'
    
    posts.push({
      id: item.note_id,
      platform: 'xiaohongshu',
      platformLabel: '小红书',
      platformColor: 'bg-red-500',
      type: item.type === 'video' ? 'video' : 'normal',
      author: {
        name: item.nickname || '小红书用户',
        avatar: avatarUrl,
        id: item.user_id
      },
      title: item.title || '无标题',
      content: item.desc || '暂无描述',
      cover: coverUrl,
      url: item.note_url,
      stats: {
        likes: item.liked_count,
        comments: item.comment_count,
        shares: item.share_count,
        favorites: item.collected_count
      },
      createTime: item.time,
      tags: item.tag_list ? item.tag_list.split(',').map(t => t.trim()) : []
    })
  })

  // 转换知乎数据
  zhihuData.slice(0, 20).forEach((item: any) => {
    // 知乎数据字段：user_avatar（头像），无封面字段（知乎问答类内容通常没有封面图）
    const avatarUrl = item.user_avatar ? item.user_avatar.replace('http://', 'https://') : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%233b82f6"/><text x="16" y="21" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">知</text></svg>'
    
    posts.push({
      id: item.content_id,
      platform: 'zhihu',
      platformLabel: '知乎',
      platformColor: 'bg-blue-500',
      type: item.content_type === 'article' ? 'article' : 'answer',
      author: {
        name: item.user_nickname || '知乎用户',
        avatar: avatarUrl,
        id: item.user_id
      },
      title: item.title || '无标题',
      content: item.content_text || '暂无内容',
      // 知乎内容通常没有封面，这是正常的
      cover: undefined,
      url: item.content_url,
      stats: {
        likes: item.voteup_count,
        comments: item.comment_count
      },
      createTime: item.created_time * 1000
    })
  })

  // 按时间排序
  return posts.sort((a, b) => b.createTime - a.createTime)
}

// 保留原有mockPosts用于后备
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
    comments: '342',
    shares: '89',
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
    comments: '156',
    shares: '0',
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
    comments: '82',
    shares: '0',
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
  const [selectedPost, setSelectedPost] = useState<UnifiedPost | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'time' | 'likes'>('time') // 排序方式
  const [searchScope, setSearchScope] = useState<'all' | 'author' | 'title'>('all') // 搜索范围
  const [realPosts, setRealPosts] = useState<UnifiedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载真实数据
  useEffect(() => {
    setIsLoading(true)
    try {
      const loadedPosts = transformData()
      setRealPosts(loadedPosts)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setTimeout(() => setIsLoading(false), 500) // 添加小延迟以显示加载动画
    }
  }, [])

  // 过滤和排序数据
  const filteredPosts = realPosts
    .filter(post => {
      // 平台筛选
      const matchesPlatform = selectedPlatform === 'all' || post.platform === selectedPlatform
      
      // 搜索范围筛选
      if (!searchTerm.trim()) return matchesPlatform
      
      const searchLower = searchTerm.toLowerCase()
      let matchesSearch = false
      
      if (searchScope === 'all') {
        matchesSearch = post.title.toLowerCase().includes(searchLower) ||
                       post.content.toLowerCase().includes(searchLower) ||
                       post.author.name.toLowerCase().includes(searchLower)
      } else if (searchScope === 'title') {
        matchesSearch = post.title.toLowerCase().includes(searchLower)
      } else if (searchScope === 'author') {
        matchesSearch = post.author.name.toLowerCase().includes(searchLower)
      }
      
      return matchesSearch && matchesPlatform
    })
    .sort((a, b) => {
      // 排序
      if (sortBy === 'time') {
        return b.createTime - a.createTime // 最新的在前
      } else {
        // 按点赞数排序
        const aLikes = typeof a.stats.likes === 'string' ? parseInt(a.stats.likes) : a.stats.likes
        const bLikes = typeof b.stats.likes === 'string' ? parseInt(b.stats.likes) : b.stats.likes
        return bLikes - aLikes
      }
    })

  // 统计数据
  const stats = {
    totalPosts: realPosts.length.toString(),
    avgSentiment: '8.5',
    totalEngagement: '842.1k',
    postsGrowth: '+12%',
    sentimentChange: '+0.5%',
    engagementGrowth: '+4.2%'
  }

  // 格式化数字
  const formatNumber = (num: number | string): string => {
    if (typeof num === 'string') return num
    if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    return '刚刚'
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* 顶部工具栏 - 固定 */}
      <div className="flex-shrink-0 border-b border-slate-200/60 px-4 sm:px-6 py-3 bg-white z-20">
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
              {/* 排序选择 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'time' | 'likes')}
                className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white hover:border-cyan-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              >
                <option value="time">⏰ 最新发布</option>
                <option value="likes">❤️ 最多点赞</option>
              </select>

              {/* 搜索范围选择 */}
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value as 'all' | 'author' | 'title')}
                className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white hover:border-cyan-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              >
                <option value="all">🔍 全部搜索</option>
                <option value="title">📝 标题</option>
                <option value="author">👤 账号</option>
              </select>

              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={
                    searchScope === 'all' ? '搜索全部内容...' :
                    searchScope === 'title' ? '搜索标题...' :
                    '搜索账号名...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-9 bg-white border-gray-200 focus:border-cyan-500"
                />
              </div>

              {/* 布局切换 */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`p-1.5 rounded ${layoutMode === 'grid' ? 'bg-white shadow-sm text-cyan-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="瀑布流布局"
                >
                  <Columns className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={`p-1.5 rounded ${layoutMode === 'list' ? 'bg-white shadow-sm text-cyan-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="列表布局"
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
          <div className="flex-1 flex flex-col min-w-0">
            {/* 平台筛选 - 固定 */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-slate-200/60 bg-white z-10">
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

            {/* 帖子列表 - 瀑布流布局 - 独立滚动，隐藏滚动条 */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-cyan-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">加载数据中...</p>
                    <p className="text-gray-400 text-sm mt-1">正在从多个平台获取内容</p>
                  </div>
                </div>
              ) : (
                <div className={layoutMode === 'grid' ? 'columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4' : 'space-y-3'}>
                  {filteredPosts.map((post) => (
                  <Card
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className={`break-inside-avoid mb-4 cursor-pointer transition-all hover:shadow-lg hover:border-cyan-300 ${
                      selectedPost?.id === post.id ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-50/30' : 'bg-white'
                    }`}
                  >
                    {/* 封面图 */}
                    {post.cover && (
                      <div className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-t-xl">
                        <img 
                          src={post.cover} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            img.style.display = 'none'
                            const parent = img.parentElement
                            if (parent) {
                              parent.innerHTML = `
                                <div class="flex items-center justify-center h-full">
                                  <div class="text-center">
                                    <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <p class="text-xs text-gray-400">图片加载失败</p>
                                  </div>
                                </div>
                              `
                            }
                          }}
                        />
                        {post.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                            <Play className="h-12 w-12 text-white opacity-90" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4">
                      {/* 作者信息 */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
                          <img 
                            src={post.author.avatar} 
                            alt={post.author.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%23e5e7eb"/><text x="16" y="21" text-anchor="middle" fill="%236b7280" font-size="16" font-family="sans-serif">👤</text></svg>'
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{post.author.name}</p>
                          <p className="text-xs text-gray-400">{formatTime(post.createTime)}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full text-white ${post.platformColor} flex-shrink-0`}>
                          {post.platformLabel}
                        </span>
                      </div>

                      {/* 标题 */}
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-base leading-tight">
                        {post.title}
                      </h3>

                      {/* 内容预览 */}
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3 leading-relaxed">
                        {post.content}
                      </p>

                      {/* 标签 */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 互动数据 */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 pt-3 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {formatNumber(post.stats.likes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {formatNumber(post.stats.comments)}
                        </span>
                        {post.stats.views && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {formatNumber(post.stats.views)}
                          </span>
                        )}
                        {post.stats.coins && (
                          <span className="flex items-center gap-1">
                            <Coins className="h-3.5 w-3.5" />
                            {formatNumber(post.stats.coins)}
                          </span>
                        )}
                        {post.stats.shares && (
                          <span className="flex items-center gap-1 ml-auto">
                            <Share2 className="h-3.5 w-3.5" />
                            {formatNumber(post.stats.shares)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                  ))}
                  
                  {filteredPosts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <Database className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-lg font-medium">暂无数据</p>
                      <p className="text-sm mt-1">尝试调整筛选条件</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：固定详情面板 - 加宽 */}
          {selectedPost && (
            <div className="w-[480px] border-l border-slate-200/60 flex flex-col bg-white shadow-lg">
              {/* 详情头部 - 带访问原文按钮 */}
              <div className="flex-shrink-0 p-4 border-b border-slate-200/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">内容详情</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedPost.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 rounded-lg transition-all shadow-sm hover:shadow"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      访问原文
                    </a>
                    <button 
                      onClick={() => setSelectedPost(null)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 详情内容 - 独立滚动，隐藏滚动条 */}
              <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
                {/* 作者信息 */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
                    <img 
                      src={selectedPost.author.avatar} 
                      alt={selectedPost.author.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%23e5e7eb"/><text x="24" y="32" text-anchor="middle" fill="%236b7280" font-size="24" font-family="sans-serif">👤</text></svg>'
                      }}
                    />
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

                {/* 封面图 */}
                {selectedPost.cover && (
                  <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden border border-gray-200">
                    <img 
                      src={selectedPost.cover} 
                      alt={selectedPost.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `
                            <div class="flex items-center justify-center h-full">
                              <div class="text-center">
                                <svg class="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p class="text-sm text-gray-400">封面图加载失败</p>
                              </div>
                            </div>
                          `
                        }
                      }}
                    />
                    {selectedPost.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                        <Play className="h-16 w-16 text-white opacity-80" />
                      </div>
                    )}
                  </div>
                )}

                {/* 内容 */}
                <p className="text-gray-600 leading-relaxed">{selectedPost.content}</p>

                {/* 标签 */}
                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag, i) => (
                      <span key={i} className="text-cyan-600 text-sm bg-cyan-50 px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                )}

                {/* 数据统计 */}
                <div className="space-y-3 py-4 border-y border-gray-200">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">{formatNumber(selectedPost.stats.likes)}</p>
                      <p className="text-xs text-gray-500">点赞</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">{formatNumber(selectedPost.stats.comments)}</p>
                      <p className="text-xs text-gray-500">评论</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">{selectedPost.stats.shares ? formatNumber(selectedPost.stats.shares) : '-'}</p>
                      <p className="text-xs text-gray-500">分享</p>
                    </div>
                  </div>
                  
                  {/* 额外统计信息 */}
                  {(selectedPost.stats.views || selectedPost.stats.coins || selectedPost.stats.favorites) && (
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                      {selectedPost.stats.views && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{formatNumber(selectedPost.stats.views)}</p>
                          <p className="text-xs text-gray-500">播放</p>
                        </div>
                      )}
                      {selectedPost.stats.coins && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{formatNumber(selectedPost.stats.coins)}</p>
                          <p className="text-xs text-gray-500">投币</p>
                        </div>
                      )}
                      {selectedPost.stats.favorites && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{formatNumber(selectedPost.stats.favorites)}</p>
                          <p className="text-xs text-gray-500">收藏</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 底部信息 */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">
                    发布时间: {formatTime(selectedPost.createTime)}
                  </p>
                  <p className="text-xs text-gray-400 text-center mt-1">
                    ID: {selectedPost.id}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 爬虫配置模式 - 独立滚动，隐藏滚动条 */
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
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
