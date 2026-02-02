'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { OverseasItem, OverseasPlatform, SortOrder } from './types'
import { API_BASE } from './constants'
import { getPublishTime, getPopularityScore, matchesSearch } from './utils'

interface SourceAccount {
  name: string
  platform: 'twitter' | 'youtube'
  username?: string
  avatar?: string
  followers?: number
  verified?: boolean
}

interface UseOverseasDataReturn {
  items: OverseasItem[]
  filteredItems: OverseasItem[]
  sourceAccounts: SourceAccount[]
  isLoading: boolean
  isCrawling: boolean
  error: string | null
  selectedPlatforms: OverseasPlatform[]
  selectedAccounts: string[]
  searchTerm: string
  sortOrder: SortOrder
  setSelectedPlatforms: (platforms: OverseasPlatform[]) => void
  setSelectedAccounts: (accounts: string[]) => void
  setSearchTerm: (term: string) => void
  setSortOrder: (order: SortOrder) => void
  refresh: () => Promise<void>
  crawl: () => Promise<void>
}

interface TwitterAuthor {
  username: string
  name: string
  avatar: string
  followers: number
  verified: boolean
  platform: 'twitter'
}

export function useOverseasData(): UseOverseasDataReturn {
  const [items, setItems] = useState<OverseasItem[]>([])
  const [twitterAuthors, setTwitterAuthors] = useState<TwitterAuthor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCrawling, setIsCrawling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedPlatforms, setSelectedPlatformsState] = useState<OverseasPlatform[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  
  // 提取所有独立的账号列表，优先使用 authors.json 中的详细信息
  const sourceAccounts = useMemo(() => {
    const accountMap = new Map<string, SourceAccount>()
    // 用于快速查找 username 是否已存在
    const usernameSet = new Set<string>()
    
    // 先添加 Twitter 作者（包含头像等详情）
    twitterAuthors.forEach(author => {
      if (author.name && !accountMap.has(author.name)) {
        accountMap.set(author.name, {
          name: author.name,
          platform: 'twitter',
          username: author.username,
          avatar: author.avatar,
          followers: author.followers,
          verified: author.verified,
        })
        // 同时记录 username，防止后续重复添加
        if (author.username) {
          usernameSet.add(author.username.toLowerCase())
        }
      }
    })
    
    // 再添加其他来源的账号（如 YouTube），跳过已有的 Twitter 账号
    items.forEach(item => {
      const name = item.source_name
      if (!name) return
      
      // 检查是否已存在（通过 name 或 username）
      const nameLower = name.toLowerCase()
      if (accountMap.has(name) || usernameSet.has(nameLower)) {
        return
      }
      
      accountMap.set(name, { name, platform: item.platform })
    })
    
    return Array.from(accountMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [items, twitterAuthors])
  
  // 切换平台时清空不匹配的已选账号
  const setSelectedPlatforms = useCallback((platforms: OverseasPlatform[]) => {
    setSelectedPlatformsState(platforms)
    // 当选择具体平台时，清除与新平台不匹配的已选账号
    if (platforms.length > 0 && !platforms.includes('all')) {
      setSelectedAccounts(prev => 
        prev.filter(accountName => {
          const account = sourceAccounts.find(a => a.name === accountName)
          return account && platforms.includes(account.platform as OverseasPlatform)
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
          // 从 API 响应中获取作者信息（解决线上环境无法访问静态文件的问题）
          if (data.authors && data.authors.length > 0) {
            setTwitterAuthors(data.authors)
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
        
        // 仅在 API 失败时尝试从静态文件加载作者信息（本地开发备用）
        try {
          const authorsRes = await fetch('/crawl-data/twitter/authors.json')
          if (authorsRes.ok) {
            const authorsData = await authorsRes.json()
            if (authorsData?.authors) {
              setTwitterAuthors(authorsData.authors)
            }
          }
        } catch {
          console.log('authors.json not found, will extract from items')
        }
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

  // 触发爬虫 - 支持后台异步模式
  const crawl = useCallback(async () => {
    setIsCrawling(true)
    try {
      // 使用异步模式，后台执行爬取
      const res = await fetch(`${API_BASE}/api/crawler/crawl/all?async_mode=true`, { method: 'POST' })
      if (res.ok) {
        const result = await res.json()
        // 显示友好提示，不阻塞用户
        console.log('[Crawler] Task started:', result.message)
        
        // 轮询检查数据更新（每5秒检查一次，最多检查60次=5分钟）
        let pollCount = 0
        const pollInterval = setInterval(async () => {
          pollCount++
          if (pollCount > 60) {
            clearInterval(pollInterval)
            setIsCrawling(false)
            return
          }
          
          try {
            await fetchData()
            // 检查数据是否有更新（可以通过比较 items 数量或时间戳）
          } catch {
            // 忽略轮询错误
          }
        }, 5000)
        
        // 30秒后停止显示爬取状态（但继续后台轮询）
        setTimeout(() => {
          setIsCrawling(false)
        }, 30000)
      } else {
        setIsCrawling(false)
        console.error('[Crawler] Failed to start')
      }
    } catch (err) {
      console.error('[Crawler] Request error:', err)
      setIsCrawling(false)
    }
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 过滤和排序
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      // 平台筛选（支持多选）
      const matchesPlatform = selectedPlatforms.length === 0 || 
        selectedPlatforms.includes('all') || 
        selectedPlatforms.includes(item.platform as OverseasPlatform)
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
  }, [items, selectedPlatforms, selectedAccounts, searchTerm, sortOrder])

  return {
    items,
    filteredItems,
    sourceAccounts,
    isLoading,
    isCrawling,
    error,
    selectedPlatforms,
    selectedAccounts,
    searchTerm,
    sortOrder,
    setSelectedPlatforms,
    setSelectedAccounts,
    setSearchTerm,
    setSortOrder,
    refresh: fetchData,
    crawl,
  }
}

