/**
 * 数据中心工具函数
 */

import { Globe } from 'lucide-react'
import { UnifiedPost, PlatformConfig } from './types'
import { ScrapeHistoryItem } from '@/lib/firecrawl'

// 平台配置
export const platforms: PlatformConfig[] = [
  { id: 'all', label: '全部', icon: Globe },
  { id: 'xiaohongshu', label: '小红书', color: 'bg-red-500' },
  { id: 'douyin', label: '抖音', color: 'bg-gray-900' },
  { id: 'weibo', label: '微博', color: 'bg-orange-500' },
  { id: 'bilibili', label: 'B站', color: 'bg-pink-500' },
  { id: 'kuaishou', label: '快手', color: 'bg-orange-400' },
  { id: 'zhihu', label: '知乎', color: 'bg-blue-500' },
]

// 检测URL平台类型
export function detectPlatform(url: string): 'twitter' | 'youtube' | 'general' {
  if (url.includes('x.com') || url.includes('twitter.com')) return 'twitter'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  return 'general'
}

// 提取Twitter状态ID
export function extractTwitterId(url: string): string | null {
  const match = url.match(/status\/(\d+)/)
  return match ? match[1] : null
}

// 提取YouTube视频ID
export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// 导出CSV
export function exportToCSV(items: ScrapeHistoryItem[], format: 'markdown' | 'html') {
  const headers = ['URL', '标题', '状态', '时间', '内容']
  const rows = items.map(item => {
    const content = format === 'markdown' ? item.data?.markdown : item.data?.html
    return [
      item.url,
      item.title || '',
      item.status,
      new Date(item.timestamp).toLocaleString('zh-CN'),
      (content || '').replace(/"/g, '""').replace(/\n/g, ' ')
    ]
  })
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `crawl_results_${format}_${Date.now()}.csv`
  link.click()
}

// 格式化数字
export function formatNumber(num: number | string): string {
  if (typeof num === 'string') return num
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

// 格式化时间（相对时间）
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  return '刚刚'
}

// 格式化时间（日期时间）
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

// 数据转换函数
export function transformCrawlData(
  biliData: any[],
  xhsData: any[],
  zhihuData: any[]
): UnifiedPost[] {
  const posts: UnifiedPost[] = []

  biliData.slice(0, 20).forEach((item: any) => {
    const coverUrl = item.video_cover_url ? item.video_cover_url.replace('http://', 'https://') : undefined
    const avatarUrl = item.avatar ? item.avatar.replace('http://', 'https://') : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%23f472b6"/><text x="16" y="21" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">B</text></svg>'
    
    posts.push({
      id: item.video_id, platform: 'bilibili', platformLabel: 'B站', platformColor: 'bg-pink-500', type: 'video',
      author: { name: item.nickname || 'B站用户', avatar: avatarUrl, id: item.user_id },
      title: item.title || '无标题', content: item.desc || '暂无描述', cover: coverUrl, url: item.video_url,
      stats: { likes: item.liked_count, comments: item.video_comment, shares: item.video_share_count, views: item.video_play_count, coins: item.video_coin_count, favorites: item.video_favorite_count },
      createTime: item.create_time * 1000, videoLength: '视频'
    })
  })

  xhsData.slice(0, 20).forEach((item: any) => {
    const coverUrl = item.image_list ? item.image_list.split(',')[0].trim().replace('http://', 'https://') : undefined
    const avatarUrl = item.avatar ? item.avatar.replace('http://', 'https://') : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%23ef4444"/><text x="16" y="21" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">红</text></svg>'
    
    posts.push({
      id: item.note_id, platform: 'xiaohongshu', platformLabel: '小红书', platformColor: 'bg-red-500', type: item.type === 'video' ? 'video' : 'normal',
      author: { name: item.nickname || '小红书用户', avatar: avatarUrl, id: item.user_id },
      title: item.title || '无标题', content: item.desc || '暂无描述', cover: coverUrl, url: item.note_url,
      stats: { likes: item.liked_count, comments: item.comment_count, shares: item.share_count, favorites: item.collected_count },
      createTime: item.time, tags: item.tag_list ? item.tag_list.split(',').map((t: string) => t.trim()) : []
    })
  })

  zhihuData.slice(0, 20).forEach((item: any) => {
    const avatarUrl = item.user_avatar ? item.user_avatar.replace('http://', 'https://') : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%233b82f6"/><text x="16" y="21" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">知</text></svg>'
    
    posts.push({
      id: item.content_id, platform: 'zhihu', platformLabel: '知乎', platformColor: 'bg-blue-500', type: item.content_type === 'article' ? 'article' : 'answer',
      author: { name: item.user_nickname || '知乎用户', avatar: avatarUrl, id: item.user_id },
      title: item.title || '无标题', content: item.content_text || '暂无内容', cover: undefined, url: item.content_url,
      stats: { likes: item.voteup_count, comments: item.comment_count },
      createTime: item.created_time * 1000
    })
  })

  return posts.sort((a, b) => b.createTime - a.createTime)
}

