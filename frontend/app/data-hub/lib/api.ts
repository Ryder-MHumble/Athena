/**
 * 数据中心统一 API 调用层
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * 基础 fetch 封装
 */
async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * 爬虫相关 API
 */
export const crawlerApi = {
  /**
   * 获取信源列表
   */
  getSources: () => apiFetch('/api/crawler/sources'),

  /**
   * 爬取所有信源（支持异步模式）
   */
  crawlAll: (asyncMode = true) =>
    apiFetch(`/api/crawler/crawl/all?async_mode=${asyncMode}`, {
      method: 'POST',
    }),

  /**
   * 爬取 Twitter 信源
   */
  crawlTwitter: () =>
    apiFetch('/api/crawler/crawl/twitter', { method: 'POST' }),

  /**
   * 爬取 YouTube 信源
   */
  crawlYoutube: () =>
    apiFetch('/api/crawler/crawl/youtube', { method: 'POST' }),

  /**
   * 获取 Twitter 数据
   */
  getTwitterData: () => apiFetch('/api/crawler/data/twitter'),

  /**
   * 获取 YouTube 数据
   */
  getYoutubeData: () => apiFetch('/api/crawler/data/youtube'),

  /**
   * 添加信源
   */
  addSource: (url: string) =>
    apiFetch('/api/crawler/sources', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  /**
   * 删除信源
   */
  deleteSource: (platform: string, name: string) =>
    apiFetch('/api/crawler/sources', {
      method: 'DELETE',
      body: JSON.stringify({ platform, name }),
    }),

  /**
   * 获取爬虫配置
   */
  getConfig: () => apiFetch('/api/crawler/config'),

  /**
   * 更新爬虫配置
   */
  updateConfig: (config: {
    auto_crawl_enabled: boolean
    interval_seconds: number
  }) =>
    apiFetch('/api/crawler/config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  /**
   * 翻译文本
   */
  translate: (text: string, apiKey: string) =>
    apiFetch('/api/crawler/translate', {
      method: 'POST',
      body: JSON.stringify({ text, api_key: apiKey }),
    }),
}

/**
 * 导出 API_BASE 供需要的地方使用
 */
export { API_BASE }
