/**
 * 论文分析详情弹窗组件
 */

import { VocabItem } from '@/stores/useAppStore'
import { X, FileText, AlertTriangle, Lightbulb, Key, Sparkles, AlertCircle, Pin, Copy, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface PaperAnalysisModalProps {
  vocab: VocabItem
  isOpen: boolean
  onClose: () => void
  onCopy: () => void
  onDelete: () => void
  copiedId: string | null
}

export function PaperAnalysisModal({ vocab, isOpen, onClose, onCopy, onDelete, copiedId }: PaperAnalysisModalProps) {
  if (!isOpen) return null

  const paper = vocab.paperAnalysis

  // 安全获取字段
  const safeGet = (value: any, defaultVal: string = '未提供'): string => {
    if (Array.isArray(value)) return value.join('\n')
    return String(value || defaultVal)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative w-full max-w-3xl max-h-[85vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex-shrink-0 flex items-start justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {paper?.title || vocab.term}
              </h2>
              {(paper?.authors || paper?.year) && (
                <p className="text-sm text-gray-500 mt-1">
                  {paper?.authors && <span>{paper.authors}</span>}
                  {paper?.authors && paper?.year && <span> • </span>}
                  {paper?.year && <span>{paper.year}</span>}
                </p>
              )}
              {paper?.category && (
                <span className="inline-block mt-2 text-xs font-medium text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full">
                  {paper.category}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 核心问题 */}
          {paper?.coreProblem && (
            <AnalysisSection
              icon={<div className="w-2 h-2 rounded-full bg-blue-500" />}
              title="🎯 核心问题"
              bgColor="bg-blue-50"
              borderColor="border-l-blue-400"
            >
              <p className="text-sm text-gray-700 leading-relaxed">{paper.coreProblem}</p>
            </AnalysisSection>
          )}

          {/* 先前困境 */}
          {paper?.previousDilemma && (
            <AnalysisSection
              icon={<div className="w-2 h-2 rounded-full bg-amber-500" />}
              title="🚧 先前困境"
              bgColor="bg-amber-50"
              borderColor="border-l-amber-400"
            >
              <p className="text-sm text-gray-700 leading-relaxed">{paper.previousDilemma}</p>
            </AnalysisSection>
          )}

          {/* 核心直觉 */}
          {paper?.coreIntuition && (
            <AnalysisSection
              icon={<div className="w-2 h-2 rounded-full bg-purple-500" />}
              title="💡 核心直觉"
              bgColor="bg-purple-50"
              borderColor="border-l-purple-400"
            >
              <p className="text-sm text-gray-700 leading-relaxed">{paper.coreIntuition}</p>
            </AnalysisSection>
          )}

          {/* 关键步骤 */}
          {paper?.keySteps && paper.keySteps.length > 0 && (
            <AnalysisSection
              icon={<div className="w-2 h-2 rounded-full bg-emerald-500" />}
              title="🔑 关键步骤"
              bgColor="bg-emerald-50"
              borderColor="border-l-emerald-400"
            >
              <ol className="space-y-2">
                {paper.keySteps.map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            </AnalysisSection>
          )}

          {/* 创新点 */}
          {paper?.innovations && (
            <AnalysisSection
              icon={<div className="w-2 h-2 rounded-full bg-pink-500" />}
              title="✨ 创新增量"
              bgColor="bg-pink-50"
              borderColor="border-l-pink-400"
            >
              <div className="space-y-3">
                {paper.innovations.comparison && (
                  <div className="bg-white/60 rounded-lg p-3 border border-pink-100">
                    <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide mb-1">对比分析</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{paper.innovations.comparison}</p>
                  </div>
                )}
                {paper.innovations.essence && (
                  <div className="bg-white/60 rounded-lg p-3 border border-pink-100">
                    <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide mb-1">本质创新</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{paper.innovations.essence}</p>
                  </div>
                )}
              </div>
            </AnalysisSection>
          )}

          {/* 边界与局限 */}
          {paper?.boundaries && (
            <AnalysisSection
              icon={<div className="w-2 h-2 rounded-full bg-orange-500" />}
              title="⚠️ 边界与局限"
              bgColor="bg-orange-50"
              borderColor="border-l-orange-400"
            >
              <div className="space-y-3">
                {paper.boundaries.assumptions && (
                  <div className="bg-white/60 rounded-lg p-3 border border-orange-100">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">关键假设</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{paper.boundaries.assumptions}</p>
                  </div>
                )}
                {paper.boundaries.unsolved && (
                  <div className="bg-white/60 rounded-lg p-3 border border-orange-100">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">未解决问题</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{paper.boundaries.unsolved}</p>
                  </div>
                )}
              </div>
            </AnalysisSection>
          )}

          {/* 一句话总结 */}
          {paper?.oneSentence && (
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 shadow-lg border border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16" />
              <div className="relative flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Pin className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1.5">一言以蔽之</p>
                  <p className="text-sm leading-relaxed italic font-light text-white">
                    "{paper.oneSentence}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-gray-400">
            收藏于 {new Date(vocab.createdAt).toLocaleDateString('zh-CN')}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              className="text-xs h-8"
            >
              {copiedId === vocab.id ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  复制摘要
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDelete()
                onClose()
              }}
              className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              删除
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 分析区块组件
function AnalysisSection({ 
  icon, 
  title, 
  children, 
  bgColor, 
  borderColor 
}: { 
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  bgColor: string
  borderColor: string
}) {
  return (
    <div className={`${bgColor} rounded-lg p-4 border-l-4 ${borderColor}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

