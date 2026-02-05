/**
 * 海外信源 UI 组件共享类型
 */

import type { OverseasPlatform, SortOrder } from '../types'

export interface SourceAccount {
  name: string
  platform: 'twitter' | 'youtube'
  username?: string
  avatar?: string
  followers?: number
  verified?: boolean
}

export interface DateRange {
  start: string | null
  end: string | null
}

export interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  accounts: SourceAccount[]
  selectedAccounts: string[]
  selectedPlatforms: OverseasPlatform[]
  dateRange: DateRange
  sortOrder: string
  onAccountsChange: (accounts: string[]) => void
  onPlatformsChange: (platforms: OverseasPlatform[]) => void
  onDateRangeChange: (range: DateRange) => void
  onSortChange: (order: SortOrder) => void
  onAddSource?: (urls: string) => Promise<void>
}

export interface TopToolbarProps {
  searchTerm: string
  sortOrder: string
  isCrawling: boolean
  resultCount: number
  dateRange: DateRange
  accounts: SourceAccount[]
  selectedAccounts: string[]
  selectedPlatforms: OverseasPlatform[]
  onSearchChange: (term: string) => void
  onSortChange: (order: SortOrder) => void
  onCrawl: () => void
  onDateRangeChange: (range: DateRange) => void
  onAccountsChange: (accounts: string[]) => void
  onPlatformsChange: (platforms: OverseasPlatform[]) => void
  onAddSource: () => void
}

