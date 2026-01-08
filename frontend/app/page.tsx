import Link from "next/link"
import { BookOpen, FileText, Brain, Lightbulb, Settings, Sparkles, ArrowRight, Zap, Shield, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  const modules = [
    {
      title: "术语通",
      description: "用通俗易懂的方式解释专业术语，支持多轮对话和智能检索",
      icon: BookOpen,
      href: "/jargon-killer",
      gradient: "from-purple-500 to-pink-500",
      badge: "AI 导师",
    },
    {
      title: "论文伴侣",
      description: "快速解析论文，生成结构化报告和口语化演讲稿",
      icon: FileText,
      href: "/paper-copilot",
      gradient: "from-blue-500 to-cyan-500",
      badge: "智能分析",
    },
    {
      title: "知识沉淀",
      description: "团队共享知识库，支持向量检索和智能问答",
      icon: Brain,
      href: "/team-brain",
      gradient: "from-green-500 to-emerald-500",
      badge: "团队协作",
    },
    {
      title: "灵感单词本",
      description: "收藏的术语和概念，随时复习，支持卡片翻转",
      icon: Lightbulb,
      href: "/flashcards",
      gradient: "from-amber-500 to-orange-500",
      badge: "知识管理",
    },
  ]

  const features = [
    {
      icon: Zap,
      title: "快速理解",
      description: "用生活化类比解释复杂技术概念",
    },
    {
      icon: Shield,
      title: "战略视角",
      description: "从商业和成本角度分析技术价值",
    },
    {
      icon: Target,
      title: "知识体系",
      description: "构建非技术人员的AI技术知识网络",
    },
  ]

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Section - 更精致的设计 */}
      <div className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl" />
        
        <div className="relative text-center space-y-8 py-16 px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200/50 shadow-sm">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">AI 战略分析师智能工作台</span>
          </div>
          
          {/* 主标题 */}
          <div className="space-y-4">
            <h1 className="text-7xl md:text-8xl font-serif font-bold gradient-text-primary tracking-tight">
          Athena
        </h1>
            <p className="text-2xl md:text-3xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
              专为非技术背景的 AI 战略分析师设计
        </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              用生活化的类比解释复杂技术，构建你的 AI 技术知识体系
        </p>
      </div>

          {/* 装饰线 */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
          </div>
        </div>
      </div>

      {/* 核心功能卡片 */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">核心功能</h2>
          <p className="text-gray-600">选择你需要的工具，开始你的 AI 学习之旅</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <Link key={module.href} href={module.href}>
                <Card className="group relative h-full overflow-hidden border border-gray-200 bg-white/80 backdrop-blur-sm hover:border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer">
                  {/* 渐变装饰 */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-10 rounded-bl-full transition-opacity duration-300`} />
                  
                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${module.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                        {module.badge}
                      </span>
                  </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-base text-gray-600 mt-2 leading-relaxed">
                      {module.description}
                    </CardDescription>
                </CardHeader>
                  
                  <CardContent className="relative z-10">
                    <div className="flex items-center text-sm text-purple-600 font-medium group-hover:gap-2 transition-all">
                      <span>立即体验</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
              </Card>
            </Link>
          )
        })}
        </div>
      </div>

      {/* 特色功能 */}
      <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">为什么选择 Athena？</h2>
            <p className="text-gray-600">专为战略分析师设计的 AI 学习工具</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100">
                    <Icon className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 底部装饰 */}
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <Sparkles className="h-4 w-4" />
          <span>让 AI 成为你的智能助手</span>
        </div>
      </div>
    </div>
  )
}
