import React from 'react'

export interface AnalysisCardProps {
  title: string
  content: string
  type: 'problem' | 'dilemma' | 'intuition' | 'steps' | 'innovation' | 'boundary' | 'summary'
  subtitle?: string
  badge?: string
}

// 类型配置
const typeConfig = {
  problem: {
    color: 'blue',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50',
    titleColor: 'text-blue-900',
    dotColor: 'bg-blue-600',
  },
  dilemma: {
    color: 'yellow',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-50',
    titleColor: 'text-yellow-900',
    dotColor: 'bg-yellow-600',
  },
  intuition: {
    color: 'purple',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50',
    titleColor: 'text-purple-900',
    dotColor: 'bg-purple-600',
  },
  steps: {
    color: 'green',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-50',
    titleColor: 'text-green-900',
    dotColor: 'bg-green-600',
  },
  innovation: {
    color: 'pink',
    borderColor: 'border-pink-500',
    bgColor: 'bg-pink-50',
    titleColor: 'text-pink-900',
    dotColor: 'bg-pink-600',
  },
  boundary: {
    color: 'orange',
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-50',
    titleColor: 'text-orange-900',
    dotColor: 'bg-orange-600',
  },
  summary: {
    color: 'gray',
    borderColor: 'border-gray-800',
    bgColor: 'bg-gradient-to-r from-gray-900 to-gray-800',
    titleColor: 'text-white',
    dotColor: 'bg-white',
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
      <div className={`rounded-lg p-6 ${config.bgColor}`}>
        <p className="text-sm font-semibold uppercase text-gray-300 mb-2">一句话总结</p>
        <p className="text-lg leading-relaxed italic font-light text-white">"{content}"</p>
      </div>
    )
  }

  return (
    <div className={`border-l-4 ${config.borderColor} ${config.bgColor} rounded-r-lg p-5`}>
      {/* 标题和徽章 */}
      <div className="flex items-start justify-between mb-2">
        <h3 className={`text-lg font-bold ${config.titleColor} flex items-center gap-2`}>
          <span className={`w-2 h-2 ${config.dotColor} rounded-full`}></span>
          {title}
        </h3>
        {badge && (
          <span className="text-xs font-semibold px-2 py-1 bg-white bg-opacity-70 rounded text-gray-600">
            {badge}
          </span>
        )}
      </div>

      {/* 内容 */}
      <p className="text-gray-800 leading-relaxed">{content}</p>
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
    <div className={`border-l-4 ${config.borderColor} ${config.bgColor} rounded-r-lg p-5`}>
      <h3 className={`text-lg font-bold ${config.titleColor} mb-3 flex items-center gap-2`}>
        <span className={`w-2 h-2 ${config.dotColor} rounded-full`}></span>
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx}>
            <p className="font-semibold text-gray-900 text-sm uppercase text-gray-600 mb-1">
              {item.label}
            </p>
            <p className="text-gray-800 bg-white p-3 rounded border border-gray-200">
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
    <div className={`border-l-4 ${config.borderColor} ${config.bgColor} rounded-r-lg p-5`}>
      <h3 className={`text-lg font-bold ${config.titleColor} mb-3 flex items-center gap-2`}>
        <span className={`w-2 h-2 ${config.dotColor} rounded-full`}></span>
        {title}
      </h3>
      <ol className="list-decimal pl-6 space-y-2">
        {steps.map((step, idx) => (
          <li key={idx} className="text-gray-800 leading-relaxed">
            <span className="font-semibold text-gray-900">第 {idx + 1} 步：</span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}
