/**
 * 主页 Footer 组件 - 重构版本
 */

import Link from "next/link"
import { Github, BookOpen, MessageSquare, Heart, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const footerLinks = {
  '产品': [
    { label: '术语通', href: '/jargon-killer' },
    { label: '论文伴侣', href: '/paper-copilot' },
    { label: '知识沉淀', href: '/team-brain' },
    { label: '知识卡片', href: '/flashcards' },
  ],
  '资源': [
    { label: '数据中心', href: '/data-hub' },
    { label: '设置', href: '/settings' },
  ],
  '支持': [
    { label: 'GitHub', href: 'https://github.com/Ryder-MHumble/Athena', external: true },
    { label: '文档', href: '#', external: false },
    { label: '反馈', href: '#', external: false },
  ]
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 主要内容区域 */}
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Logo 和描述 */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <img 
                  src="/Logo.png" 
                  alt="Athena Logo" 
                  className="h-8 w-8 object-contain"
                />
                <span className="text-xl font-serif font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Athena
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                专为非技术背景用户设计的 AI 智能工作台，让学习和研究更高效。
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Made with AI</span>
              </div>
            </div>

            {/* 链接组 */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  {category}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => {
                    const Component = link.external ? 'a' : Link
                    const props = link.external 
                      ? { href: link.href, target: '_blank', rel: 'noopener noreferrer' }
                      : { href: link.href }
                    
                    return (
                      <li key={link.label}>
                        <Component
                          {...props}
                          className="text-sm text-gray-600 hover:text-cyan-600 transition-colors flex items-center gap-2 group"
                        >
                          {link.label}
                          {link.external && (
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                              ↗
                            </span>
                          )}
                        </Component>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 底部版权信息 */}
        <div className="border-t border-slate-200 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>© 2024 Athena.</span>
              <span className="hidden sm:inline">让学习更智能。</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <a 
                href="https://github.com/Ryder-MHumble/Athena" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
              >
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <div className="flex items-center gap-1 text-xs">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                <span>Open Source</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

