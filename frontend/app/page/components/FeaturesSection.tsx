/**
 * 主页功能特性区域组件 - 重构版本
 */

import Link from "next/link"
import { ArrowUpRight, CheckCircle, Zap, FolderOpen } from "lucide-react"
import { Card } from "@/components/ui/card"
import { features } from "../utils"
import { cn } from "@/lib/utils"

// 按分类分组功能
const groupedFeatures = features.reduce((acc, feature) => {
  const category = feature.category || '其他'
  if (!acc[category]) {
    acc[category] = []
  }
  acc[category].push(feature)
  return acc
}, {} as Record<string, typeof features>)

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'AI 工具': Zap,
  '知识管理': FolderOpen,
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-white to-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区域 */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            核心功能
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            专为非技术背景用户设计的 AI 智能工作台，让学习和研究更高效
          </p>
        </div>

        {/* 按分类展示功能卡片 */}
        <div className="space-y-12">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
            const CategoryIcon = categoryIcons[category] || FolderOpen
            
            return (
              <div key={category} className="space-y-6">
                {/* 分类标题 */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <CategoryIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{category}</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
                </div>

                {/* 功能卡片网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryFeatures.map((feature, index) => (
                    <Link key={index} href={feature.href}>
                      <Card className="h-full bg-white hover:shadow-2xl hover:shadow-cyan-500/10 border-2 hover:border-cyan-300/50 transition-all duration-300 overflow-hidden group cursor-pointer relative">
                        {/* 顶部渐变条 */}
                        <div className={cn("h-1.5 bg-gradient-to-r", feature.color)}></div>
                        
                        <div className="p-6 sm:p-8 space-y-5">
                          {/* 图标和分类标签 */}
                          <div className="flex items-start justify-between">
                            <div className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300",
                              feature.bgColor,
                              "group-hover:scale-110 group-hover:shadow-xl"
                            )}>
                              <feature.icon className={cn("w-7 h-7", feature.accentColor)} />
                            </div>
                            {feature.category && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                {feature.category}
                              </span>
                            )}
                          </div>

                          {/* 标题和描述 */}
                          <div className="space-y-2">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">
                              {feature.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                              {feature.description}
                            </p>
                          </div>

                          {/* 特性列表 */}
                          <div className="space-y-2.5 pt-2">
                            {feature.benefits.map((benefit, i) => (
                              <div key={i} className="flex items-center gap-2.5 text-sm">
                                <CheckCircle className={cn("w-4 h-4 flex-shrink-0", feature.accentColor)} />
                                <span className="text-gray-700">{benefit}</span>
                              </div>
                            ))}
                          </div>

                          {/* 操作按钮 */}
                          <div className={cn(
                            "pt-4 flex items-center gap-2 font-semibold text-sm transition-all",
                            feature.accentColor,
                            "group-hover:gap-3"
                          )}>
                            <span>立即体验</span>
                            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </div>
                        </div>

                        {/* Hover 效果装饰 */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <div className={cn(
                            "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -z-10",
                            feature.color,
                            "opacity-20"
                          )}></div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

