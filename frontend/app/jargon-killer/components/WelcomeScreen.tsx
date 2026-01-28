/**
 * 术语通欢迎界面组件
 */

import { Brain } from 'lucide-react'
import { quickPrompts } from '../utils'

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
}

export function WelcomeScreen({ onPromptSelect, textareaRef }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-8 overflow-y-auto">
      <div className="max-w-2xl w-full space-y-8">
        {/* 欢迎区 */}
        <div className="text-center space-y-6">
          <div className="inline-block p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-cyan-100 to-teal-100">
            <Brain className="h-12 w-12 sm:h-16 sm:w-16 text-cyan-600 mx-auto" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">有什么我可以帮你理解的？</h2>
            <p className="text-gray-600 text-sm sm:text-lg leading-relaxed">
              我是你的 AI 导师，可以用简洁清晰的方式解释任何技术术语和复杂概念。
            </p>
          </div>
        </div>

        {/* 快速提示 - 响应式网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                onPromptSelect(item.q)
                textareaRef.current?.focus()
              }}
              className="group relative p-4 rounded-xl border-2 border-gray-200 hover:border-cyan-400 active:border-cyan-500 transition-all text-left overflow-hidden bg-white hover:bg-cyan-50/50"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className="relative space-y-2">
                <div className="text-lg">{item.icon}</div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{item.q}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

