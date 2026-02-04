/**
 * Athena 全局状态管理 Store
 * 使用 Zustand + persist 中间件实现本地持久化
 * 存储：API Key、团队密钥、词汇列表等
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// 论文会话数据
export interface PaperSession {
  id: string
  fileName: string
  uploadedAt: number
  analysis: any | null  // PaperAnalysisResponse
  paperText: string
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  splitPosition: number
  activeTab: 'analysis' | 'speech' | 'chat'
}

// 知识卡片类型：术语或论文分析
export type KnowledgeCardType = 'term' | 'paper'

// 词汇项类型定义（改名为知识卡片）
export interface VocabItem {
  id: string
  term: string
  explanation: string
  // 卡片类型：术语或论文分析
  type?: KnowledgeCardType
  // 完整的对话上下文
  context?: {
    question: string
    answer: string
    sessionId?: string
  }
  // 论文分析特有字段
  paperAnalysis?: {
    title?: string
    authors?: string
    year?: string
    category?: string
    coreProblem?: string
    previousDilemma?: string
    coreIntuition?: string
    keySteps?: string[]
    innovations?: {
      comparison?: string
      essence?: string
    }
    boundaries?: {
      assumptions?: string
      unsolved?: string
    }
    oneSentence?: string
  }
  // 富文本标签和笔记
  tags?: string[]
  notes?: string
  // 学习进度
  reviewCount?: number
  lastReviewedAt?: number
  createdAt: number
  updatedAt?: number
}

// Store 状态接口
interface AppState {
  // API 配置
  apiKey: string
  teamKey: string
  mcpServerUrl: string | null
  selectedModel: string  // 用户选择的模型 ID
  mineruApiKey: string   // MinerU API Key (PDF 智析功能)
  
  // System Prompts 配置
  systemPrompts: Record<string, string>
  
  // Paper-Copilot 会话管理
  currentPaperSession: PaperSession | null
  paperSessions: PaperSession[]
  
  // 词汇列表（从术语通模块收藏的术语）
  vocabList: VocabItem[]
  
  // Actions
  setApiKey: (key: string) => void
  setTeamKey: (key: string) => void
  setMcpServerUrl: (url: string | null) => void
  setSelectedModel: (modelId: string) => void
  setMineruApiKey: (key: string) => void
  setSystemPrompt: (module: string, prompt: string) => void
  getSystemPrompt: (module: string) => string
  clearSystemPrompt: (module: string) => void
  
  // Paper-Copilot 会话管理
  savePaperSession: (session: PaperSession) => void
  loadPaperSession: (sessionId: string) => void
  deletePaperSession: (sessionId: string) => void
  updateCurrentSession: (updates: Partial<PaperSession>) => void
  clearCurrentSession: () => void
  
  addVocab: (term: string, explanation: string, context?: VocabItem['context']) => void
  updateVocab: (id: string, updates: Partial<VocabItem>) => void
  removeVocab: (id: string) => void
  clearVocabList: () => void
  recordReview: (id: string) => void
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
    (set, get) => ({
      // 初始状态 - 从环境变量读取默认值
      apiKey: getDefaultApiKey(),
      teamKey: getDefaultTeamKey(),
      mcpServerUrl: null,
      selectedModel: 'Qwen/Qwen2.5-7B-Instruct', // 默认模型
      mineruApiKey: '', // MinerU API Key
      systemPrompts: {},
      currentPaperSession: null,
      paperSessions: [],
      vocabList: [],

      // Actions
      setApiKey: (key: string) => set({ apiKey: key }),
      setTeamKey: (key: string) => set({ teamKey: key }),
      setMcpServerUrl: (url: string | null) => set({ mcpServerUrl: url }),
      setSelectedModel: (modelId: string) => set({ selectedModel: modelId }),
      setMineruApiKey: (key: string) => set({ mineruApiKey: key }),
      
      // System Prompts 管理
      setSystemPrompt: (module: string, prompt: string) => {
        set((state) => ({
          systemPrompts: {
            ...state.systemPrompts,
            [module]: prompt,
          },
        }))
      },
      
      getSystemPrompt: (module: string) => {
        return get().systemPrompts[module] || ''
      },
      
      clearSystemPrompt: (module: string) => {
        set((state) => {
          const newPrompts = { ...state.systemPrompts }
          delete newPrompts[module]
          return { systemPrompts: newPrompts }
        })
      },

      // Paper-Copilot 会话管理
      savePaperSession: (session: PaperSession) => {
        set((state) => {
          const existing = state.paperSessions.findIndex((s) => s.id === session.id)
          const sessions = existing >= 0 
            ? [...state.paperSessions.slice(0, existing), session, ...state.paperSessions.slice(existing + 1)]
            : [session, ...state.paperSessions]
          return {
            paperSessions: sessions,
            currentPaperSession: session,
          }
        })
      },

      loadPaperSession: (sessionId: string) => {
        set((state) => {
          const session = state.paperSessions.find((s) => s.id === sessionId)
          if (session) {
            return { currentPaperSession: session }
          }
          return state
        })
      },

      deletePaperSession: (sessionId: string) => {
        set((state) => {
          const filtered = state.paperSessions.filter((s) => s.id !== sessionId)
          const newCurrent = state.currentPaperSession?.id === sessionId ? null : state.currentPaperSession
          return {
            paperSessions: filtered,
            currentPaperSession: newCurrent,
          }
        })
      },

      updateCurrentSession: (updates: Partial<PaperSession>) => {
        set((state) => {
          if (!state.currentPaperSession) return state
          const updated = { ...state.currentPaperSession, ...updates }
          return {
            currentPaperSession: updated,
            paperSessions: state.paperSessions.map((s) =>
              s.id === updated.id ? updated : s
            ),
          }
        })
      },

      clearCurrentSession: () => {
        set({ currentPaperSession: null })
      },
      
      // 添加词汇到单词本
      addVocab: (term: string, explanation: string, context?: VocabItem['context']) => {
        const now = Date.now()
        const newVocab: VocabItem = {
          id: `vocab-${now}-${Math.random().toString(36).substr(2, 9)}`,
          term,
          explanation,
          context, // 保存完整上下文
          tags: [],
          notes: '',
          reviewCount: 0,
          lastReviewedAt: undefined,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          vocabList: [newVocab, ...state.vocabList],
        }))
      },
      
      // 更新词汇
      updateVocab: (id: string, updates: Partial<VocabItem>) => {
        set((state) => ({
          vocabList: state.vocabList.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: Date.now() }
              : item
          ),
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
      
      // 记录复习
      recordReview: (id: string) => {
        set((state) => ({
          vocabList: state.vocabList.map((item) =>
            item.id === id
              ? {
                  ...item,
                  reviewCount: (item.reviewCount || 0) + 1,
                  lastReviewedAt: Date.now(),
                  updatedAt: Date.now(),
                }
              : item
          ),
        }))
      },
    }),
    {
      name: 'athena-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
)
