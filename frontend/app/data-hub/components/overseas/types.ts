/**
 * 海外信源数据类型定义
 */

export interface QuotedTweet {
  id: string
  url: string
  text: string
  author: {
    username: string
    name: string
    avatar: string
    followers?: number
    verified?: boolean
  }
  stats: {
    likes: number
    retweets: number
    replies: number
    views: number
  }
  media?: Array<{ type: string; url: string }>
  created_at: string
}

export interface TwitterItem {
  id: string
  url: string
  text: string
  platform: 'twitter'
  source_name: string
  author: {
    username: string
    name: string
    avatar: string
    followers?: number
    verified?: boolean
  }
  stats: {
    likes: number
    retweets: number
    replies: number
    views: number
    quotes?: number
    bookmarks?: number
  }
  media?: Array<{ type: string; url: string }>
  quoted_tweet?: QuotedTweet
  created_at: string
  scraped_at: string
  // AI 分析字段
  summary?: string
  ai_summary?: string
  key_points?: string[]
}

export interface YouTubeItem {
  id: string
  title: string
  url: string
  platform: 'youtube'
  source_name: string
  thumbnail?: string
  views?: string
  description?: string
  published_at?: string
  scraped_at: string
  // AI 分析字段
  summary?: string
  ai_summary?: string
  key_points?: string[]
}

export type OverseasItem = TwitterItem | YouTubeItem
export type OverseasPlatform = 'all' | 'youtube' | 'twitter'
export type SortOrder = 'newest' | 'oldest' | 'popular'

export interface PlatformConfig {
  id: OverseasPlatform
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export interface SortOption {
  id: SortOrder
  label: string
}

export interface TimelineGroup {
  date: string                    // YYYY-MM-DD
  displayDate: string             // "2026年2月5日 星期三"
  items: OverseasItem[]
  count: number
}

