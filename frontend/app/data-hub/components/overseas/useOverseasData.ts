'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { OverseasItem, OverseasPlatform, SortOrder } from './types'
import { API_BASE } from './constants'
import { getPublishTime, getPopularityScore, matchesSearch } from './utils'

interface UseOverseasDataReturn {
  items: OverseasItem[]
  filteredItems: OverseasItem[]
  isLoading: boolean
  isCrawling: boolean
  error: string | null
  selectedPlatform: OverseasPlatform
  searchTerm: string
  sortOrder: SortOrder
  setSelectedPlatform: (platform: OverseasPlatform) => void
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
  
  const [selectedPlatform, setSelectedPlatform] = useState<OverseasPlatform>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

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
      const matchesPlatform = selectedPlatform === 'all' || item.platform === selectedPlatform
      if (!matchesPlatform) return false
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
  }, [items, selectedPlatform, searchTerm, sortOrder])

  return {
    items,
    filteredItems,
    isLoading,
    isCrawling,
    error,
    selectedPlatform,
    searchTerm,
    sortOrder,
    setSelectedPlatform,
    setSearchTerm,
    setSortOrder,
    refresh: fetchData,
    crawl,
  }
}

