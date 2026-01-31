/**
 * 术语通欢迎界面组件 - 全新设计
 */

import Image from 'next/image'
import { Sparkles, ArrowRight } from 'lucide-react'
import { quickPrompts } from '../utils'

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
}

export function WelcomeScreen({ onPromptSelect, textareaRef }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-8 overflow-y-auto">
      <div className="max-w-3xl w-full py-8">
        {/* 欢迎区 - 全新设计 */}
        <div className="text-center mb-10">
          {/* Logo */}
          <div className="relative inline-block mb-6">
            <Image 
              src="/Logo.png" 
              alt="Athena Logo" 
              width={120} 
              height={120} 
              className="h-24 w-24 sm:h-28 sm:w-28 mx-auto drop-shadow-lg"
              priority
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* 标题和描述 */}
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-3">
            有什么我可以帮你理解的？
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            我是你的 AI 导师，擅长用通俗易懂的语言和生活化类比，帮你秒懂任何技术概念
          </p>
        </div>

        {/* 快速提示 - 卡片式设计 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                onPromptSelect(item.q)
                textareaRef.current?.focus()
              }}
              className="group relative flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-100/50 transition-all duration-300 text-left"
            >
              {/* 图标 */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-cyan-50 group-hover:to-teal-50 flex items-center justify-center text-lg transition-colors flex-shrink-0">
                {item.icon}
              </div>
              
              {/* 文字 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 leading-snug line-clamp-2 transition-colors">
                  {item.q}
                </p>
              </div>
              
              {/* 箭头 */}
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>
          ))}
        </div>
        
        {/* 底部提示 */}
        <p className="text-center text-xs text-gray-400 mt-8">
          💡 你也可以直接在下方输入框中提问任何问题
        </p>
      </div>
    </div>
  )
}

