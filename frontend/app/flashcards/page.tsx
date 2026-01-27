'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/useAppStore'
import { Input } from '@/components/ui/input'
import { Trash2, Copy, Check, BookOpen, Search, Filter, RotateCcw, Share2, ArrowLeft, Clock, Zap } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.css'

export default function FlashcardsPage() {
  const { vocabList, removeVocab, recordReview } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set())
  const [filterMode, setFilterMode] = useState<'all' | 'recent' | 'frequent'>('all')

  const filteredVocab = vocabList
    .filter((item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.explanation?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (filterMode === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (filterMode === 'frequent') {
        return (b.reviewCount || 0) - (a.reviewCount || 0)
      }
      return 0
    })

  const handleDelete = (id: string) => {
    removeVocab(id)
    toast.success('已删除')
  }

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success('已复制')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  const toggleFlip = (id: string) => {
    setFlippedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
        recordReview(id)
      }
      return newSet
    })
  }

  return (
    <div className="h-full bg-gradient-to-br from-white via-cyan-50/30 to-white flex flex-col overflow-hidden">
      {/* 搜索和筛选栏 */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* 搜索框 */}
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
              <Input
                placeholder="搜索术语或定义..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* 筛选按钮 */}
            <div className="flex gap-2">
              <Button
                variant={filterMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterMode('all')}
                className={`text-sm transition-all ${
                  filterMode === 'all'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-md hover:shadow-lg'
                    : 'border-gray-300 hover:border-cyan-300 hover:bg-cyan-50'
                }`}
              >
                全部
              </Button>
              <Button
                variant={filterMode === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterMode('recent')}
                className={`text-sm transition-all flex items-center gap-1.5 ${
                  filterMode === 'recent'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-md hover:shadow-lg'
                    : 'border-gray-300 hover:border-cyan-300 hover:bg-cyan-50'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                最近
              </Button>
              <Button
                variant={filterMode === 'frequent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterMode('frequent')}
                className={`text-sm transition-all flex items-center gap-1.5 ${
                  filterMode === 'frequent'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-md hover:shadow-lg'
                    : 'border-gray-300 hover:border-cyan-300 hover:bg-cyan-50'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                热门
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto">
          {filteredVocab.length === 0 ? (
            <div className="text-center py-16 sm:py-24">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 mb-6">
                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-cyan-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {vocabList.length === 0 ? '暂无术语收藏' : '搜索无结果'}
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {vocabList.length === 0 
                  ? '在术语通中学习新概念，点击"保存"可将AI回复添加到单词本'
                  : '试试修改搜索条件或筛选方式'
                }
              </p>
              {vocabList.length === 0 && (
                <Link href="/jargon-killer">
                  <Button className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white shadow-lg hover:shadow-cyan-500/30 transition-all font-medium">
                    <BookOpen className="w-4 h-4 mr-2" />
                    前往术语通学习
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div>
              {/* 统计信息 */}
              <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                <div className="text-sm text-gray-600">
                  显示 <span className="font-bold text-gray-900">{filteredVocab.length}</span> 个术语
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
                  >
                    清除搜索
                    <RotateCcw className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* 网格布局 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filteredVocab.map((vocab) => {
                  const isFlipped = flippedIds.has(vocab.id)
                  const reviewCount = vocab.reviewCount || 0
                  
                  return (
                    <div key={vocab.id} className="group">
                      {/* 卡片容器 - 3D翻转效果 */}
                      <div
                        onClick={() => toggleFlip(vocab.id)}
                        className="h-72 cursor-pointer perspective transition-all"
                        style={{
                          perspective: '1000px',
                        }}
                      >
                        <div
                          className="relative w-full h-full transition-transform duration-500 ease-out"
                          style={{
                            transformStyle: 'preserve-3d',
                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                          }}
                        >
                          {/* 正面 - 术语 */}
                          <div
                            className="absolute w-full h-full bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-600 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow border border-cyan-400/50 overflow-hidden"
                            style={{ backfaceVisibility: 'hidden' }}
                          >
                            {/* 装饰背景 */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />

                            <div className="relative space-y-4 flex-1 flex flex-col justify-center">
                              <div className="text-xs sm:text-sm font-semibold text-cyan-100 uppercase tracking-widest opacity-75">点击翻转查看</div>
                              <h3 className="text-2xl sm:text-4xl font-bold text-white break-words leading-tight">
                                {vocab.term}
                              </h3>
                            </div>

                            <div className="relative flex items-center justify-between">
                              <div className="text-xs text-cyan-100">
                                复习 <span className="font-semibold">{reviewCount}</span> 次
                              </div>
                              <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                reviewCount === 0 ? 'bg-cyan-400/30 text-cyan-100' :
                                reviewCount < 3 ? 'bg-cyan-300/40 text-cyan-100' :
                                'bg-green-300/40 text-white'
                              }`}>
                                {reviewCount === 0 ? '新' : reviewCount < 3 ? '学中' : '掌握'}
                              </div>
                            </div>
                          </div>

                          {/* 背面 - 解释 */}
                          <div
                            className="absolute w-full h-full bg-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow border border-gray-200 overflow-hidden"
                            style={{
                              backfaceVisibility: 'hidden',
                              transform: 'rotateY(180deg)',
                            }}
                          >
                            {/* 背面装饰 */}
                            <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-100/20 rounded-full blur-2xl" />

                            {/* 解释内容 */}
                            <div className="flex-1 overflow-y-auto relative prose prose-sm max-w-none text-xs sm:text-sm
                              prose-p:text-gray-700 prose-p:leading-snug prose-p:m-0 prose-p:mb-2
                              prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-2 prose-headings:mb-1
                              prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
                              prose-strong:text-gray-900 prose-strong:font-semibold
                              prose-code:text-cyan-600 prose-code:bg-cyan-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                              prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-2 prose-pre:rounded prose-pre:overflow-x-auto
                              prose-a:text-cyan-600 prose-a:no-underline hover:prose-a:underline
                              prose-ul:list-disc prose-ul:pl-4 prose-ul:my-1
                              prose-ol:list-decimal prose-ol:pl-4 prose-ol:my-1
                              prose-li:text-gray-700 prose-li:text-xs prose-li:my-0
                              prose-blockquote:border-l-4 prose-blockquote:border-cyan-300 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:my-2">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                              >
                                {vocab.explanation.length > 350 ? vocab.explanation.slice(0, 350) + '...' : vocab.explanation}
                              </ReactMarkdown>
                            </div>

                            {/* 日期和元数据 */}
                            <div className="relative mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                              <span>{new Date(vocab.createdAt).toLocaleDateString('zh-CN')}</span>
                              <span>更新于 {new Date(vocab.updatedAt || vocab.createdAt).toLocaleDateString('zh-CN')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(vocab.explanation, vocab.id)}
                          className="flex-1 text-xs h-9 border border-gray-300 hover:border-cyan-400 hover:bg-cyan-50 text-gray-700 hover:text-cyan-600 transition-all"
                        >
                          {copiedId === vocab.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 mr-1.5" />
                              复制
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(vocab.id)}
                          className="flex-1 text-xs h-9 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          删除
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
