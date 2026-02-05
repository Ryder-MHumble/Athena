'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { OverseasItem, OverseasPlatform, SortOrder } from './types'
import { crawlerApi } from '../../lib/api'
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
  // 统一使用 username 作为唯一标识符
  const sourceAccounts = useMemo(() => {
    const accountMap = new Map<string, SourceAccount>()

    // 先添加 Twitter 作者（包含头像等详情）
    twitterAuthors.forEach(author => {
      if (author.username) {
        accountMap.set(author.username, {
          name: author.name,  // 显示名称
          platform: 'twitter',
          username: author.username,
          avatar: author.avatar,
          followers: author.followers,
          verified: author.verified,
        })
      }
    })

    // 添加 YouTube 频道和其他平台的账号
    items.forEach(item => {
      // 只处理 YouTube 或者不在 accountMap 中的账号
      if (item.platform === 'youtube') {
        const sourceName = item.source_name
        if (sourceName && !accountMap.has(sourceName)) {
          accountMap.set(sourceName, {
            name: sourceName,
            platform: 'youtube'
          })
        }
      }
      // Twitter 账号已经从 twitterAuthors 中添加，跳过
    })

    return Array.from(accountMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [items, twitterAuthors])
  
  // 切换平台时清空不匹配的已选账号
  const setSelectedPlatforms = useCallback((platforms: OverseasPlatform[]) => {
    setSelectedPlatformsState(platforms)
    // 当选择具体平台时，清除与新平台不匹配的已选账号
    if (platforms.length > 0 && !platforms.includes('all')) {
      setSelectedAccounts(prev =>
        prev.filter(accountId => {
          // 使用 username 或 name 查找账号
          const account = sourceAccounts.find(a => (a.username || a.name) === accountId)
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
        const data = await crawlerApi.getTwitterData()
        if (data.success && data.data?.items) {
          fetchedItems.push(...data.data.items)
        }
        // 从 API 响应中获取作者信息（解决线上环境无法访问静态文件的问题）
        if (data.authors && data.authors.length > 0) {
          setTwitterAuthors(data.authors)
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
        const data = await crawlerApi.getYoutubeData()
        if (data.success && data.data?.items) {
          fetchedItems.push(...data.data.items)
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

  // 触发爬虫 - 支持后台异步模式，通过 task_id 追踪状态
  const crawl = useCallback(async () => {
    setIsCrawling(true)
    setError(null)
    try {
      // 使用异步模式，后台执行爬取
      const result = await crawlerApi.crawlAll(true)
      const taskId = result.task_id
      console.log('[Crawler] Task started:', result.message, 'task_id:', taskId)

      // 轮询检查任务状态（每5秒，最多60次=5分钟）
      let pollCount = 0
      const pollInterval = setInterval(async () => {
        pollCount++
        if (pollCount > 60) {
          clearInterval(pollInterval)
          setIsCrawling(false)
          return
        }

        try {
          // 通过 task_id 检查爬取是否完成
          if (taskId) {
            const status = await crawlerApi.getCrawlStatus(taskId)
            if (status.success && status.task) {
              if (status.task.status === 'completed') {
                console.log('[Crawler] Crawl completed:', status.task.result)
                clearInterval(pollInterval)
                setIsCrawling(false)
                await fetchData() // 最终刷新数据
                return
              } else if (status.task.status === 'failed') {
                console.error('[Crawler] Crawl failed:', status.task.error)
                clearInterval(pollInterval)
                setIsCrawling(false)
                setError(`爬取失败: ${status.task.error}`)
                return
              }
            }
          }

          // 同时尝试刷新数据（即使状态检查失败）
          await fetchData()
        } catch {
          // 忽略轮询错误
        }
      }, 5000)

      // 5分钟后强制停止
      setTimeout(() => {
        clearInterval(pollInterval)
        setIsCrawling(false)
      }, 300000)
    } catch (err) {
      console.error('[Crawler] Request error:', err)
      setError(`爬取请求失败: ${err instanceof Error ? err.message : '未知错误'}`)
      setIsCrawling(false)
    }
  }, [fetchData])

  useEffect(() => {
    fetchData()

    // 监听自定义刷新事件（用于添加新信源后立即刷新）
    const handleRefresh = () => {
      fetchData()
    }

    window.addEventListener('refresh-overseas-data', handleRefresh)
    return () => {
      window.removeEventListener('refresh-overseas-data', handleRefresh)
    }
  }, [fetchData])

  // 过滤和排序
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      // 平台筛选（支持多选）
      const matchesPlatform = selectedPlatforms.length === 0 ||
        selectedPlatforms.includes('all') ||
        selectedPlatforms.includes(item.platform as OverseasPlatform)
      if (!matchesPlatform) return false

      // 账号筛选（多选）- 修复：Twitter 使用 author.username，YouTube 使用 source_name
      if (selectedAccounts.length > 0) {
        const itemIdentifier = item.platform === 'twitter'
          ? (item as any).author?.username  // Twitter 使用 username
          : item.source_name  // YouTube 使用 source_name

        if (!itemIdentifier || !selectedAccounts.includes(itemIdentifier)) {
          return false
        }
      }

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

