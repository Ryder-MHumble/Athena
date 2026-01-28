'use client'

/**
 * 知识卡片页面 - 支持术语和论文分析两种类型
 */

import { useState } from 'react'
import { Lightbulb, Filter, ArrowUpDown, Plus, BookOpen, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFlashcards } from './hooks/useFlashcards'
import { SearchBar } from './components/SearchBar'
import { EmptyState } from './components/EmptyState'
import { FlashcardCard } from './components/FlashcardCard'
import { cn } from '@/lib/utils'

type CardTypeFilter = 'all' | 'term' | 'paper'

export default function FlashcardsPage() {
  const {
    vocabList,
    filteredVocab,
    searchTerm,
    filterMode,
    copiedId,
    flippedIds,
    setSearchTerm,
    setFilterMode,
    handleDelete,
    handleCopy,
    toggleFlip,
  } = useFlashcards()

  const [sortMode, setSortMode] = useState<'recent' | 'alpha'>('recent')
  const [cardTypeFilter, setCardTypeFilter] = useState<CardTypeFilter>('all')

  // 根据卡片类型筛选
  const typeFilteredVocab = filteredVocab.filter(v => {
    if (cardTypeFilter === 'all') return true
    const type = v.type || 'term'
    return type === cardTypeFilter
  })

  // 计算统计数据
  const totalCount = vocabList.length
  const termCount = vocabList.filter(v => !v.type || v.type === 'term').length
  const paperCount = vocabList.filter(v => v.type === 'paper').length
  const masteredCount = vocabList.filter(v => (v.reviewCount || 0) >= 3).length
  
  // 计算掌握进度百分比
  const masteryPercentage = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 页面头部 */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* 标题和描述 */}
              <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">知识卡片</h1>
              <p className="text-sm text-gray-500 mt-1">收藏术语与论文分析，构建你的知识体系</p>
            </div>
            
            {/* 掌握进度卡片 */}
            {totalCount > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-sm font-medium text-gray-600">掌握进度</span>
                  <span className="text-lg font-bold text-cyan-600">{masteryPercentage}%</span>
                </div>
                {/* 进度条 */}
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden w-40">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${masteryPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  已掌握 {masteredCount} / {totalCount} 张卡片
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 分类标签栏 */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pb-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCardTypeFilter('all')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                cardTypeFilter === 'all'
                  ? "bg-cyan-100 text-cyan-700 border border-cyan-200"
                  : "bg-white text-gray-600 border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50"
              )}
            >
              全部 ({totalCount})
            </button>
            <button
              onClick={() => setCardTypeFilter('term')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
                cardTypeFilter === 'term'
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-white text-gray-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              术语 ({termCount})
            </button>
            <button
              onClick={() => setCardTypeFilter('paper')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
                cardTypeFilter === 'paper'
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : "bg-white text-gray-600 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              论文分析 ({paperCount})
            </button>
          </div>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pb-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* 搜索框 */}
            <div className="flex-1">
      <SearchBar
        searchTerm={searchTerm}
        filterMode={filterMode}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilterMode}
      />
            </div>
            
            {/* 操作按钮组 */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortMode(sortMode === 'recent' ? 'alpha' : 'recent')}
                className="h-10 px-3 border-slate-200 hover:border-cyan-300 hover:bg-cyan-50"
              >
                <ArrowUpDown className="h-4 w-4 mr-1.5 text-gray-500" />
                <span className="text-sm">排序: {sortMode === 'recent' ? '最近' : '字母'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto">
          {typeFilteredVocab.length === 0 ? (
            <EmptyState vocabListLength={vocabList.length} searchTerm={searchTerm} cardType={cardTypeFilter} />
          ) : (
            <div>
              {/* 卡片网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {typeFilteredVocab.map((vocab) => (
                  <FlashcardCard
                    key={vocab.id}
                    vocab={vocab}
                    isFlipped={flippedIds.has(vocab.id)}
                    copiedId={copiedId}
                    onFlip={() => toggleFlip(vocab.id)}
                    onCopy={() => handleCopy(vocab.explanation, vocab.id)}
                    onDelete={() => handleDelete(vocab.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
