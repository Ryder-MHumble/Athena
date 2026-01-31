'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { OverseasItem, OverseasPlatform, SortOrder } from './types'
import { API_BASE } from './constants'
import { getPublishTime, getPopularityScore, matchesSearch } from './utils'

interface SourceAccount {
  name: string
  platform: 'twitter' | 'youtube'
}

interface UseOverseasDataReturn {
  items: OverseasItem[]
  filteredItems: OverseasItem[]
  sourceAccounts: SourceAccount[]
  isLoading: boolean
  isCrawling: boolean
  error: string | null
  selectedPlatform: OverseasPlatform
  selectedAccounts: string[]
  searchTerm: string
  sortOrder: SortOrder
  setSelectedPlatform: (platform: OverseasPlatform) => void
  setSelectedAccounts: (accounts: string[]) => void
  setSearchTerm: (term: string) => void
  setSortOrder: (order: SortOrder) => void
  refresh: () => Promise<void>
  crawl: () => Promise<void>
}

export function useOverseasData(): UseOverseasDataReturn {
  const [items, setItems] = useState<OverseasItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCrawling, setIsCrawling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedPlatform, setSelectedPlatformState] = useState<OverseasPlatform>('all')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  
  // 提取所有独立的账号列表
  const sourceAccounts = useMemo(() => {
    const accountMap = new Map<string, SourceAccount>()
    items.forEach(item => {
      const name = item.source_name
      if (name && !accountMap.has(name)) {
        accountMap.set(name, { name, platform: item.platform })
      }
    })
    return Array.from(accountMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [items])
  
  // 切换平台时清空不匹配的已选账号
  const setSelectedPlatform = useCallback((platform: OverseasPlatform) => {
    setSelectedPlatformState(platform)
    // 当切换平台时，清除与新平台不匹配的已选账号
    if (platform !== 'all') {
      setSelectedAccounts(prev => 
        prev.filter(accountName => {
          const account = sourceAccounts.find(a => a.name === accountName)
          return account && account.platform === platform
        })
      )
    }
  }, [sourceAccounts])

  // 获取数据
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const fetchedItems: OverseasItem[] = []
      
      // Twitter 数据
      try {
        const twitterRes = await fetch(`${API_BASE}/api/crawler/data/twitter`)
        if (twitterRes.ok) {
          const data = await twitterRes.json()
          if (data.success && data.data?.items) {
            fetchedItems.push(...data.data.items)
          }
        }
      } catch {
        try {
          const localRes = await fetch('/crawl-data/twitter/posts.json')
          if (localRes.ok) {
            const data = await localRes.json()
            if (data?.items) fetchedItems.push(...data.items)
          }
        } catch {}
      }
      
      // YouTube 数据
      try {
        const youtubeRes = await fetch(`${API_BASE}/api/crawler/data/youtube`)
        if (youtubeRes.ok) {
          const data = await youtubeRes.json()
          if (data.success && data.data?.items) {
            fetchedItems.push(...data.data.items)
          }
        }
      } catch {
        try {
          const localRes = await fetch('/crawl-data/youtube/videos.json')
          if (localRes.ok) {
            const data = await localRes.json()
            if (data?.items) fetchedItems.push(...data.items)
          }
        } catch {}
      }
      
      setItems(fetchedItems)
      
      if (fetchedItems.length === 0) {
        setError('暂无数据，请先运行爬虫任务')
      }
    } catch (err) {
      console.error('Failed to fetch overseas data:', err)
      setError('数据加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 触发爬虫
  const crawl = useCallback(async () => {
    setIsCrawling(true)
    try {
      const res = await fetch(`${API_BASE}/api/crawler/crawl/all`, { method: 'POST' })
      if (res.ok) {
        const result = await res.json()
        alert(`爬取完成！${result.message}`)
        await fetchData()
      } else {
        alert('爬取失败，请查看后端日志')
      }
    } catch {
      alert('爬取请求失败，请检查后端服务')
    } finally {
      setIsCrawling(false)
    }
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 过滤和排序
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      // 平台筛选
      const matchesPlatform = selectedPlatform === 'all' || item.platform === selectedPlatform
      if (!matchesPlatform) return false
      
      // 账号筛选（多选）
      if (selectedAccounts.length > 0 && !selectedAccounts.includes(item.source_name)) return false
      
      // 搜索
      return matchesSearch(item, searchTerm)
    })
    
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return getPublishTime(b).getTime() - getPublishTime(a).getTime()
        case 'oldest':
          return getPublishTime(a).getTime() - getPublishTime(b).getTime()
        case 'popular':
          return getPopularityScore(b) - getPopularityScore(a)
        default:
          return 0
      }
    })
    
    return filtered
  }, [items, selectedPlatform, selectedAccounts, searchTerm, sortOrder])

  return {
    items,
    filteredItems,
    sourceAccounts,
    isLoading,
    isCrawling,
    error,
    selectedPlatform,
    selectedAccounts,
    searchTerm,
    sortOrder,
    setSelectedPlatform,
    setSelectedAccounts,
    setSearchTerm,
    setSortOrder,
    refresh: fetchData,
    crawl,
  }
}

