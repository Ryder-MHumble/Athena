'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  Search, ExternalLink, MessageCircle, Share2, Play, X, 
  Database, Eye, ThumbsUp, Coins, Loader2, Columns, List
} from 'lucide-react'
import { UnifiedPost, LayoutMode, SortBy, SearchScope } from './types'
import { platforms, transformCrawlData, formatNumber, formatRelativeTime } from './utils'

// 导入真实数据
import biliData from '@/CrawlData/bili/json/creator_contents_2026-01-26.json'
import xhsData from '@/CrawlData/xhs/json/search_contents_2026-01-26.json'
import zhihuData from '@/CrawlData/zhihu/json/search_contents_2026-01-26.json'

export function DataBrowseSection() {
  const [selectedPost, setSelectedPost] = useState<UnifiedPost | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('time')
  const [searchScope, setSearchScope] = useState<SearchScope>('all')
  const [posts, setPosts] = useState<UnifiedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载数据
  useEffect(() => {
    setIsLoading(true)
    try {
      const loadedPosts = transformCrawlData(biliData, xhsData, zhihuData)
      setPosts(loadedPosts)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setTimeout(() => setIsLoading(false), 500)
    }
  }, [])

  // 过滤和排序数据
  const filteredPosts = posts
    .filter(post => {
      const matchesPlatform = selectedPlatform === 'all' || post.platform === selectedPlatform
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
      if (sortBy === 'time') return b.createTime - a.createTime
      const aLikes = typeof a.stats.likes === 'string' ? parseInt(a.stats.likes) : a.stats.likes
      const bLikes = typeof b.stats.likes === 'string' ? parseInt(b.stats.likes) : b.stats.likes
      return bLikes - aLikes
    })

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 工具栏 */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-slate-200/60 bg-white z-10 flex items-center justify-between gap-4">
          {/* 平台筛选 */}
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
                {platform.color && <span className={`w-2 h-2 rounded-full ${platform.color}`}></span>}
                {platform.label}
              </button>
            ))}
          </div>

          {/* 搜索和筛选 */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white hover:border-cyan-400 focus:border-cyan-500"
            >
              <option value="time">🕐 最新发布</option>
              <option value="likes">❤️ 最多点赞</option>
            </select>
            
            <select 
              value={searchScope} 
              onChange={(e) => setSearchScope(e.target.value as SearchScope)}
              className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white hover:border-cyan-400 focus:border-cyan-500"
            >
              <option value="all">🔍 全部搜索</option>
              <option value="title">📝 标题</option>
              <option value="author">👤 账号</option>
            </select>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={searchScope === 'all' ? '搜索...' : searchScope === 'title' ? '搜索标题...' : '搜索账号...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 pl-9 bg-white border-gray-200 focus:border-cyan-500"
              />
            </div>
            
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded ${layoutMode === 'grid' ? 'bg-white shadow-sm text-cyan-600' : 'text-gray-500'}`}
              >
                <Columns className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setLayoutMode('list')}
                className={`p-1.5 rounded ${layoutMode === 'list' ? 'bg-white shadow-sm text-cyan-600' : 'text-gray-500'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 帖子列表 */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">加载数据中...</p>
              </div>
            </div>
          ) : (
            <div className={layoutMode === 'grid' ? 'columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4' : 'space-y-3'}>
              {filteredPosts.map((post) => (
                layoutMode === 'grid' ? (
                  // 卡片式布局
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
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} 
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
                          <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{post.author.name}</p>
                          <p className="text-xs text-gray-400">{formatRelativeTime(post.createTime)}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full text-white ${post.platformColor} flex-shrink-0`}>
                          {post.platformLabel}
                        </span>
                      </div>
                      
                      {/* 标题和内容 */}
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-base leading-tight">{post.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3 leading-relaxed">{post.content}</p>
                      
                      {/* 标签 */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full">#{tag}</span>
                          ))}
                        </div>
                      )}
                      
                      {/* 互动数据 */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 pt-3 border-t border-gray-100">
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{formatNumber(post.stats.likes)}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{formatNumber(post.stats.comments)}</span>
                        {post.stats.views && <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{formatNumber(post.stats.views)}</span>}
                        {post.stats.shares && <span className="flex items-center gap-1 ml-auto"><Share2 className="h-3.5 w-3.5" />{formatNumber(post.stats.shares)}</span>}
                      </div>
                    </div>
                  </Card>
                ) : (
                  // 列表式布局 - 图片在左侧
                  <Card 
                    key={post.id} 
                    onClick={() => setSelectedPost(post)}
                    className={`cursor-pointer transition-all hover:shadow-lg hover:border-cyan-300 ${
                      selectedPost?.id === post.id ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-50/30' : 'bg-white'
                    }`}
                  >
                    <div className="flex">
                      {/* 左侧封面图 */}
                      {post.cover && (
                        <div className="relative w-40 h-28 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-l-xl">
                          <img 
                            src={post.cover} 
                            alt={post.title} 
                            className="w-full h-full object-cover" 
                            loading="lazy" 
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} 
                          />
                          {post.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                              <Play className="h-8 w-8 text-white opacity-90" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 右侧内容 */}
                      <div className="flex-1 p-3 min-w-0">
                        {/* 顶部：作者和平台 */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
                            <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">{post.author.name}</span>
                          <span className="text-xs text-gray-400">{formatRelativeTime(post.createTime)}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded text-white ${post.platformColor} ml-auto flex-shrink-0`}>
                            {post.platformLabel}
                          </span>
                        </div>
                        
                        {/* 标题 */}
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-1 mb-1">{post.title}</h3>
                        
                        {/* 简短描述 */}
                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{post.content}</p>
                        
                        {/* 互动数据 */}
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{formatNumber(post.stats.likes)}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{formatNumber(post.stats.comments)}</span>
                          {post.stats.views && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatNumber(post.stats.views)}</span>}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              ))}
              
              {filteredPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Database className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">暂无数据</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 详情面板 */}
      {selectedPost && (
        <div className="w-[480px] border-l border-slate-200/60 flex flex-col bg-white shadow-lg">
          {/* 头部 */}
          <div className="flex-shrink-0 p-4 border-b border-slate-200/60">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">内容详情</span>
              <div className="flex items-center gap-2">
                <a 
                  href={selectedPost.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg"
                >
                  <ExternalLink className="h-3.5 w-3.5" />访问原文
                </a>
                <button onClick={() => setSelectedPost(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* 内容 */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
                <img src={selectedPost.author.avatar} alt={selectedPost.author.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-medium text-gray-900">{selectedPost.author.name}</span>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className={`text-xs px-1.5 py-0.5 rounded text-white ${selectedPost.platformColor}`}>{selectedPost.platformLabel}</span>
                </div>
              </div>
            </div>
            
            <h2 className="text-lg font-bold text-gray-900">{selectedPost.title}</h2>
            
            {selectedPost.cover && (
              <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
                <img src={selectedPost.cover} alt={selectedPost.title} className="w-full h-full object-cover" />
              </div>
            )}
            
            <p className="text-gray-600 leading-relaxed">{selectedPost.content}</p>
            
            <div className="grid grid-cols-3 gap-3 py-4 border-y border-gray-200">
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
            
            {(selectedPost.stats.views || selectedPost.stats.coins || selectedPost.stats.favorites) && (
              <div className="grid grid-cols-3 gap-3">
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
        </div>
      )}
    </div>
  )
}

