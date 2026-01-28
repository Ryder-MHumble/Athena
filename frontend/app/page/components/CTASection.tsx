/**
 * 主页 CTA 区域组件
 */

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
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
  )
}

