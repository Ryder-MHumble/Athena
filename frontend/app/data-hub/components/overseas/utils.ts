/**
 * 海外信源工具函数
 */

import type { OverseasItem, TwitterItem, YouTubeItem } from './types'

/**
 * 格式化时间为相对时间
 */
export function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    if (days < 365) return `${Math.floor(days / 30)}个月前`
    return date.toLocaleDateString('zh-CN')
  } catch {
    return dateStr
  }
}

/**
 * 格式化数字（K/M 缩写）
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

/**
 * 获取内容的发布时间
 */
export function getPublishTime(item: OverseasItem): Date {
  if (item.platform === 'twitter') {
    return new Date((item as TwitterItem).created_at)
  } else {
    const yt = item as YouTubeItem
    return new Date(yt.published_at || yt.scraped_at)
  }
}

/**
 * 计算内容的热度分数
 */
export function getPopularityScore(item: OverseasItem): number {
  if (item.platform === 'twitter') {
    const tw = item as TwitterItem
    return tw.stats.views + tw.stats.likes * 10 + tw.stats.retweets * 20
  }
  return 0
}

/**
 * 检查内容是否匹配搜索词
 */
export function matchesSearch(item: OverseasItem, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true
  
  const searchLower = searchTerm.toLowerCase()
  
  if (item.platform === 'youtube') {
    const ytItem = item as YouTubeItem
    return ytItem.title.toLowerCase().includes(searchLower) ||
           ytItem.source_name.toLowerCase().includes(searchLower)
  } else {
    const twItem = item as TwitterItem
    return twItem.text.toLowerCase().includes(searchLower) ||
           twItem.source_name.toLowerCase().includes(searchLower) ||
           twItem.author.username.toLowerCase().includes(searchLower) ||
           twItem.author.name.toLowerCase().includes(searchLower)
  }
}

/**
 * 日期范围类型
 */
export interface DateRange {
  start: string | null
  end: string | null
}

/**
 * 根据日期范围过滤数据
 */
export function filterByDateRange(
  items: OverseasItem[],
  dateRange: DateRange
): OverseasItem[] {
  if (!dateRange.start && !dateRange.end) return items
  
  const now = new Date()
  let startDate: Date | null = null
  let endDate: Date | null = null
  
  if (dateRange.start === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  } else if (dateRange.start === '3days') {
    startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  } else if (dateRange.start === '7days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (dateRange.start === '30days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  } else if (dateRange.start) {
    startDate = new Date(dateRange.start)
  }
  
  if (dateRange.end && dateRange.end !== 'today') {
    endDate = new Date(dateRange.end)
    endDate.setHours(23, 59, 59)
  }
  
  return items.filter(item => {
    const dateStr = item.platform === 'twitter' 
      ? (item as TwitterItem).created_at 
      : ((item as YouTubeItem).published_at || (item as YouTubeItem).scraped_at)
    const itemDate = new Date(dateStr)
    if (startDate && itemDate < startDate) return false
    if (endDate && itemDate > endDate) return false
    return true
  })
}

