/**
 * 主页 Hero 区域组件
 */

import Link from "next/link"
import { ArrowUpRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { advantages } from "../utils"

export function HeroSection() {
  return (
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
  )
}

