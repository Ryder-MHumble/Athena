/**
 * 知识卡片空状态组件
 */

import Link from 'next/link'
import { BookOpen, Search, Sparkles, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  vocabListLength: number
  searchTerm: string
  cardType?: 'all' | 'term' | 'paper'
}

export function EmptyState({ vocabListLength, searchTerm, cardType = 'all' }: EmptyStateProps) {
  const isSearchEmpty = vocabListLength > 0 && searchTerm
  const isPaperType = cardType === 'paper'

  // 根据类型决定显示内容
  const getContent = () => {
    if (isSearchEmpty) {
      return {
        icon: <Search className="h-9 w-9 text-white" />,
        title: '未找到匹配结果',
        description: `没有找到包含"${searchTerm}"的内容，试试其他关键词`,
        buttonText: '',
        buttonHref: '',
      }
    }
    
    if (isPaperType) {
      return {
        icon: <FileText className="h-9 w-9 text-white" />,
        title: '开始收藏你的第一篇论文分析',
        description: '在论文伴侣中分析论文，点击"收藏"按钮即可将分析结果保存到这里',
        buttonText: '前往论文伴侣',
        buttonHref: '/paper-copilot',
        gradient: 'from-purple-500 to-pink-500',
        shadowColor: 'shadow-purple-500/20',
        buttonGradient: 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
        buttonShadow: 'shadow-purple-500/25 hover:shadow-purple-500/40',
      }
    }
    
    return {
      icon: <BookOpen className="h-9 w-9 text-white" />,
      title: '开始收藏你的第一个术语',
      description: '在术语通中学习新概念，点击"保存"按钮即可将 AI 回复添加到知识卡片',
      buttonText: '前往术语通学习',
      buttonHref: '/jargon-killer',
      gradient: 'from-cyan-500 to-teal-500',
      shadowColor: 'shadow-cyan-500/20',
      buttonGradient: 'from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600',
      buttonShadow: 'shadow-cyan-500/25 hover:shadow-cyan-500/40',
    }
  }

  const content = getContent()

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20">
      {/* 图标容器 */}
      <div className="relative mb-6">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${content.gradient || 'from-cyan-500 to-teal-500'} flex items-center justify-center shadow-lg ${content.shadowColor || 'shadow-cyan-500/20'}`}>
          {content.icon}
        </div>
        {!isSearchEmpty && (
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>

      {/* 标题和描述 */}
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
        {content.title}
      </h2>
      <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto text-center leading-relaxed">
        {content.description}
      </p>

      {/* 操作按钮 */}
      {!isSearchEmpty && content.buttonHref && (
        <Link href={content.buttonHref}>
          <Button className={`h-11 px-6 bg-gradient-to-r ${content.buttonGradient} text-white shadow-lg ${content.buttonShadow} transition-all font-medium rounded-xl`}>
            {isPaperType ? <FileText className="w-4 h-4 mr-2" /> : <BookOpen className="w-4 h-4 mr-2" />}
            {content.buttonText}
          </Button>
        </Link>
      )}
    </div>
  )
}

