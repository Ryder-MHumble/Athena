'use client'

/**
 * 爬虫配置主页面
 * 管理信源列表、添加/删除信源、配置自动爬虫
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { AddSourceModal } from './AddSourceModal'
import { SourceCard } from './SourceCard'
import { CrawlerSettingsPanel } from './CrawlerSettingsPanel'
import { crawlerApi } from '../lib/api'

interface Source {
  name: string
  username?: string  // Twitter账号的username，用于删除等操作
  url: string
}

interface SourcesData {
  twitter: Source[]
  youtube: Source[]
}

interface AuthorInfo {
  username: string
  name: string
  avatar: string
  followers: number
  verified: boolean
  description?: string
  platform: string
}

export function CrawlerConfigSection() {
  const [sources, setSources] = useState<SourcesData | null>(null)
  const [authors, setAuthors] = useState<AuthorInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isCrawling, setIsCrawling] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // 加载信源列表和作者信息
  useEffect(() => {
    loadSources()
    loadAuthors()
  }, [refreshKey])

  const loadSources = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await crawlerApi.getSources()
      if (data.success && data.sources) {
        setSources(data.sources)
      }
    } catch (err: any) {
      setError(err.message || '加载信源列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAuthors = async () => {
    try {
      // 优先从 API 获取作者信息（解决线上环境无法访问静态文件的问题）
      const data = await crawlerApi.getTwitterData()
      if (data.success && data.authors && data.authors.length > 0) {
        setAuthors(data.authors)
        return
      }
    } catch (err) {
      console.warn('从 API 加载作者信息失败，尝试静态文件:', err)
    }

    // 降级方案：本地开发环境从静态文件加载
    try {
      const response = await fetch('/crawl-data/twitter/authors.json')
      if (response.ok) {
        const data = await response.json()
        setAuthors(data.authors || [])
      }
    } catch (err) {
      console.warn('加载作者信息失败:', err)
    }
  }

  // 根据用户名查找作者信息
  const getAuthorInfo = (name: string) => {
    return authors.find(
      (author) => author.username.toLowerCase() === name.toLowerCase() ||
                  author.name.toLowerCase() === name.toLowerCase()
    )
  }

  // 添加信源
  const handleAddSource = async (urls: string[]) => {
    const errors: string[] = []
    let successCount = 0
    const newAuthors: AuthorInfo[] = []

    for (const url of urls) {
      try {
        const data = await crawlerApi.addSource(url)
        if (data.success) {
          successCount++

          // 如果后端返回了账号信息，立即添加到本地缓存
          if (data.account_info) {
            newAuthors.push(data.account_info)
          }
        } else {
          errors.push(`${url}: ${data.error || data.message || '添加失败'}`)
        }
      } catch (err: any) {
        errors.push(`${url}: ${err.message || '网络错误'}`)
      }
    }

    // 立即更新作者列表
    if (newAuthors.length > 0) {
      setAuthors(prev => {
        // 合并新作者，避免重复
        const existingUsernames = new Set(prev.map(a => a.username))
        const uniqueNew = newAuthors.filter(a => !existingUsernames.has(a.username))
        return [...prev, ...uniqueNew]
      })
    }

    // 刷新信源列表
    if (successCount > 0) {
      setRefreshKey(prev => prev + 1)

      // 启动轮询，确保后台爬取完成后能更新数据（最多轮询10次，每次3秒）
      let pollCount = 0
      const pollInterval = setInterval(async () => {
        pollCount++
        if (pollCount > 10) {
          clearInterval(pollInterval)
          return
        }

        try {
          await loadAuthors()
        } catch (err) {
          console.warn('轮询加载作者信息失败:', err)
        }
      }, 3000)
    }

    // 如果有错误，抛出
    if (errors.length > 0) {
      if (successCount > 0) {
        throw new Error(`成功添加 ${successCount} 个，失败 ${errors.length} 个:\n${errors.join('\n')}`)
      } else {
        throw new Error(errors.join('\n'))
      }
    }
  }

  // 删除信源
  const handleDeleteSource = async (platform: string, name: string) => {
    setError('')
    console.log('[Frontend] Deleting source:', { platform, name })
    try {
      const data = await crawlerApi.deleteSource(platform, name)
      console.log('[Frontend] Delete response:', data)
      if (!data.success) {
        throw new Error(data.error || data.message || '删除失败')
      }

      // 刷新列表
      setRefreshKey(prev => prev + 1)
    } catch (err: any) {
      console.error('[Frontend] Delete error:', err)
      const errorMsg = err.message || '删除失败'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }

  // 手动触发爬取
  const handleCrawl = async () => {
    setIsCrawling(true)
    setError('')
    try {
      const data = await crawlerApi.crawlAll(false) // 同步模式
      console.log('爬取完成:', data)
      // 可以显示成功提示
    } catch (err: any) {
      setError(err.message || '爬取失败')
    } finally {
      setIsCrawling(false)
    }
  }

  // 过滤信源
  const filteredSources = useMemo(() => {
    if (!sources) return { twitter: [], youtube: [] }
    if (!searchTerm) return sources

    const term = searchTerm.toLowerCase()
    return {
      twitter: sources.twitter.filter(
        s => s.name.toLowerCase().includes(term) || s.url.toLowerCase().includes(term)
      ),
      youtube: sources.youtube.filter(
        s => s.name.toLowerCase().includes(term) || s.url.toLowerCase().includes(term)
      ),
    }
  }, [sources, searchTerm])

  const twitterCount = filteredSources.twitter.length
  const youtubeCount = filteredSources.youtube.length
  const totalCount = twitterCount + youtubeCount

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加信源
            </Button>
            <Button
              onClick={handleCrawl}
              disabled={isCrawling || totalCount === 0}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isCrawling ? 'animate-spin' : ''}`} />
              {isCrawling ? '爬取中...' : '手动触发爬取'}
            </Button>
          </div>

          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索信源..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-gray-300 focus:border-cyan-500"
            />
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 信源列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
            </div>
          ) : totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Search className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {searchTerm ? '未找到匹配的信源' : '暂无信源'}
              </p>
              {!searchTerm && (
                <p className="text-sm mt-2">点击上方"添加信源"按钮开始添加</p>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Twitter 信源 */}
              {twitterCount > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 px-1">
                    <span className="flex items-center justify-center w-5 h-5 bg-gray-900 text-white text-xs font-bold rounded">
                      𝕏
                    </span>
                    Twitter 信源 ({twitterCount})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                    {filteredSources.twitter.map((source) => {
                      // 提取username：优先使用source.username，其次从URL提取
                      let username = source.username
                      if (!username) {
                        // 从URL提取username: https://x.com/fortnow -> fortnow
                        const urlParts = source.url.replace(/\/$/, '').split('/')
                        username = urlParts[urlParts.length - 1]
                      }

                      console.log('[SourceCard] Rendering:', {
                        name: source.name,
                        username: username,
                        sourceUsername: source.username,
                        url: source.url
                      })

                      const authorInfo = getAuthorInfo(username)
                      return (
                        <SourceCard
                          key={source.username || source.name}
                          platform="twitter"
                          name={username}  // 传递username用于删除操作和显示@xxx
                          displayName={source.name}  // 传递显示名称
                          url={source.url}
                          avatar={authorInfo?.avatar}
                          followers={authorInfo?.followers}
                          verified={authorInfo?.verified}
                          description={authorInfo?.description}
                          onDelete={handleDeleteSource}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* YouTube 信源 */}
              {youtubeCount > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 px-1">
                    <span className="flex items-center justify-center w-5 h-5 bg-red-600 text-white text-xs font-bold rounded">
                      ▶
                    </span>
                    YouTube 信源 ({youtubeCount})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                    {filteredSources.youtube.map((source) => (
                      <SourceCard
                        key={source.name}
                        platform="youtube"
                        name={source.name}
                        url={source.url}
                        onDelete={handleDeleteSource}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧配置面板 - 缩小宽度 */}
        <div className="flex-shrink-0 w-64 border-l border-gray-200 bg-white p-4 overflow-y-auto">
          <CrawlerSettingsPanel />
        </div>
      </div>

      {/* 添加信源弹窗 */}
      <AddSourceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSource}
      />
    </div>
  )
}
