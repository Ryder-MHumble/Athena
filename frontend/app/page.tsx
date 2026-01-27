'use client'

import Link from "next/link"
import { BookOpen, FileText, Users, Zap, ArrowUpRight, CheckCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  const features = [
    {
      icon: BookOpen,
      title: "术语通",
      description: "遇到不懂的专业名词？AI 导师秒级响应，用通俗易懂的语言解释复杂概念，支持多轮追问直到彻底理解",
      benefits: ["流式实时响应", "多轮深度追问", "一键收藏到单词本"],
      href: "/jargon-killer",
      color: "from-cyan-400 to-cyan-600",
      bgColor: "bg-cyan-50",
      accentColor: "text-cyan-600"
    },
    {
      icon: FileText,
      title: "论文伴侣",
      description: "上传 PDF 或输入 Arxiv 链接，自动提取核心观点、生成结构化分析报告和口语化讲解文稿",
      benefits: ["结构化论文解析", "智能讲解文稿", "预判提问准备"],
      href: "/paper-copilot",
      color: "from-teal-400 to-teal-600",
      bgColor: "bg-teal-50",
      accentColor: "text-teal-600"
    },
    {
      icon: Users,
      title: "知识沉淀",
      description: "上传团队内部文档，构建可检索的智能知识库，基于语义搜索快速定位所需内容",
      benefits: ["向量语义检索", "智能问答对话", "团队知识共享"],
      href: "/team-brain",
      color: "from-emerald-400 to-emerald-600",
      bgColor: "bg-emerald-50",
      accentColor: "text-emerald-600"
    }
  ]

  const advantages = [
    {
      icon: Zap,
      title: "秒级响应",
      description: "基于先进的大语言模型，实时流式输出"
    },
    {
      icon: Sparkles,
      title: "AI 驱动",
      description: "高质量的学习支持和个性化指导"
    },
    {
      icon: CheckCircle,
      title: "易于使用",
      description: "直观界面设计，无需技术背景"
    }
  ]

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative py-8 sm:py-12 md:py-16 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-cyan-200 to-transparent rounded-full blur-3xl opacity-20"></div>
          <div className="absolute -bottom-32 left-0 w-96 h-96 bg-gradient-to-t from-teal-200 to-transparent rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 左侧文本 */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  <span className="text-sm font-medium text-cyan-700">AI 驱动的学习助手</span>
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
                    让学习变得
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-600">
                      简单有趣
                    </span>
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 max-w-2xl leading-relaxed">
                    实时解释专业术语、智能分析学术论文、构建团队知识库。让 AI 成为你学习和工作中的智能助手。
                  </p>
                </div>
              </div>

              {/* CTA 按钮 */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/jargon-killer" className="flex-shrink-0">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:shadow-lg hover:shadow-cyan-500/50 transition-all">
                    开始使用
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="#features" className="flex-shrink-0">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                    了解更多
                  </Button>
                </Link>
              </div>

              {/* 特性列表 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {advantages.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                      <p className="text-gray-600 text-xs">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧示意图 */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full h-96">
                {/* 主卡片 */}
                <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="h-16 bg-gradient-to-r from-cyan-500 to-teal-600 flex items-center px-6">
                      <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 p-8 space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                      <div className="pt-6 space-y-2">
                        <div className="h-3 bg-cyan-100 rounded-full w-16"></div>
                        <div className="h-3 bg-teal-100 rounded-full w-20"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 装饰卡片 1 */}
                <div className="absolute top-6 -right-6 w-32 h-24 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-xl shadow-lg opacity-90 transform rotate-12"></div>
                
                {/* 装饰卡片 2 */}
                <div className="absolute -bottom-4 -left-4 w-28 h-28 bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl shadow-lg opacity-90 transform -rotate-12"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              核心功能
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              专为非技术背景用户设计的 AI 智能工作台，让学习和研究更高效
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Link key={index} href={feature.href}>
                <Card className="h-full hover:shadow-xl hover:border-cyan-300 transition-all duration-300 overflow-hidden group cursor-pointer">
                  {/* 顶部色条 */}
                  <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
                  
                  <div className="p-8 space-y-6">
                    {/* 图标 */}
                    <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`w-7 h-7 ${feature.accentColor}`} />
                    </div>

                    {/* 标题和描述 */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* 特性列表 */}
                    <div className="space-y-2 pt-2">
                      {feature.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <CheckCircle className={`w-4 h-4 ${feature.accentColor} flex-shrink-0`} />
                          <span className="text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* 箭头 */}
                    <div className={`pt-2 flex items-center gap-2 ${feature.accentColor} font-semibold text-sm group-hover:gap-3 transition-all`}>
                      开始使用
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { label: "AI 响应", value: "SSE 流式" },
              { label: "向量模型", value: "BGE-M3" },
              { label: "主力模型", value: "Qwen 72B" },
              { label: "知识库", value: "RAG 增强" }
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 sm:p-6 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                <p className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600 mb-1">
                  {stat.value}
                </p>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-900 via-cyan-900 to-teal-900 text-white relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/2 w-96 h-96 bg-cyan-400 rounded-full blur-3xl -translate-x-1/2"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">
            准备好提升工作效率了吗？
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            配置你的 SiliconFlow API Key，即刻开始使用所有功能
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/jargon-killer">
              <Button size="lg" className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 font-semibold">
                开始体验
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/settings">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 font-semibold">
                配置 API Key
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">
              © 2024 Athena. 让学习更智能。
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">关于</a>
              <a href="#" className="hover:text-gray-900 transition-colors">文档</a>
              <a href="#" className="hover:text-gray-900 transition-colors">反馈</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

