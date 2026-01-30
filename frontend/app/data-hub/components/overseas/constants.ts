/**
 * 海外信源相关常量配置
 */

import { Globe, Youtube, Twitter } from 'lucide-react'
import type { PlatformConfig, SortOption } from './types'

// API 基础地址
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// 卡片最大高度（像素）
export const CARD_MAX_HEIGHT = 320

// 文本最大行数
export const TEXT_MAX_LINES = 6

// 平台配置
export const PLATFORMS: PlatformConfig[] = [
  { id: 'all', label: '全部', icon: Globe, color: 'bg-gray-500' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'bg-red-600' },
  { id: 'twitter', label: 'X (Twitter)', icon: Twitter, color: 'bg-black' },
]

// 排序选项
export const SORT_OPTIONS: SortOption[] = [
  { id: 'newest', label: '最新发布' },
  { id: 'oldest', label: '最早发布' },
  { id: 'popular', label: '最受欢迎' },
]

// 默认头像
export const DEFAULT_AVATAR = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'

