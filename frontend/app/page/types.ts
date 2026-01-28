/**
 * 主页类型定义
 */

export interface Feature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  benefits: string[]
  href: string
  color: string
  bgColor: string
  accentColor: string
  category?: string
}

export interface Advantage {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

export interface Stat {
  label: string
  value: string
}

