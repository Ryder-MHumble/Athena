'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BookOpen, 
  FileText, 
  Brain, 
  Lightbulb, 
  Settings, 
  Home, 
  Sparkles, 
  Database, 
  ChevronDown,
  Zap,
  FolderOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 单独的导航项
const singleItems = [
  { href: '/', label: '首页', icon: Home },
]

// 下拉菜单组
const dropdownGroups = [
  {
    id: 'ai-tools',
    label: 'AI 工具',
    icon: Zap,
    items: [
      { href: '/jargon-killer', label: '术语通', icon: BookOpen, description: 'AI 实时解释专业术语' },
      { href: '/paper-copilot', label: '论文伴侣', icon: FileText, description: '智能解析学术论文' },
    ]
  },
  {
    id: 'knowledge',
    label: '知识管理',
    icon: FolderOpen,
    items: [
      { href: '/team-brain', label: '知识沉淀', icon: Brain, description: '团队知识库检索' },
      { href: '/flashcards', label: '单词本', icon: Lightbulb, description: '概念收藏与复习' },
    ]
  }
]

// 重要的单独项
const highlightedItems = [
  { href: '/data-hub', label: '数据中心', icon: Database },
  { href: '/settings', label: '设置', icon: Settings },
]

function DropdownMenu({ group, pathname }: { group: typeof dropdownGroups[0], pathname: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 检查当前路径是否在该组内
  const isActiveGroup = group.items.some(item => pathname === item.href)

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div 
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          isActiveGroup
            ? "text-cyan-600 bg-cyan-50"
            : "text-gray-600 hover:text-cyan-600 hover:bg-cyan-50/50"
        )}
      >
        <group.icon className="h-4 w-4" />
        <span className="hidden sm:inline">{group.label}</span>
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* 下拉菜单 */}
      <div className={cn(
        "absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 transition-all duration-200",
        isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
      )}>
        {group.items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-start gap-3 px-4 py-2.5 transition-colors",
                isActive
                  ? "bg-cyan-50 text-cyan-600"
                  : "text-gray-700 hover:bg-gray-50"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Icon className={cn(
                "h-4 w-4 mt-0.5 flex-shrink-0",
                isActive ? "text-cyan-600" : "text-gray-400"
              )} />
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/20 backdrop-blur-xl bg-white/80">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <img 
              src="/Logo.png" 
              alt="Athena Logo" 
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain group-hover:scale-110 transition-transform duration-300"
            />
            <span className="text-xl font-serif font-bold gradient-text-primary hidden sm:inline">
              Athena
            </span>
          </Link>
          
          {/* 导航项 */}
          <div className="flex items-center gap-1">
            {/* 首页 */}
            {singleItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-cyan-600 bg-cyan-50"
                      : "text-gray-600 hover:text-cyan-600 hover:bg-cyan-50/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}

            {/* 分隔线 */}
            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

            {/* 下拉菜单组 */}
            {dropdownGroups.map((group) => (
              <DropdownMenu key={group.id} group={group} pathname={pathname} />
            ))}

            {/* 分隔线 */}
            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

            {/* 数据中心 - 高亮显示 */}
            <Link
              href="/data-hub"
              className={cn(
                "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === '/data-hub'
                  ? "text-white bg-gradient-to-r from-cyan-500 to-teal-600 shadow-sm"
                  : "text-cyan-600 bg-cyan-50 hover:bg-cyan-100"
              )}
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">数据中心</span>
            </Link>

            {/* 设置 */}
            <Link
              href="/settings"
              className={cn(
                "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === '/settings'
                  ? "text-cyan-600 bg-cyan-50"
                  : "text-gray-600 hover:text-cyan-600 hover:bg-cyan-50/50"
              )}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">设置</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
