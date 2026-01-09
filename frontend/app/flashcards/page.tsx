'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/useAppStore'
import { Input } from '@/components/ui/input'
import { Trash2, Copy, Check, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.css'

export default function FlashcardsPage() {
  const { vocabList, removeVocab } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredVocab = vocabList.filter((item) =>
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.explanation?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <Link 
                href="/" 
                className="text-sm text-purple-600 hover:text-purple-700 mb-2 inline-flex items-center gap-1 font-medium"
              >
                ← 返回首页
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">单词本</h1>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">{filteredVocab.length}</p>
              <p className="text-sm text-gray-600">
                {vocabList.length === 1 ? '个术语已收藏' : '个术语已收藏'}
              </p>
            </div>
          </div>

          {/* 搜索框 */}
          <Input
            placeholder="搜索术语或解释..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-0 rounded-lg px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {filteredVocab.length === 0 ? (
            <div className="text-center py-16 space-y-6">
              <div className="text-6xl">📚</div>
              <h2 className="text-2xl font-semibold text-gray-900">暂无术语</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                去术语通学习新概念，点击"保存"可将回复加入单词本
              </p>
              <Link href="/jargon-killer">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <BookOpen className="w-4 h-4 mr-2" />
                  前往术语通
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVocab.map((vocab) => (
                <div
                  key={vocab.id}
                  className="border-2 border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all bg-white"
                >
                  {/* 标题行 */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 break-words">
                        {vocab.term}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        保存于 {new Date(vocab.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(vocab.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* AI 回复内容 */}
                  <div className="bg-gray-50 rounded-lg p-5 mb-4 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-3">AI 回复</p>
                    <div className="prose prose-sm max-w-none
                      prose-p:text-gray-800 prose-p:leading-relaxed prose-p:m-0
                      prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-2
                      prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
                      prose-strong:text-gray-900
                      prose-code:text-purple-600 prose-code:bg-white prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-xs prose-code:font-mono
                      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto
                      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                      prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
                      prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2
                      prose-li:text-gray-800 prose-li:text-sm prose-li:my-1
                      prose-blockquote:border-l-4 prose-blockquote:border-purple-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex, rehypeHighlight]}
                      >
                        {vocab.explanation}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(vocab.explanation, vocab.id)}
                      className="text-xs border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                    >
                      {copiedId === vocab.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          复制回复
                        </>
                      )}
                    </Button>
                  </div>

                  {/* 如果有完整上下文信息 */}
                  {vocab.context?.question && vocab.context?.question !== vocab.term && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <details className="cursor-pointer">
                        <summary className="text-xs font-semibold text-gray-600 uppercase hover:text-gray-900">
                          查看完整对话
                        </summary>
                        <div className="mt-3 space-y-2 text-xs text-gray-700 bg-white p-3 rounded border border-gray-100">
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">问题：</p>
                            <p className="text-gray-700">{vocab.context.question}</p>
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
