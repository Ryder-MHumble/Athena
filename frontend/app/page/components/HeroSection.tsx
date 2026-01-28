/**
 * 主页 Hero 区域组件
 */

import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { advantages } from "../utils"

export function HeroSection() {
  return (
    <section className="relative py-8 sm:py-12 md:py-16 overflow-hidden bg-white">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 左侧文本 */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200/50 shadow-sm">
                <Sparkles className="w-4 h-4 text-cyan-600 animate-pulse" />
                <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">✨ AI 驱动的学习助手</span>
              </div>
              
              <div className="space-y-3">
                <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight font-display`}>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 animate-gradient bg-[length:200%_auto]">
                    Athena
                  </span>
                  <br />
                  <span className="text-gray-900">让学习变得</span>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600">
                    简单有趣
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 max-w-2xl leading-relaxed">
                  <span className="font-bold text-gray-900">专为 AI 战略分析师打造的智能工作台</span>
                  <br />
                  <span className="text-gray-700">术语秒懂、论文秒解、知识秒查</span>。用 AI 的力量，让复杂概念变得通俗易懂，让学术论文变得触手可及。
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

          {/* 右侧 Logo */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-lg h-[500px] flex items-center justify-center">
              <Image 
                src="/Logo.png" 
                alt="Athena Logo" 
                width={500} 
                height={500}
                className="object-contain w-full h-full"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

