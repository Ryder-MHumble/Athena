import type { Metadata } from "next"
import { Inter, Merriweather, Noto_Sans_SC } from "next/font/google"
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

const notoSansSC = Noto_Sans_SC({ 
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
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

