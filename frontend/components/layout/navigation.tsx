'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, FileText, Brain, Lightbulb, Settings, Home, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/jargon-killer', label: '术语通', icon: BookOpen },
  { href: '/paper-copilot', label: '论文伴侣', icon: FileText },
  { href: '/team-brain', label: '知识沉淀', icon: Brain },
  { href: '/flashcards', label: '单词本', icon: Lightbulb },
  { href: '/settings', label: '设置', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/20 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-serif font-bold gradient-text-primary">
              Athena
            </span>
          </Link>
          
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    isActive
                      ? "text-purple-600 bg-purple-50 shadow-sm"
                      : "text-muted-foreground hover:text-purple-600 hover:bg-purple-50/50"
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10" />
                  )}
                  <Icon className={cn(
                    "h-4 w-4 relative z-10 transition-transform duration-300",
                    isActive && "scale-110"
                  )} />
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
