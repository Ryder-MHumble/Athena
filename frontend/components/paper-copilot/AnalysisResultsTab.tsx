import React from 'react'
import { PaperAnalysisResponse } from '@/lib/api'
import { AnalysisCard, InnovationCard, StepsCard } from './AnalysisCard'

export interface AnalysisResultsTabProps {
  analysis: PaperAnalysisResponse
}

/**
 * 尝试从后端响应中解析 JSON 格式的分析结果
 */
const tryParseAnalysis = (analysis: PaperAnalysisResponse): PaperAnalysisResponse => {
  try {
    // 如果 summary 已经是对象，直接返回
    if (typeof analysis.summary === 'object') {
      return analysis
    }

    // 尝试从字符串解析 JSON
    if (typeof analysis.summary === 'string') {
      const parsed = JSON.parse(analysis.summary)
      return {
        ...analysis,
        summary: parsed.summary || parsed
      }
    }

    return analysis
  } catch (error) {
    console.warn('Failed to parse analysis summary:', error)
    return analysis
  }
}

export const AnalysisResultsTab: React.FC<AnalysisResultsTabProps> = ({ analysis }) => {
  const parsedAnalysis = tryParseAnalysis(analysis)
  const summary = parsedAnalysis.summary

  // 安全获取字段，提供默认值
  const safeGet = (value: any, defaultVal: string = '未提供'): string => {
    if (Array.isArray(value)) return value.join('\n')
    return String(value || defaultVal)
  }

  return (
    <div className="space-y-6">
      {/* 核心问题 */}
      <AnalysisCard
        type="problem"
        title="🎯 核心问题"
        content={safeGet(summary.coreProblem)}
      />

      {/* 先前困境 */}
      <AnalysisCard
        type="dilemma"
        title="🚧 先前困境"
        content={safeGet(summary.previousDilemma)}
      />

      {/* 核心直觉 */}
      <AnalysisCard
        type="intuition"
        title="💡 核心直觉"
        content={safeGet(summary.coreIntuition)}
      />

      {/* 关键步骤 */}
      {summary.keySteps && summary.keySteps.length > 0 && (
        <StepsCard 
          title="🔑 关键步骤" 
          steps={Array.isArray(summary.keySteps) ? summary.keySteps : [summary.keySteps]} 
        />
      )}

      {/* 创新点 */}
      {summary.innovations && (
        <InnovationCard
          type="innovation"
          title="✨ 创新增量"
          items={[
            {
              label: '对比分析',
              content: safeGet(summary.innovations.comparison),
            },
            {
              label: '本质创新',
              content: safeGet(summary.innovations.essence),
            },
          ]}
        />
      )}

      {/* 边界与局限 */}
      {summary.boundaries && (
        <InnovationCard
          type="boundary"
          title="⚠️ 边界与局限"
          items={[
            {
              label: '关键假设',
              content: safeGet(summary.boundaries.assumptions),
            },
            {
              label: '未解决问题',
              content: safeGet(summary.boundaries.unsolved),
            },
          ]}
        />
      )}

      {/* 一句话总结 */}
      {summary.oneSentence && (
        <AnalysisCard
          type="summary"
          title="📌 一言以蔽之"
          content={safeGet(summary.oneSentence)}
        />
      )}
    </div>
  )
}

