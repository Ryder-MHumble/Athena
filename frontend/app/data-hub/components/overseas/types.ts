/**
 * 海外信源数据类型定义
 */

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
  created_at: string
  scraped_at: string
}

export interface YouTubeItem {
  id: string
  title: string
  url: string
  platform: 'youtube'
  source_name: string
  thumbnail?: string
  views?: string
  published_at?: string
  scraped_at: string
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

