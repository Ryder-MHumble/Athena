'use client'

/**
 * 统一筛选面板组件 - 三栏布局
 * 左侧：排序和时间
 * 中间：渠道筛选
 * 右侧：账号筛选
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  Search, X, Filter, Check, Calendar, User,
  Globe, Youtube, ArrowUpDown
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { SORT_OPTIONS } from '../constants'
import type { OverseasPlatform, SortOrder } from '../types'
import type { SourceAccount, DateRange, FilterPanelProps } from './types'

// X Logo 组件
const XLogoIcon = ({ className }: { className?: string }) => (
  <img src="/X-logo.png" alt="X" className={className} />
)

// 平台配置
const PLATFORM_OPTIONS = [
  { id: 'twitter' as const, label: 'X    ', icon: XLogoIcon, color: 'bg-black' },
  { id: 'youtube' as const, label: 'YouTube', icon: Youtube, color: 'bg-red-600' },
]

// 日期预设
const DATE_PRESETS = [
  { label: '全部', value: { start: null, end: null } },
  { label: '今天', value: { start: 'today', end: 'today' } },
  { label: '3天', value: { start: '3days', end: null } },
  { label: '7天', value: { start: '7days', end: null } },
  { label: '30天', value: { start: '30days', end: null } },
]

export function UnifiedFilterPanel({
  isOpen,
  onClose,
  accounts,
  selectedAccounts,
  selectedPlatforms,
  dateRange,
  sortOrder,
  onAccountsChange,
  onPlatformsChange,
  onDateRangeChange,
  onSortChange,
}: Omit<FilterPanelProps, 'onAddSource'>) {
  const [accountSearchTerm, setAccountSearchTerm] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // 根据选中的渠道过滤账号列表
  const filteredByPlatform = selectedPlatforms.length === 0
    ? accounts 
    : accounts.filter(a => selectedPlatforms.includes(a.platform as OverseasPlatform))
  
  // 根据搜索词过滤
  const filteredAccounts = accountSearchTerm 
    ? filteredByPlatform.filter(a => 
        a.name.toLowerCase().includes(accountSearchTerm.toLowerCase()) ||
        (a.username && a.username.toLowerCase().includes(accountSearchTerm.toLowerCase()))
      )
    : filteredByPlatform

  // 切换单个账号选中状态
  const toggleAccount = (accountName: string) => {
    if (selectedAccounts.includes(accountName)) {
      onAccountsChange(selectedAccounts.filter(a => a !== accountName))
    } else {
      onAccountsChange([...selectedAccounts, accountName])
    }
  }

  // 切换平台选中状态
  const togglePlatform = (platformId: OverseasPlatform) => {
    if (selectedPlatforms.includes(platformId)) {
      onPlatformsChange(selectedPlatforms.filter(p => p !== platformId))
    } else {
      onPlatformsChange([...selectedPlatforms, platformId])
    }
  }

  const getActiveDateLabel = () => {
    if (!dateRange.start && !dateRange.end) return '全部'
    if (dateRange.start === 'today') return '今天'
    if (dateRange.start === '3days') return '3天'
    if (dateRange.start === '7days') return '7天'
    if (dateRange.start === '30days') return '30天'
    return '自定义'
  }

  // 格式化粉丝数
  const formatFollowers = (count?: number) => {
    if (!count) return ''
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
    return count.toString()
  }

  // 重置所有筛选
  const handleReset = () => {
    onAccountsChange([])
    onPlatformsChange([])
    onDateRangeChange({ start: null, end: null })
    onSortChange('newest')
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" onClick={onClose} />
      <div
        ref={panelRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200/80 z-50 w-[1100px] max-w-[95vw] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* 面板头部 */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-cyan-50 via-white to-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
              <Filter className="h-4 w-4 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">筛选与排序</h3>
              <p className="text-xs text-gray-500">自定义数据展示方式</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* 三栏布局 */}
        <div className="flex">
          {/* 左侧：排序和时间 */}
          <div className="w-[220px] bg-gradient-to-b from-slate-50 to-white p-4 border-r border-gray-100">
            {/* 排序 */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-cyan-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">排序</span>
              </div>
              <div className="space-y-1">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => onSortChange(opt.id)}
                    className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all flex items-center justify-between ${
                      sortOrder === opt.id
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortOrder === opt.id && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 时间 */}
            <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Calendar className="h-3.5 w-3.5 text-cyan-600" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">时间</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {DATE_PRESETS.map((preset) => {
                    const isActive = getActiveDateLabel() === preset.label
                    return (
                      <button
                        key={preset.label}
                        onClick={() => onDateRangeChange(preset.value)}
                        className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
                {/* 自定义日期 */}
                <div className="space-y-2">
                  <input
                    type="date"
                    value={dateRange.start && !['today', '3days', '7days', '30days'].includes(dateRange.start) ? dateRange.start : ''}
                    onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value || null })}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none bg-white"
                    placeholder="开始日期"
                  />
                  <input
                    type="date"
                    value={dateRange.end && dateRange.end !== 'today' ? dateRange.end : ''}
                    onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value || null })}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none bg-white"
                    placeholder="结束日期"
                  />
                </div>
              </div>

              {/* 重置按钮 */}
              <button
                onClick={handleReset}
                className="w-full mt-5 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                重置全部筛选
              </button>
            </div>

          {/* 中间：渠道筛选 */}
          <div className="w-[200px] p-4 border-r border-gray-100 bg-white">
            <div className="flex items-center gap-1.5 mb-3">
              <Globe className="h-3.5 w-3.5 text-cyan-600" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">渠道</span>
              {selectedPlatforms.length > 0 && (
                <span className="text-xs text-cyan-600">({selectedPlatforms.length})</span>
              )}
            </div>
            
            <p className="text-xs text-gray-400 mb-3">
              {selectedPlatforms.length === 0 ? '显示全部渠道' : '已选择渠道'}
            </p>
            
            <div className="space-y-2">
              {PLATFORM_OPTIONS.map(platform => {
                const Icon = platform.icon
                const isSelected = selectedPlatforms.includes(platform.id)
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                      isSelected 
                        ? 'bg-cyan-50 border-2 border-cyan-400 shadow-sm' 
                        : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${isSelected ? 'text-cyan-700' : 'text-gray-700'}`}>
                        {platform.label}
                      </span>
                      <p className="text-xs text-gray-400">
                        {accounts.filter(a => a.platform === platform.id).length} 个账号
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* 清空渠道选择 */}
            {selectedPlatforms.length > 0 && (
              <button
                onClick={() => onPlatformsChange([])}
                className="w-full mt-3 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                显示全部渠道
              </button>
            )}
          </div>

          {/* 右侧：账号选择 */}
          <div className="flex-1 flex flex-col max-h-[450px]">
            {/* 账号头部 */}
            <div className="px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-cyan-600" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">信源账号</span>
                  <span className="text-xs text-gray-400">({filteredAccounts.length})</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => onAccountsChange(filteredAccounts.map(a => a.username || a.name))}
                    className="text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    全选
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => onAccountsChange([])}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    清空
                  </button>
                </div>
              </div>
              
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索账号..."
                  value={accountSearchTerm}
                  onChange={(e) => setAccountSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none bg-gray-50"
                />
              </div>

              {/* 已选中标签 */}
              {selectedAccounts.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5 max-h-[52px] overflow-y-auto">
                  {selectedAccounts.map(accountId => {
                    // 从 accounts 中查找对应的账号信息以获取显示名称
                    const account = accounts.find(a => (a.username || a.name) === accountId)
                    const displayName = account?.name || accountId
                    return (
                      <span
                        key={accountId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 rounded text-xs text-cyan-700 border border-cyan-200"
                      >
                        {displayName.length > 12 ? displayName.slice(0, 12) + '...' : displayName}
                        <button onClick={() => toggleAccount(accountId)} className="hover:text-cyan-900">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 账号网格列表 */}
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50/50">
              {filteredAccounts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  {accountSearchTerm ? '未找到匹配的账号' : '暂无账号'}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredAccounts.map((account) => {
                    // 使用 username 作为唯一标识符（如果存在），否则使用 name
                    const accountId = account.username || account.name
                    const isSelected = selectedAccounts.includes(accountId)
                    return (
                      <button
                        key={accountId}
                        onClick={() => toggleAccount(accountId)}
                        className={`p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 ${
                          isSelected 
                            ? 'bg-cyan-50 border-2 border-cyan-400 shadow-sm' 
                            : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        {/* 头像 */}
                        <div className="relative flex-shrink-0">
                          {account.avatar ? (
                            <img 
                              src={account.avatar} 
                              alt={account.name}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                              {account.platform === 'twitter' ? (
                                <img src="/X-logo.png" alt="X" className="h-4 w-4 object-contain" />
                              ) : (
                                <Youtube className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          )}
                          {/* 选中指示器 */}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* 信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className={`text-sm font-medium truncate ${isSelected ? 'text-cyan-700' : 'text-gray-800'}`}>
                              {account.name.length > 10 ? account.name.slice(0, 10) + '...' : account.name}
                            </span>
                            {account.verified && (
                              <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {account.platform === 'twitter' ? (
                              <img src="/X-logo.png" alt="X" className="h-3 w-3 object-contain" />
                            ) : (
                              <Youtube className="h-3 w-3 text-red-400" />
                            )}
                            {account.followers && (
                              <span className="text-xs text-gray-400">{formatFollowers(account.followers)}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 底部操作栏 */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-gray-500">
                已选 <span className="font-semibold text-cyan-600">{selectedAccounts.length}</span> 个账号
              </span>
              <Button
                onClick={onClose}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6"
              >
                应用筛选
              </Button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

