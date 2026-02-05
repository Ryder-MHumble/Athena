/**
 * 共享类型定义
 */

// 平台类型
export type Platform = 'twitter' | 'youtube' | 'bilibili' | 'xiaohongshu' | 'zhihu'

// 平台配置（通用定义）
export interface PlatformConfig {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  color?: string
}

// 基础作者信息
export interface BaseAuthor {
  name: string
  avatar?: string
  id?: string
  verified?: boolean
}

// 基础统计信息
export interface BaseStats {
  likes: number
  comments?: number
  views?: number
  shares?: number
}

// 视图模式
export type LayoutMode = 'grid' | 'list'

// 排序方式
export type SortBy = 'time' | 'likes' | 'popular'

// 搜索范围
export type SearchScope = 'all' | 'author' | 'title' | 'content'
