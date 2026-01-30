/**
 * Firecrawl API 服务封装
 * 用于调用本地部署的 Firecrawl 服务进行网页爬取
 */

// Firecrawl API 配置
const FIRECRAWL_BASE_URL = process.env.NEXT_PUBLIC_FIRECRAWL_URL || 'https://firecrawl.ihainan.me'

/**
 * Firecrawl 爬取请求参数
 */
export interface FirecrawlScrapeRequest {
  url: string
  formats?: ('markdown' | 'html' | 'rawHtml' | 'content' | 'links' | 'screenshot')[]
  timeout?: number
}

/**
 * Firecrawl 爬取响应元数据
 */
export interface FirecrawlMetadata {
  ogImage?: string
  'twitter-site-verification'?: string
  'fb:app_id'?: string
  title?: string
  viewport?: string
  'og:site_name'?: string
  'og:image'?: string
  ogSiteName?: string
  'og:title'?: string
  ogTitle?: string
  'facebook-domain-verification'?: string
  'google-site-verification'?: string
  'theme-color'?: string[]
  language?: string
  favicon?: string
  scrapeId?: string
  sourceURL?: string
  url?: string
  statusCode?: number
  contentType?: string
  proxyUsed?: string
}

/**
 * Firecrawl 爬取响应数据
 */
export interface FirecrawlScrapeData {
  markdown?: string
  html?: string
  rawHtml?: string
  content?: string
  links?: string[]
  screenshot?: string
  metadata?: FirecrawlMetadata
}

/**
 * Firecrawl API 响应
 */
export interface FirecrawlScrapeResponse {
  success: boolean
  data?: FirecrawlScrapeData
  error?: string
}

/**
 * 爬取任务状态
 */
export type ScrapeStatus = 'idle' | 'scraping' | 'success' | 'error'

/**
 * 爬取历史记录
 */
export interface ScrapeHistoryItem {
  id: string
  url: string
  title?: string
  status: ScrapeStatus
  timestamp: number
  data?: FirecrawlScrapeData
  error?: string
}

/**
 * Firecrawl 服务类
 */
class FirecrawlService {
  private baseUrl: string

  constructor(baseUrl: string = FIRECRAWL_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * 爬取单个 URL
   */
  async scrape(request: FirecrawlScrapeRequest): Promise<FirecrawlScrapeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: request.url,
          formats: request.formats || ['markdown','html'],
          timeout: request.timeout || 60000,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data as FirecrawlScrapeResponse
    } catch (error: any) {
      console.error('Firecrawl scrape error:', error)
      return {
        success: false,
        error: error.message || '爬取失败，请检查 URL 是否正确',
      }
    }
  }

  /**
   * 批量爬取多个 URL
   */
  async batchScrape(
    urls: string[],
    options?: Omit<FirecrawlScrapeRequest, 'url'>,
    onProgress?: (completed: number, total: number, result: FirecrawlScrapeResponse) => void
  ): Promise<FirecrawlScrapeResponse[]> {
    const results: FirecrawlScrapeResponse[] = []
    
    for (let i = 0; i < urls.length; i++) {
      const result = await this.scrape({
        url: urls[i],
        ...options,
      })
      results.push(result)
      
      if (onProgress) {
        onProgress(i + 1, urls.length, result)
      }
    }
    
    return results
  }

  /**
   * 提取网页核心内容
   */
  extractContent(data: FirecrawlScrapeData): {
    title: string
    content: string
    description: string
    url: string
    favicon: string
  } {
    const metadata = data.metadata || {}
    
    return {
      title: metadata.title || metadata['og:title'] || metadata.ogTitle || '未知标题',
      content: data.markdown || data.content || '',
      description: metadata['og:title'] || '',
      url: metadata.sourceURL || metadata.url || '',
      favicon: metadata.favicon || '',
    }
  }
}

// 导出单例实例
export const firecrawl = new FirecrawlService()

// 导出服务类供自定义配置使用
export { FirecrawlService }

