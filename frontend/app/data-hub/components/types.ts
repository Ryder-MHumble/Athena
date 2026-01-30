/**
 * 数据中心类型定义
 */

// 统一数据格式接口
export interface UnifiedPost {
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

// 平台配置
export interface PlatformConfig {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  color?: string
}

// 爬虫模式
export type CrawlerMode = 'url' | 'social'

// 视图模式
export type ViewMode = 'cards' | 'crawler'

// 布局模式
export type LayoutMode = 'grid' | 'list'

// 排序方式
export type SortBy = 'time' | 'likes'

// 搜索范围
export type SearchScope = 'all' | 'author' | 'title'

// 内容格式
export type ContentFormat = 'markdown' | 'html'

