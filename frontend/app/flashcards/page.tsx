'use client'

/**
 * 灵感单词本模块
 * 显示从术语通收藏的术语，支持卡片翻转和搜索
 */

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/useAppStore'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'
import { Search, Trash2, RotateCcw, BookOpen, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'

export default function FlashcardsPage() {
  const { vocabList, removeVocab, clearVocabList } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())

  // 过滤词汇列表
  const filteredVocabList = useMemo(() => {
    if (!searchQuery.trim()) return vocabList
    const query = searchQuery.toLowerCase()
    return vocabList.filter(
      (item) =>
        item.term.toLowerCase().includes(query) ||
        item.explanation.toLowerCase().includes(query)
    )
  }, [vocabList, searchQuery])

  // 切换卡片翻转状态
  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // 删除词汇
  const handleDelete = (id: string, term: string) => {
    if (confirm(`确定要删除 "${term}" 吗？`)) {
      removeVocab(id)
      toast.success('已删除')
    }
  }

  // 清空所有词汇
  const handleClearAll = () => {
    if (confirm('确定要清空所有词汇吗？此操作不可恢复。')) {
      clearVocabList()
      toast.success('已清空')
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
      <div>
              <h1 className="text-4xl font-serif font-bold gradient-text-primary">灵感单词本</h1>
              <p className="text-muted-foreground mt-1">
          收藏的术语和概念，随时复习
        </p>
            </div>
          </div>
          {vocabList.length > 0 && (
            <Button variant="outline" onClick={handleClearAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              清空全部
            </Button>
          )}
        </div>
      </div>
      
      {/* 搜索框 */}
      <Card className="glass border-0 shadow-xl p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索术语或解释..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
      </Card>

      {/* 词汇卡片网格 */}
      {filteredVocabList.length === 0 ? (
        <Card className="glass border-0 shadow-xl p-12 text-center bg-white/90 backdrop-blur-sm">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400 opacity-50" />
          <p className="text-gray-600">
            {searchQuery
              ? '没有找到匹配的词汇'
              : vocabList.length === 0
              ? '还没有收藏任何术语，去术语通模块收藏一些吧！'
              : '没有找到匹配的词汇'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVocabList.map((item) => {
            const isFlipped = flippedCards.has(item.id)
            return (
              <div
                key={item.id}
                className="relative h-64 perspective-1000"
                style={{
                  perspective: '1000px',
                }}
              >
                <Card
                  className={`absolute inset-0 transition-transform duration-500 preserve-3d cursor-pointer glass border-0 shadow-xl hover:shadow-2xl ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                  onClick={() => toggleFlip(item.id)}
                >
                  {/* 正面：术语 */}
                  <div
                    className="absolute inset-0 backface-hidden p-6 flex flex-col items-center justify-center"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(0deg)',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    <div className="text-center space-y-4">
                      <BookOpen className="h-12 w-12 mx-auto text-accent opacity-50" />
                      <h3 className="text-2xl font-serif font-bold">{item.term}</h3>
                      <p className="text-sm text-muted-foreground">
                        点击卡片查看解释
        </p>
      </div>
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(item.id, item.term)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 背面：解释 */}
                  <div
                    className="absolute inset-0 backface-hidden p-6 overflow-auto custom-scrollbar"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-serif font-bold">{item.term}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFlip(item.id)
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="prose prose-sm max-w-none 
                        prose-p:text-gray-700 prose-p:leading-relaxed 
                        prose-headings:text-gray-900 prose-headings:font-semibold
                        prose-strong:text-gray-900
                        prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                        prose-ul:list-disc prose-ol:list-decimal
                        prose-pre:bg-gray-900 prose-pre:text-gray-100
                        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                        prose-blockquote:border-l-4 prose-blockquote:border-purple-300 prose-blockquote:pl-4 prose-blockquote:italic">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex, rehypeHighlight]}
                        >
                          {item.explanation || '暂无解释'}
                        </ReactMarkdown>
                      </div>
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        {new Date(item.createdAt).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* 统计信息 */}
      {vocabList.length > 0 && (
        <Card className="glass border-0 shadow-xl p-4">
          <p className="text-sm text-muted-foreground text-center">
            共 {vocabList.length} 个词汇
            {searchQuery && ` · 找到 ${filteredVocabList.length} 个匹配项`}
          </p>
        </Card>
      )}
    </div>
  )
}
