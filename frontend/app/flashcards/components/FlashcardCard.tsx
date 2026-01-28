/**
 * 知识卡片组件 - 支持术语和论文分析两种类型
 */

import { useState } from 'react'
import { VocabItem } from '@/stores/useAppStore'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.css'
import { Trash2, Copy, Check, RotateCcw, FileText, ExternalLink } from 'lucide-react'
import { PaperAnalysisModal } from './PaperAnalysisModal'

interface FlashcardCardProps {
  vocab: VocabItem
  isFlipped: boolean
  copiedId: string | null
  onFlip: () => void
  onCopy: () => void
  onDelete: () => void
}

export function FlashcardCard({ vocab, isFlipped, copiedId, onFlip, onCopy, onDelete }: FlashcardCardProps) {
  const [showModal, setShowModal] = useState(false)
  
  const reviewCount = vocab.reviewCount || 0
  const isPaper = vocab.type === 'paper'
  
  const statusConfig = reviewCount === 0 
    ? { label: '新', bg: 'bg-cyan-400/30', text: 'text-cyan-100' }
    : reviewCount < 3 
    ? { label: '学习中', bg: 'bg-amber-400/30', text: 'text-amber-100' }
    : { label: '已掌握', bg: 'bg-emerald-400/30', text: 'text-emerald-100' }

  // 论文类型使用不同的颜色配置
  const paperStatusConfig = reviewCount === 0 
    ? { label: '新', bg: 'bg-purple-400/30', text: 'text-purple-100' }
    : reviewCount < 3 
    ? { label: '学习中', bg: 'bg-amber-400/30', text: 'text-amber-100' }
    : { label: '已掌握', bg: 'bg-emerald-400/30', text: 'text-emerald-100' }

  const currentStatusConfig = isPaper ? paperStatusConfig : statusConfig

  // 处理点击事件
  const handleClick = () => {
    if (isPaper) {
      // 论文类型：打开弹窗
      setShowModal(true)
    } else {
      // 术语类型：翻转卡片
      onFlip()
    }
  }

  return (
    <>
      <div className="group relative">
        {/* 卡片容器 - 3D翻转效果 */}
        <div
          onClick={handleClick}
          className="h-64 cursor-pointer"
          style={{ perspective: '1000px' }}
        >
          <div
            className="relative w-full h-full transition-transform duration-500 ease-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: !isPaper && isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* 正面 - 术语/论文标题 */}
            <div
              className={`absolute w-full h-full rounded-2xl p-6 flex flex-col shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all overflow-hidden ${
                isPaper 
                  ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 border border-purple-400/30'
                  : 'bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-600 border border-cyan-400/30'
              }`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              {/* 装饰背景 */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-xl" />
              
              {/* 顶部状态标签 */}
              <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isPaper && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      论文
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${currentStatusConfig.bg} ${currentStatusConfig.text}`}>
                    {currentStatusConfig.label}
                  </span>
                </div>
                <span className={`text-[10px] flex items-center gap-1 ${isPaper ? 'text-purple-200/80' : 'text-cyan-200/80'}`}>
                  <RotateCcw className="h-3 w-3" />
                  {reviewCount}
                </span>
              </div>

              {/* 术语/论文标题内容 */}
              <div className="relative flex-1 flex flex-col justify-center">
                <p className={`text-[10px] font-medium uppercase tracking-wider mb-2 ${isPaper ? 'text-purple-200/70' : 'text-cyan-200/70'}`}>
                  {isPaper ? '点击查看详情' : '点击翻转'}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-white break-words leading-tight line-clamp-3">
                  {vocab.term}
                </h3>
                {/* 论文类型显示一句话摘要 */}
                {isPaper && vocab.paperAnalysis?.oneSentence && (
                  <p className="text-xs text-white/70 mt-3 line-clamp-2 italic">
                    "{vocab.paperAnalysis.oneSentence}"
                  </p>
                )}
              </div>

              {/* 底部日期和查看详情 */}
              <div className={`relative mt-auto pt-3 border-t flex items-center justify-between ${isPaper ? 'border-purple-400/20' : 'border-cyan-400/20'}`}>
                <span className={`text-[10px] ${isPaper ? 'text-purple-200/60' : 'text-cyan-200/60'}`}>
                  {new Date(vocab.createdAt).toLocaleDateString('zh-CN')}
                </span>
                {isPaper && (
                  <span className="text-[10px] text-white/80 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    查看详情
                  </span>
                )}
              </div>
            </div>

            {/* 背面 - 解释（仅术语类型使用） */}
            {!isPaper && (
              <div
                className="absolute w-full h-full bg-white rounded-2xl p-6 flex flex-col shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all border border-slate-200 overflow-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                {/* 装饰背景 */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-cyan-100/30 rounded-full blur-2xl" />

                {/* 顶部标题 */}
                <div className="relative flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-cyan-500 to-teal-500" />
                  <span className="text-xs font-semibold text-gray-700 truncate">{vocab.term}</span>
                </div>

                {/* 内容 */}
                <div className="flex-1 overflow-y-auto relative prose prose-sm max-w-none text-xs
                  prose-p:text-gray-600 prose-p:leading-relaxed prose-p:m-0 prose-p:mb-2
                  prose-headings:text-gray-800 prose-headings:font-semibold prose-headings:mt-2 prose-headings:mb-1
                  prose-h1:text-sm prose-h2:text-xs prose-h3:text-xs
                  prose-strong:text-gray-800
                  prose-code:text-cyan-600 prose-code:bg-cyan-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[10px] prose-code:font-mono
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-[10px] prose-pre:p-2 prose-pre:rounded prose-pre:overflow-x-auto
                  prose-a:text-cyan-600 prose-a:no-underline hover:prose-a:underline
                  prose-ul:list-disc prose-ul:pl-4 prose-ul:my-1
                  prose-ol:list-decimal prose-ol:pl-4 prose-ol:my-1
                  prose-li:text-gray-600 prose-li:text-xs prose-li:my-0">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeHighlight]}
                  >
                    {vocab.explanation.length > 300 ? vocab.explanation.slice(0, 300) + '...' : vocab.explanation}
                  </ReactMarkdown>
                </div>

                {/* 底部操作 */}
                <div className="relative mt-3 pt-3 border-t border-gray-100 flex items-center justify-end gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCopy()
                    }}
                    className="p-1.5 rounded-lg hover:bg-cyan-50 text-gray-400 hover:text-cyan-600 transition-colors"
                    title="复制内容"
                  >
                    {copiedId === vocab.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="删除卡片"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 论文分析详情弹窗 */}
      {isPaper && (
        <PaperAnalysisModal
          vocab={vocab}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onCopy={onCopy}
          onDelete={onDelete}
          copiedId={copiedId}
        />
      )}
    </>
  )
}

