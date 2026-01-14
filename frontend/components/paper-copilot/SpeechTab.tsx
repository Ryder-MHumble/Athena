import React, { useMemo } from 'react'
import { AlertCircle, CheckCircle, Lightbulb, Target } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export interface SpeechTabProps {
  speech: string
}

interface SuggestionItem {
  title: string
  description: string
  examples: string
  key_takeaway: string
}

const tryParseSpeech = (speech: string): SuggestionItem[] | null => {
  try {
    if (!speech || speech.trim().length === 0) return null
    
    // 尝试提取 JSON
    let jsonStr = speech.trim()
    
    // 如果不是以 { 开头，尝试找到 JSON 部分
    if (!jsonStr.startsWith('{')) {
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      } else {
        // 无法找到 JSON，返回 null，使用 markdown 渲染
        return null
      }
    }
    
    const parsed = JSON.parse(jsonStr)
    if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
      return parsed.suggestions
    }
    return null
  } catch (error) {
    console.warn('Failed to parse speech JSON:', error)
    return null
  }
}

const SuggestionCard: React.FC<{ item: SuggestionItem; index: number }> = ({ item, index }) => {
  const icons = [
    <Target className="h-5 w-5" key="target" />,
    <Lightbulb className="h-5 w-5" key="lightbulb" />,
    <CheckCircle className="h-5 w-5" key="check" />,
    <AlertCircle className="h-5 w-5" key="alert" />,
  ]

  const colors = [
    { border: 'border-cyan-500', bg: 'bg-cyan-50', title: 'text-cyan-900', label: 'text-cyan-700' },
    { border: 'border-blue-500', bg: 'bg-blue-50', title: 'text-blue-900', label: 'text-blue-700' },
    { border: 'border-purple-500', bg: 'bg-purple-50', title: 'text-purple-900', label: 'text-purple-700' },
    { border: 'border-emerald-500', bg: 'bg-emerald-50', title: 'text-emerald-900', label: 'text-emerald-700' },
    { border: 'border-orange-500', bg: 'bg-orange-50', title: 'text-orange-900', label: 'text-orange-700' },
    { border: 'border-pink-500', bg: 'bg-pink-50', title: 'text-pink-900', label: 'text-pink-700' },
  ]

  const color = colors[index % colors.length]
  const icon = icons[index % icons.length]

  return (
    <div className={`border-l-4 ${color.border} ${color.bg} rounded-r-lg p-5 transition-all hover:shadow-md`}>
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-lg text-gray-600">{icon}</div>
        <h3 className={`text-lg font-bold ${color.title}`}>{item.title}</h3>
      </div>

      {/* 讲解内容 */}
      <div className="space-y-3">
        {/* 详细描述 */}
        <div>
          <p className={`text-xs font-semibold uppercase ${color.label} mb-2`}>讲解内容</p>
          <p className="text-gray-800 text-sm leading-relaxed">{item.description}</p>
        </div>

        {/* 生活类比 */}
        <div>
          <p className={`text-xs font-semibold uppercase ${color.label} mb-2`}>生活类比</p>
          <p className="text-gray-700 text-sm leading-relaxed italic">{item.examples}</p>
        </div>

        {/* 核心要点 */}
        <div className="bg-white p-3 rounded border border-gray-200">
          <p className={`text-xs font-semibold uppercase ${color.label} mb-2`}>核心要点</p>
          <p className="text-gray-900 font-semibold text-sm">{item.key_takeaway}</p>
        </div>
      </div>
    </div>
  )
}

export const SpeechTab: React.FC<SpeechTabProps> = ({ speech }) => {
  const suggestions = useMemo(() => tryParseSpeech(speech), [speech])

  // 如果成功解析为 JSON，使用结构化卡片
  if (suggestions && suggestions.length > 0) {
    return (
      <div className="space-y-4">
        {suggestions.map((item, index) => (
          <SuggestionCard key={index} item={item} index={index} />
        ))}
      </div>
    )
  }

  // 否则，将内容作为 Markdown 渲染
  if (speech && speech.trim()) {
    return (
      <div
        className="prose prose-sm max-w-none
          prose-p:text-gray-800 prose-p:leading-relaxed prose-p:m-0
          prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
          prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
          prose-strong:text-gray-900 prose-strong:font-semibold
          prose-code:text-cyan-600 prose-code:bg-cyan-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-xs prose-code:font-mono
          prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-3 prose-pre:rounded-lg
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
          prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
          prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2
          prose-li:text-gray-800 prose-li:text-sm prose-li:my-1
          prose-blockquote:border-l-4 prose-blockquote:border-cyan-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700"
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeHighlight]}
        >
          {speech}
        </ReactMarkdown>
      </div>
    )
  }

  // 内容为空
  return (
    <div className="text-center text-gray-500 py-12">
      <p className="text-sm">讲解内容加载中...</p>
    </div>
  )
}
