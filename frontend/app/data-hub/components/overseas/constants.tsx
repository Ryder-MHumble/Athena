/**
 * 海外信源相关常量配置
 */

import { Globe, Youtube } from 'lucide-react'
import type { PlatformConfig, SortOption } from './types'

// 从基础设施层导入全局常量
export { API_BASE, CARD_MAX_HEIGHT, TEXT_MAX_LINES, DEFAULT_AVATAR } from '../../lib/constants'

// X Logo 组件
const XLogoIcon = ({ className }: { className?: string }) => {
  // 使用 img 标签来显示 X logo
  return <img src="/X-logo.png" alt="X" className={className} />
}

// 平台配置
export const PLATFORMS: PlatformConfig[] = [
  { id: 'all', label: '全部', icon: Globe, color: 'bg-gray-500' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'bg-red-600' },
  { id: 'twitter', label: 'X', icon: XLogoIcon, color: 'bg-black' },
]

// 排序选项
export const SORT_OPTIONS: SortOption[] = [
  { id: 'newest', label: '最新发布' },
  { id: 'oldest', label: '最早发布' },
  { id: 'popular', label: '最受欢迎' },
]

