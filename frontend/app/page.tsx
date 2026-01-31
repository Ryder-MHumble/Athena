'use client'

/**
 * 主页 - 简化版设计
 * 移除复杂动画，保留渐变背景
 */

import { useState, useEffect } from 'react'
import Link from "next/link"
import Image from "next/image"
import { 
  ArrowUpRight, 
  Sparkles, 
  Zap, 
  CheckCircle, 
  Settings,
  AlertCircle,
  X,
  ChevronRight,
  Key,
  Rocket
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAppStore } from '@/stores/useAppStore'

// 产品特性
const highlights = [
  { icon: Zap, text: "多源大模型智能调度" },
  { icon: Sparkles, text: "全球信源实时聚合" },
  { icon: CheckCircle, text: "一站式AI工作台" },
]

// 新用户引导组件
function NewUserGuide({ onClose, hasApiKey }: { onClose: () => void; hasApiKey: boolean }) {
  const [step, setStep] = useState(0)
  
  const steps = [
    {
      title: "欢迎使用 Athena 👋",
      content: "为 AI 战略分析师打造的一站式智能工作台，提升日常工作效率。",
      icon: Rocket,
    },
    {
      title: hasApiKey ? "API Key 已配置 ✓" : "配置 API Key 🔑",
      content: hasApiKey 
        ? "太棒了！你已经配置好 API Key，可以开始使用所有功能了。"
        : "在开始使用前，请先配置 SiliconFlow API Key，这是使用 AI 功能的必要条件。",
      icon: Key,
      action: !hasApiKey ? { label: "前往配置", href: "/settings" } : null,
    },
    {
      title: "开始探索 🚀",
      content: "推荐先浏览「数据中心」查看全球AI信源，或使用「术语通」快速理解专业概念。",
      icon: Sparkles,
      action: { label: "进入数据中心", href: "/data-hub" },
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 bg-white shadow-2xl border-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-cyan-500' : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="text-center space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${
            step === 0 ? 'from-cyan-400 to-teal-500' :
            step === 1 ? (hasApiKey ? 'from-green-400 to-emerald-500' : 'from-amber-400 to-orange-500') :
            'from-purple-400 to-pink-500'
          } flex items-center justify-center shadow-lg`}>
            {(() => {
              const Icon = steps[step].icon
              return <Icon className="h-8 w-8 text-white" />
            })()}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900">{steps[step].title}</h3>
          <p className="text-gray-600 leading-relaxed">{steps[step].content}</p>
          
          <div className="flex items-center justify-center gap-3 pt-4">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                上一步
              </Button>
            )}
            {step < 2 ? (
              <Button 
                onClick={() => setStep(s => s + 1)}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
              >
                {steps[step].action ? (
                  <Link href={steps[step].action!.href} className="flex items-center gap-1">
                    {steps[step].action!.label}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>下一步 <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            ) : (
              <Link href={steps[step].action!.href}>
                <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
                  {steps[step].action!.label}
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

// API Key 提示条
function ApiKeyBanner() {
  const [dismissed, setDismissed] = useState(false)
  
  if (dismissed) return null
  
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="h-5 w-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900">尚未配置 API Key</p>
        <p className="text-xs text-amber-700 mt-0.5">配置 SiliconFlow API Key 后即可使用 AI 功能</p>
      </div>
      <Link href="/settings">
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
          <Settings className="h-3.5 w-3.5 mr-1" />
          去配置
        </Button>
      </Link>
      <button onClick={() => setDismissed(true)} className="p-1 text-amber-400 hover:text-amber-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// 简化的 Logo 背景 - 只保留渐变色
function LogoBackground() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* 深空背景渐变 */}
      <div className="absolute w-[700px] h-[700px] rounded-full bg-gradient-radial from-cyan-400/25 via-teal-300/15 to-transparent" />
      
      {/* 主光晕层 */}
      <div className="absolute w-[550px] h-[550px] rounded-full bg-gradient-to-br from-cyan-300/30 via-transparent to-teal-300/30 blur-[80px]" />
      
      {/* 中心聚焦光环 */}
      <div className="absolute w-[450px] h-[450px] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, rgba(20, 184, 166, 0.1) 40%, transparent 70%)',
        }} />
      
      {/* 外圈装饰环 */}
      <div className="absolute w-[520px] h-[520px] rounded-full border border-cyan-200/30" />
      <div className="absolute w-[580px] h-[580px] rounded-full border border-teal-200/20" />
    </div>
  )
}

export default function HomePage() {
  const [showGuide, setShowGuide] = useState(false)
  const [mounted, setMounted] = useState(false)
  const apiKey = useAppStore((state) => state.apiKey)
  
  useEffect(() => {
    setMounted(true)
    const hasVisited = localStorage.getItem('athena_visited')
    if (!hasVisited) {
      setShowGuide(true)
      localStorage.setItem('athena_visited', 'true')
    }
  }, [])
  
  const hasApiKey = !!apiKey

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-white via-slate-50/50 to-cyan-50/30 overflow-hidden">
      {/* 新用户引导 */}
      {showGuide && <NewUserGuide onClose={() => setShowGuide(false)} hasApiKey={hasApiKey} />}
      
      {/* 静态背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-200/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/15 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[calc(100vh-10rem)]">
          {/* 左侧：文本内容 */}
          <div className="space-y-6">
            {/* API Key 提示 */}
            {mounted && !hasApiKey && <ApiKeyBanner />}
            
            {/* 标题区域 */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-200/50">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-cyan-700">AI 战略分析师的效率引擎</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600">
                  Athena
                </span>
                <br />
                <span className="text-gray-900">让工作变得</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500 ml-2">
                  高效智能
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
                为 AI 战略分析师打造的一站式智能工作台。
                <span className="text-gray-900 font-medium">术语秒懂、论文秒解、全球信源聚合</span>，
                用 AI 提升日常工作效率，洞察行业前沿。
              </p>
              
              {/* 特性标签 */}
              <div className="flex flex-wrap gap-3 pt-2">
                {highlights.map((item, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-gray-200/60 text-gray-700 text-sm shadow-sm"
                  >
                    <item.icon className="w-4 h-4 text-cyan-500" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 快速开始按钮 - 跳转到数据中心 */}
            <div className="flex items-center gap-4 pt-6">
              <Link href="/data-hub">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-600 hover:to-teal-600 shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 group px-8"
                >
                  立即开始
                  <Rocket className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </Link>
              <button 
                onClick={() => setShowGuide(true)}
                className="text-sm text-gray-500 hover:text-cyan-600 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-4 h-4" />
                查看引导
              </button>
            </div>
          </div>
          
          {/* 右侧：放大的 Logo */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-2xl aspect-square flex items-center justify-center">
              {/* 渐变背景 */}
              <LogoBackground />
              
              {/* Logo - 放大 */}
              <div className="relative w-[420px] h-[420px] xl:w-[500px] xl:h-[500px] 2xl:w-[560px] 2xl:h-[560px]">
                <Image 
                  src="/Logo.png" 
                  alt="Athena Logo" 
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 底部信息 */}
      {/* <div className="relative border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span>© 2024 Athena</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">让学习更智能</span>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/Ryder-MHumble/Athena" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-cyan-600 transition-colors"
              >
                GitHub
              </a>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Open Source
              </span>
            </div>
          </div>
        </div>
      </div> */}

      {/* 简化样式 */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
