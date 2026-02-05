'use client'

/**
 * 爬虫配置面板组件
 * 管理自动爬虫开关和爬取间隔设置
 */

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Clock, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { crawlerApi } from '../lib/api'

const INTERVAL_OPTIONS = [
  { value: '3600', label: '1 小时' },
  { value: '7200', label: '2 小时' },
  { value: '10800', label: '3 小时' },
  { value: '21600', label: '6 小时' },
  { value: '43200', label: '12 小时' },
  { value: '86400', label: '24 小时' },
]

interface CrawlerConfig {
  auto_crawl_enabled: boolean
  interval_seconds: number
  interval_hours: number
  last_crawl_time: string | null
}

export function CrawlerSettingsPanel() {
  const [config, setConfig] = useState<CrawlerConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const [enabled, setEnabled] = useState(false)
  const [interval, setInterval] = useState('10800')

  // 加载配置
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const data = await crawlerApi.getConfig()
      if (data.success && data.config) {
        setConfig(data.config)
        setEnabled(data.config.auto_crawl_enabled)
        setInterval(String(data.config.interval_seconds))
      }
    } catch (err: any) {
      setError(err.message || '加载配置失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setSaveStatus('idle')
    setError('')
    setIsSaving(true)

    try {
      const data = await crawlerApi.updateConfig({
        auto_crawl_enabled: enabled,
        interval_seconds: parseInt(interval),
      })

      if (data.success && data.config) {
        setConfig(data.config)
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        throw new Error(data.error || data.message || '保存失败')
      }
    } catch (err: any) {
      setError(err.message || '保存失败')
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = config && (
    enabled !== config.auto_crawl_enabled ||
    interval !== String(config.interval_seconds)
  )

  const formatLastCrawlTime = (time: string | null) => {
    if (!time) return '未爬取过'
    try {
      const date = new Date(time)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 1) return '刚刚'
      if (diffMins < 60) return `${diffMins} 分钟前`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours} 小时前`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays} 天前`
    } catch {
      return time
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* 标题 */}
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Clock className="h-4 w-4 text-cyan-600" />
          <h3 className="font-semibold text-sm text-gray-900">爬虫配置</h3>
        </div>

        {/* 自动爬虫开关 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">自动爬虫</label>
          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-600">
              {enabled ? '已启用' : '已禁用'}
            </span>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              className="data-[state=checked]:bg-cyan-600"
            />
          </div>
          <p className="text-xs text-gray-500 leading-tight">
            启用后将按设定间隔自动爬取数据
          </p>
        </div>

        {/* 爬取间隔 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">爬取间隔</label>
          <Select value={interval} onValueChange={setInterval}>
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVAL_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-sm">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 leading-tight">
            自动爬虫的执行频率
          </p>
        </div>

        {/* 上次爬取时间 */}
        {config?.last_crawl_time && (
          <div className="p-2.5 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-0.5">上次爬取</div>
            <div className="text-sm font-medium text-gray-700">
              {formatLastCrawlTime(config.last_crawl_time)}
            </div>
          </div>
        )}

        {/* 保存按钮 */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="w-full bg-cyan-600 hover:bg-cyan-700 h-9 text-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              保存中...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              保存成功
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              保存配置
            </>
          )}
        </Button>

        {/* 错误提示 */}
        {error && (
          <div className="flex items-start gap-1.5 p-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-red-700 leading-tight">{error}</span>
          </div>
        )}

        {/* 提示信息 */}
        {hasChanges && !error && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded leading-tight">
            配置已修改，请保存以应用更改
          </div>
        )}
      </div>
    </Card>
  )
}
