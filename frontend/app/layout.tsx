import type { Metadata } from "next"
import { Inter, Merriweather, Noto_Sans_SC } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { Navigation } from "@/components/layout/navigation"
import { BackendWakeup } from "@/components/BackendWakeup"

// 配置字体，添加 fallback 以应对网络问题
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "arial", "sans-serif"],
  adjustFontFallback: true,
})

const merriweather = Merriweather({ 
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: true,
})

const notoSansSC = Noto_Sans_SC({ 
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "PingFang SC", "Microsoft YaHei", "SimHei", "sans-serif"],
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: "Athena - AI 战略分析师智能工作台",
  description: "专为非技术背景的 AI 战略分析师设计的智能工作台",
  icons: {
    icon: "/Logo.png",
    shortcut: "/Logo.png",
    apple: "/Logo.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} ${merriweather.variable} ${notoSansSC.variable} font-sans`}>
        <BackendWakeup />
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navigation />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}

