'use client'

/**
 * 主页 - 模块化版本
 * 页面文件仅负责组装各个组件
 */

import { HeroSection } from './page/components/HeroSection'
import { FeaturesSection } from './page/components/FeaturesSection'
import { StatsSection } from './page/components/StatsSection'
import { CTASection } from './page/components/CTASection'
import { Footer } from './page/components/Footer'

export default function HomePage() {
  return (
    <div className="w-full">
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <CTASection />
      <Footer />
    </div>
  )
}

