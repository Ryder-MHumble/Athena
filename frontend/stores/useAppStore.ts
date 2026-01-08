/**
 * Athena 全局状态管理 Store
 * 使用 Zustand + persist 中间件实现本地持久化
 * 存储：API Key、团队密钥、词汇列表等
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// 词汇项类型定义
export interface VocabItem {
  id: string
  term: string
  explanation: string
  createdAt: number
}

// Store 状态接口
interface AppState {
  // API 配置
  apiKey: string
  teamKey: string
  mcpServerUrl: string | null
  
  // 词汇列表（从术语通模块收藏的术语）
  vocabList: VocabItem[]
  
  // Actions
  setApiKey: (key: string) => void
  setTeamKey: (key: string) => void
  setMcpServerUrl: (url: string | null) => void
  addVocab: (term: string, explanation: string) => void
  removeVocab: (id: string) => void
  clearVocabList: () => void
}

// 从环境变量获取默认 API Key
const getDefaultApiKey = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY || ''
  }
  return ''
}

const getDefaultTeamKey = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_TEAM_ACCESS_KEY || ''
  }
  return ''
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 初始状态 - 从环境变量读取默认值
      apiKey: getDefaultApiKey(),
      teamKey: getDefaultTeamKey(),
      mcpServerUrl: null,
      vocabList: [],

      // Actions
      setApiKey: (key: string) => set({ apiKey: key }),
      setTeamKey: (key: string) => set({ teamKey: key }),
      setMcpServerUrl: (url: string | null) => set({ mcpServerUrl: url }),
      
      // 添加词汇到单词本
      addVocab: (term: string, explanation: string) => {
        const newVocab: VocabItem = {
          id: `vocab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          term,
          explanation,
          createdAt: Date.now(),
        }
        set((state) => ({
          vocabList: [newVocab, ...state.vocabList],
        }))
      },
      
      // 删除词汇
      removeVocab: (id: string) => {
        set((state) => ({
          vocabList: state.vocabList.filter((item) => item.id !== id),
        }))
      },
      
      // 清空词汇列表
      clearVocabList: () => set({ vocabList: [] }),
    }),
    {
      name: 'athena-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
)

