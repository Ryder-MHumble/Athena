import type { Metadata } from "next"
import { Inter, Merriweather } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { Navigation } from "@/components/layout/navigation"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
})

const merriweather = Merriweather({ 
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  title: "Athena - AI 战略分析师智能工作台",
  description: "专为非技术背景的 AI 战略分析师设计的智能工作台",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} ${merriweather.variable} font-sans`}>
        <div className="min-h-screen bg-background flex flex-col">
          <Navigation />
          <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}

