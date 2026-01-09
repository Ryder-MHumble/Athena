import Link from "next/link"
import { BookOpen, FileText, Brain, Lightbulb, Settings, Sparkles, ArrowRight, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-20 sm:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <div className="space-y-4">
              <div className="inline-block">
                <span className="inline-flex items-center rounded-full px-4 py-1 text-sm font-medium bg-purple-500/20 text-purple-200 border border-purple-500/30">
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  AI 驱动的学习助手
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                让 AI 成为你的
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200">
                  学习伙伴
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                实时解释专业术语、智能分析学术论文、构建团队知识库。用 AI 的力量，让学习变得简单有趣。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/jargon-killer">
                <Button size="lg" className="bg-white text-purple-900 hover:bg-gray-100 font-semibold px-8">
                  开始学习
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/paper-copilot">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-semibold px-8">
                  探索功能
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">核心功能</h2>
            <p className="text-xl text-gray-600">专为非技术背景的策略分析师设计</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: 术语通 */}
            <div className="group rounded-2xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all p-8 bg-white">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-100 group-hover:bg-purple-600 transition-colors mb-6">
                <BookOpen className="w-7 h-7 text-purple-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">术语通</h3>
              <p className="text-gray-600 mb-6">
                AI 智能导师为你解释专业术语。支持多轮对话深入理解，实时获取领域知识解析。
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                  多轮深度对话
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                  概念关联解析
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                  一键保存到单词本
                </li>
              </ul>
              <Link href="/jargon-killer" className="inline-block">
                <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50 w-full">
                  进入术语通 →
                </Button>
              </Link>
            </div>

            {/* Feature 2: 论文伴侣 */}
            <div className="group rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all p-8 bg-white">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-100 group-hover:bg-blue-600 transition-colors mb-6">
                <FileText className="w-7 h-7 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">论文伴侣</h3>
              <p className="text-gray-600 mb-6">
                自动解析学术论文，生成结构化分析报告。一键获取论文精华，并生成讲解文稿。
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  论文全文解析
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  智能报告生成
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  讲解文稿输出
                </li>
              </ul>
              <Link href="/paper-copilot" className="inline-block">
                <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 w-full">
                  进入论文伴侣 →
                </Button>
              </Link>
            </div>

            {/* Feature 3: 团队知识库 */}
            <div className="group rounded-2xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all p-8 bg-white">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-100 group-hover:bg-emerald-600 transition-colors mb-6">
                <Users className="w-7 h-7 text-emerald-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">团队知识库</h3>
              <p className="text-gray-600 mb-6">
                构建组织化的知识库。跨团队分享学习成果，形成统一的知识积累。
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                  知识组织管理
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                  团队协作分享
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                  搜索和集成
                </li>
              </ul>
              <Link href="/team-brain" className="inline-block">
                <Button variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 w-full">
                  进入知识库 →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features Section */}
      <div className="py-20 sm:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-gray-900">为什么选择 Athena？</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-600 text-white">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">AI 驱动</h3>
                    <p className="text-gray-600">基于最先进的大语言模型，为你提供高质量的学习支持</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600 text-white">
                      <Zap className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">快速高效</h3>
                    <p className="text-gray-600">秒级响应，实时流式输出，让学习过程畅快淋漓</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-600 text-white">
                      <Lightbulb className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">易于使用</h3>
                    <p className="text-gray-600">直观的界面设计，无需技术背景，开箱即用</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-pink-600 text-white">
                      <Brain className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">长期记忆</h3>
                    <p className="text-gray-600">单词本自动保存，持续复习，加深学习印象</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-2xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white space-y-6">
                <div className="text-5xl font-bold">✨</div>
                <h3 className="text-2xl font-bold">智能学习体验</h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></span>
                    实时 AI 对话辅导
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></span>
                    自动论文分析和讲解
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></span>
                    知识点完整保存
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></span>
                    团队协作分享
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></span>
                    个性化学习路径
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl font-bold text-gray-900">准备好开始了吗？</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            加入 Athena，让 AI 成为你学习和工作中的智能助手，提升效率和深度理解。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/jargon-killer">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8">
                现在开始
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/settings">
              <Button size="lg" variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-50 font-semibold px-8">
                配置 API
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="text-gray-600 text-sm">
              © 2024 Athena. 让学习更智能。
            </div>
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

