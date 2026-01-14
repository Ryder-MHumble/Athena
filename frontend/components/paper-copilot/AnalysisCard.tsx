import React from 'react'

export interface AnalysisCardProps {
  title: string
  content: string
  type: 'problem' | 'dilemma' | 'intuition' | 'steps' | 'innovation' | 'boundary' | 'summary'
  subtitle?: string
  badge?: string
}

// 优化的类型配置：增加渐变背景和更优雅的视觉效果
const typeConfig = {
  problem: {
    color: 'blue',
    borderColor: 'border-blue-400',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    titleColor: 'text-blue-900',
    accentColor: 'text-blue-600',
    dotColor: 'bg-blue-500',
    icon: '🎯',
  },
  dilemma: {
    color: 'amber',
    borderColor: 'border-amber-400',
    bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
    titleColor: 'text-amber-900',
    accentColor: 'text-amber-600',
    dotColor: 'bg-amber-500',
    icon: '🚧',
  },
  intuition: {
    color: 'purple',
    borderColor: 'border-purple-400',
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
    titleColor: 'text-purple-900',
    accentColor: 'text-purple-600',
    dotColor: 'bg-purple-500',
    icon: '💡',
  },
  steps: {
    color: 'emerald',
    borderColor: 'border-emerald-400',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    titleColor: 'text-emerald-900',
    accentColor: 'text-emerald-600',
    dotColor: 'bg-emerald-500',
    icon: '🔑',
  },
  innovation: {
    color: 'pink',
    borderColor: 'border-pink-400',
    bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50',
    titleColor: 'text-pink-900',
    accentColor: 'text-pink-600',
    dotColor: 'bg-pink-500',
    icon: '✨',
  },
  boundary: {
    color: 'orange',
    borderColor: 'border-orange-400',
    bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
    titleColor: 'text-orange-900',
    accentColor: 'text-orange-600',
    dotColor: 'bg-orange-500',
    icon: '⚠️',
  },
  summary: {
    color: 'gray',
    borderColor: 'border-slate-600',
    bgColor: 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900',
    titleColor: 'text-white',
    accentColor: 'text-slate-200',
    dotColor: 'bg-white',
    icon: '📌',
  },
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({
  title,
  content,
  type,
  badge,
}) => {
  const config = typeConfig[type]

  if (type === 'summary') {
    return (
      <div className={`${config.bgColor} rounded-lg p-6 shadow-lg border border-slate-700 overflow-hidden relative`}>
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
        
        <p className="text-xs font-semibold uppercase text-slate-300 mb-3 tracking-widest relative z-10">
          {config.icon} 一句话总结
        </p>
        <p className="text-lg leading-relaxed italic font-light text-white relative z-10">
          "{content}"
        </p>
      </div>
    )
  }

  return (
    <div className={`border-l-4 ${config.borderColor} ${config.bgColor} rounded-r-lg p-5 shadow-sm hover:shadow-md transition-shadow`}>
      {/* 标题和徽章 */}
      <div className="flex items-start justify-between mb-3">
        <h3 className={`text-base font-bold ${config.titleColor} flex items-center gap-2`}>
          <span className={`w-2.5 h-2.5 ${config.dotColor} rounded-full`}></span>
          {title}
        </h3>
        {badge && (
          <span className="text-xs font-semibold px-2 py-1 bg-white/80 rounded-full text-gray-600">
            {badge}
          </span>
        )}
      </div>

      {/* 内容 */}
      <p className="text-gray-800 leading-relaxed text-sm">{content}</p>
    </div>
  )
}

/**
 * 创新点双栏卡片
 */
export interface InnovationCardProps {
  title: string
  items: {
    label: string
    content: string
  }[]
  type: 'innovation' | 'boundary'
}

export const InnovationCard: React.FC<InnovationCardProps> = ({ title, items, type }) => {
  const config = typeConfig[type]

  return (
    <div className={`border-l-4 ${config.borderColor} ${config.bgColor} rounded-r-lg p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <h3 className={`text-base font-bold ${config.titleColor} mb-4 flex items-center gap-2`}>
        <span className={`w-2.5 h-2.5 ${config.dotColor} rounded-full`}></span>
        {title}
      </h3>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-lg p-4 hover:bg-white/80 transition-colors">
            <p className={`text-xs font-bold uppercase ${config.accentColor} mb-2 tracking-wide`}>
              {item.label}
            </p>
            <p className="text-gray-800 text-sm leading-relaxed">
              {item.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 步骤列表卡片
 */
export interface StepsCardProps {
  title: string
  steps: string[]
}

export const StepsCard: React.FC<StepsCardProps> = ({ title, steps }) => {
  const config = typeConfig.steps

  return (
    <div className={`border-l-4 ${config.borderColor} ${config.bgColor} rounded-r-lg p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <h3 className={`text-base font-bold ${config.titleColor} mb-4 flex items-center gap-2`}>
        <span className={`w-2.5 h-2.5 ${config.dotColor} rounded-full`}></span>
        {title}
      </h3>
      <ol className="space-y-3">
        {steps.map((step, idx) => (
          <li key={idx} className="flex gap-4">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center`}>
              <span className={`${config.titleColor} font-bold text-sm`}>{idx + 1}</span>
            </div>
            <div className="pt-1">
              <p className="text-gray-800 text-sm leading-relaxed">{step}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
