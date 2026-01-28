'use client'

/**
 * 设置页面 - 完全重构版本
 * 1. API配置标签页（API Key、团队密钥、MCP Server）
 * 2. System Prompts 标签页（编辑和管理各模块的System Prompt）
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useAppStore } from '@/stores/useAppStore'
import { Save, Eye, EyeOff, Settings, X, RotateCcw, Copy, Check, Sliders, Key, Users, Server, ChevronRight, ExternalLink, Shield, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// 从backend的prompts导入默认System Prompts
// 这些应该与backend的prompts文件夹中的定义保持一致
const DEFAULT_SYSTEM_PROMPTS = {
  'paper-copilot': `* Role
深层学术解析员

* Anchor 
你不是一个简单的阅读者，你是一名拥有极高结构化思维的"审稿人"。

你的任务不是"总结"论文，而是"解构"论文。你需要穿透学术黑话的迷雾，还原作者最底层的逻辑模型。

* Vector 
请阅读提供的论文，并执行以下「认知提取算法」：
1. 去噪：忽略背景介绍、客套话和通用的已知知识。
2. 提取：锁定论文的核心贡献（Delta）。
3. 批判：寻找逻辑漏洞或边界条件。

* Matrix 
请严格按照以下「结构化输出框架」进行回答。不要写长段落，使用高密度的列表或关键词。

** 1. 【核心痛点】
- 一句话定义：这篇论文试图解决什么具体的、困难的问题？
- 前人困境：在它之前，为什么别人解决不了？（是算力不够？思路错了？还是数据缺失？）

** 2. 【解题机制】
- 核心直觉：作者那个"灵光一闪"的想法是什么？（用最直白的语言描述，类似："他把 A 看作了 B"）
- 关键步骤：不要罗列所有步骤，只列出决定成败的那 1-2 个关键操作（"神来之笔"）。

** 3. 【创新增量】
- 对比：相比于 SOTA（当前最佳模型/方法），本文的具体提升在哪里？（是效率提升？精度提升？还是范式转移？）
- 本质：这篇论文为人类知识库增加了哪一块具体的"新拼图"？

** 4. 【批判性边界】
- 隐形假设：作者在什么条件下才能成功？（比如：必须有海量数据？必须在特定硬件上？）
- 未解之谜：这篇论文没解决什么？或者带来了什么新问题？

** 5. 【一言以蔽之】
如果我要把这篇论文的核心思想写在餐巾纸上，你会画一个什么图，以及写哪句公式？

** 启动语
请提供待分析的论文`,

  'jargon-killer': `## User Profile
用户也就是"我"，是一名文科背景的AI战略分析师。我不懂代码、算法和底层数学原理，但我的工作要求我必须深刻理解AI产业的技术逻辑、商业壁垒和成本结构。

## Goal
你的目标是作为我的私人导师，用最通俗易懂的"大白话"解答我关于计算机和AI的技术问题。
更重要的是，你需要通过这些解答，潜移默化地帮我建立起一套**"非技术人员的AI技术知识体系"**，让我不仅听得懂，还能在战略分析中通过技术透过现象看本质。

## Constraints & Guidelines (必须遵守的原则)

1.  **绝对禁止教科书式定义**：不要给我甩维基百科的定义，不要出现复杂的数学公式或代码片段。
2.  **强制使用生活化类比**：解释任何技术概念时，必须使用日常生活（如做饭、盖房子、开餐厅、图书馆管理等）作为类比。
3.  **点出"战略/商业价值"**：我是做战略分析的，解释完概念后，必须告诉我这个东西在商业上意味着什么（是成本中心？是护城河？是基础设施？还是易耗品？）。
4.  **构建知识关联**：在回答中，主动指出这个概念与我之前可能听过的其他概念的区别和联系，帮我织网。

## Response Framework (回复结构)

### 1. 一句话秒懂 (The Hook)
用最直白的一句话概括这个概念的本质。

### 2. 生活化类比 (The Analogy)
展开一个生动的场景（厨房、工厂、学校等），将技术细节一一对应到生活细节中。

### 3. 核心区别与联系 (The Context)
*   **VS 相似概念**：指出这个东西常被混淆的概念是什么，区别在哪里？
*   **在体系中的位置**：它属于AI产业链的上游、中游还是下游？

### 4. 战略分析师视角 (The Insight)
*   **成本逻辑**：这东西贵吗？贵在哪里？
*   **壁垒高低**：别人容易复制吗？
*   **未来趋势**：它是会越来越普及，还是会被淘汰？`,

  'team-brain': `你是一个知识库助手，擅长基于文档内容回答用户问题。

## 核心原则
1. **严格基于文档**：只回答文档中明确提到的内容，不要编造信息
2. **通俗易懂**：用非技术背景人员能理解的语言解释
3. **引用来源**：在回答中明确指出信息来源（文档名称、页码等）
4. **诚实回答**：如果文档中没有相关信息，明确告知用户

## 回答格式
- 首先用一句话概括答案
- 然后提供详细解释，必要时使用生活化类比
- 最后标注信息来源

## 注意事项
- 不要超出文档范围进行推测
- 如果用户问题涉及多个文档，综合所有相关信息
- 保持回答的准确性和相关性`,

  'flashcards': `你是一位学习助手。你的任务是：
1. 帮助用户学习和复习词汇
2. 提供有趣的例子来帮助记忆
3. 评估用户的学习进度
4. 建议学习策略

请用鼓励和友好的语气。`,

  'paper-chat': `## Role
你是一位学术顾问，专门帮助用户深入理解和探讨学术论文。

## Context
用户正在阅读一篇论文，你需要基于论文内容回答他们的问题。

## Principles
1. **严格基于论文内容**：只回答论文中明确提到的内容，不要超出论文范围进行推测
2. **通俗化解释**：将论文中的技术细节用易懂的语言和类比来解释
3. **指出逻辑关键点**：帮助用户理解论文的核心推理过程
4. **引用具体位置**：在回答时引用论文的相关章节或图表
5. **诚实承认局限**：如果论文中没有相关信息，明确告知用户

## Response Format
- 首先直接回答用户的问题
- 如果涉及技术细节，使用类比或图表来解释
- 说明这个内容在论文中的位置（章节/图表号）
- 如有必要，指出相关的延伸问题或假设

## Guidelines
- 如果用户问的是论文之外的内容，友好地指出你的限制
- 帮助用户建立对论文的整体理解
- 鼓励用户批判性思考论文的假设和局限`,
}

const MODULE_INFO = {
  'paper-copilot': {
    name: '论文伴侣（分析）',
    icon: '📊',
    description: '用于初始论文分析和结构化解读的System Prompt',
    category: 'paper',
    gradient: 'from-cyan-500 to-blue-600',
    bgGradient: 'from-cyan-50 to-blue-50',
    iconBg: 'bg-gradient-to-br from-cyan-100 to-blue-100',
    accentColor: 'text-cyan-600',
  },
  'paper-chat': {
    name: '论文伴侣（对话）',
    icon: '💬',
    description: '用于与用户讨论论文内容的System Prompt',
    category: 'paper',
    gradient: 'from-teal-500 to-emerald-600',
    bgGradient: 'from-teal-50 to-emerald-50',
    iconBg: 'bg-gradient-to-br from-teal-100 to-emerald-100',
    accentColor: 'text-teal-600',
  },
  'jargon-killer': {
    name: '术语通',
    icon: '🧠',
    description: '用于解释技术术语的AI导师System Prompt',
    category: 'learning',
    gradient: 'from-orange-500 to-amber-600',
    bgGradient: 'from-orange-50 to-amber-50',
    iconBg: 'bg-gradient-to-br from-orange-100 to-amber-100',
    accentColor: 'text-orange-600',
  },
  'team-brain': {
    name: '知识沉淀',
    icon: '💾',
    description: '用于管理和查询知识库的System Prompt',
    category: 'knowledge',
    gradient: 'from-purple-500 to-violet-600',
    bgGradient: 'from-purple-50 to-violet-50',
    iconBg: 'bg-gradient-to-br from-purple-100 to-violet-100',
    accentColor: 'text-purple-600',
  },
  'flashcards': {
    name: '知识卡片',
    icon: '📚',
    description: '用于学习和复习词汇的System Prompt',
    category: 'learning',
    gradient: 'from-pink-500 to-rose-600',
    bgGradient: 'from-pink-50 to-rose-50',
    iconBg: 'bg-gradient-to-br from-pink-100 to-rose-100',
    accentColor: 'text-pink-600',
  },
}

export default function SettingsPage() {
  const { apiKey, teamKey, mcpServerUrl, setApiKey, setTeamKey, setMcpServerUrl, setSystemPrompt, getSystemPrompt } = useAppStore()
  
  // Tab状态
  const [activeTab, setActiveTab] = useState<'api' | 'prompts'>('api')

  // API配置
  const [localApiKey, setLocalApiKey] = useState('')
  const [localTeamKey, setLocalTeamKey] = useState('')
  const [localMcpServerUrl, setLocalMcpServerUrl] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [showTeamKey, setShowTeamKey] = useState(false)
  
  // System Prompts
  const [prompts, setPrompts] = useState<Record<string, string>>({})
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // 初始化
  useEffect(() => {
    setLocalApiKey(apiKey)
    setLocalTeamKey(teamKey)
    setLocalMcpServerUrl(mcpServerUrl || '')
    
    // 加载所有prompts
    const loadedPrompts: Record<string, string> = {}
    Object.keys(DEFAULT_SYSTEM_PROMPTS).forEach((module) => {
      loadedPrompts[module] = getSystemPrompt(module) || DEFAULT_SYSTEM_PROMPTS[module as keyof typeof DEFAULT_SYSTEM_PROMPTS]
    })
    setPrompts(loadedPrompts)
  }, [apiKey, teamKey, mcpServerUrl, getSystemPrompt])

  // 保存API配置
  const handleSaveApiConfig = () => {
    setApiKey(localApiKey.trim())
    setTeamKey(localTeamKey.trim())
    setMcpServerUrl(localMcpServerUrl.trim() || null)
    toast.success('API配置已保存')
  }

  // 保存System Prompt
  const handleSavePrompt = (module: string) => {
    setSystemPrompt(module, prompts[module])
    toast.success(`${MODULE_INFO[module as keyof typeof MODULE_INFO].name}的Prompt已保存`)
    setEditingModule(null)
  }

  // 恢复默认Prompt
  const handleResetPrompt = (module: string) => {
    setPrompts({
      ...prompts,
      [module]: DEFAULT_SYSTEM_PROMPTS[module as keyof typeof DEFAULT_SYSTEM_PROMPTS],
    })
    toast.info(`已恢复${MODULE_INFO[module as keyof typeof MODULE_INFO].name}的默认Prompt`)
  }

  // 复制Prompt
  const handleCopyPrompt = async (module: string) => {
    try {
      await navigator.clipboard.writeText(prompts[module])
      setCopiedId(module)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  // 切换模块展开
  const toggleModuleExpand = (module: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(module)) {
      newExpanded.delete(module)
    } else {
      newExpanded.add(module)
    }
    setExpandedModules(newExpanded)
  }

  const hasApiChanges = localApiKey !== apiKey || localTeamKey !== teamKey || localMcpServerUrl !== (mcpServerUrl || '')

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">

      {/* 主体内容 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* 左侧导航 */}
            <div className="w-56 flex-shrink-0">
              <nav className="sticky top-6 space-y-1">
                <button
                  onClick={() => setActiveTab('api')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    activeTab === 'api'
                      ? "bg-white text-cyan-700 shadow-sm border border-slate-200"
                      : "text-gray-600 hover:bg-white/60 hover:text-gray-900"
                  )}
                >
                  <Key className="h-4 w-4" />
                  API 配置
                  <ChevronRight className={cn(
                    "h-4 w-4 ml-auto transition-transform",
                    activeTab === 'api' && "rotate-90"
                  )} />
                </button>
                <button
                  onClick={() => setActiveTab('prompts')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    activeTab === 'prompts'
                      ? "bg-white text-cyan-700 shadow-sm border border-slate-200"
                      : "text-gray-600 hover:bg-white/60 hover:text-gray-900"
                  )}
                >
                  <Sliders className="h-4 w-4" />
                  System Prompts
                  <ChevronRight className={cn(
                    "h-4 w-4 ml-auto transition-transform",
                    activeTab === 'prompts' && "rotate-90"
                  )} />
                </button>
              </nav>
            </div>

            {/* 右侧内容 */}
            <div className="flex-1 min-w-0">
              {/* API 配置 Tab */}
              {activeTab === 'api' && (
                <div className="space-y-6">
                  {/* SiliconFlow API Key */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-start gap-4 p-6 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                        <Key className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">SiliconFlow API Key</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          用于调用 AI 模型服务
                        </p>
                      </div>
                      <a 
                        href="https://siliconflow.cn" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                      >
                        获取密钥
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="p-6">
                      <div className="flex gap-2">
                        <Input
                          id="api-key"
                          type={showApiKey ? 'text' : 'password'}
                          value={localApiKey}
                          onChange={(e) => setLocalApiKey(e.target.value)}
                          placeholder="sk-..."
                          className="flex-1 h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="h-11 w-11 border-slate-200 hover:border-slate-300"
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                        </Button>
                      </div>
                      {localApiKey && (
                        <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600">
                          <Shield className="h-3.5 w-3.5" />
                          <span>密钥已配置</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 团队密钥 */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-start gap-4 p-6 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">团队访问密钥</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          用于访问团队知识库，与团队管理员获取
                        </p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex gap-2">
                        <Input
                          id="team-key"
                          type={showTeamKey ? 'text' : 'password'}
                          value={localTeamKey}
                          onChange={(e) => setLocalTeamKey(e.target.value)}
                          placeholder="输入团队访问密钥"
                          className="flex-1 h-11 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowTeamKey(!showTeamKey)}
                          className="h-11 w-11 border-slate-200 hover:border-slate-300"
                        >
                          {showTeamKey ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                        </Button>
                      </div>
                      {localTeamKey && (
                        <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600">
                          <Shield className="h-3.5 w-3.5" />
                          <span>密钥已配置</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 保存按钮 */}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSaveApiConfig}
                      disabled={!hasApiChanges}
                      className="h-11 px-6 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:shadow-none"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      保存配置
                    </Button>
                  </div>
                </div>
              )}

          {/* System Prompts Tab */}
          {activeTab === 'prompts' && (
            <div className="space-y-6">
              {/* 提示信息卡片 */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(20,184,166,0.15),transparent_50%)]" />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white">System Prompts 配置中心</h4>
                    <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                      每个模块都有独立的 System Prompt，用于指导 AI 的行为模式。
                      自定义 Prompt 会保存在本地浏览器中，支持随时编辑和恢复默认。
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>已修改</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        <span>默认状态</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prompt 卡片网格 */}
              <div className="grid gap-4">
                {Object.entries(MODULE_INFO).map(([module, info]) => {
                  const isExpanded = expandedModules.has(module)
                  const isEditing = editingModule === module
                  const isModified = prompts[module] !== DEFAULT_SYSTEM_PROMPTS[module as keyof typeof DEFAULT_SYSTEM_PROMPTS]
                  const savedPrompt = getSystemPrompt(module)
                  const hasUnsavedChanges = savedPrompt && prompts[module] !== savedPrompt

                  return (
                    <div 
                      key={module} 
                      className={cn(
                        "bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all duration-300",
                        isExpanded ? "border-slate-200 shadow-lg" : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                      )}
                    >
                      {/* 模块头 - 带渐变装饰条 */}
                      <div className={cn(
                        "h-1.5 w-full bg-gradient-to-r",
                        info.gradient
                      )} />
                      
                      <button
                        onClick={() => toggleModuleExpand(module)}
                        className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-slate-50/50"
                      >
                        {/* 图标 */}
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner",
                          info.iconBg
                        )}>
                          {info.icon}
                        </div>
                        
                        {/* 信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{info.name}</h3>
                            {isModified && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-100 text-cyan-700">
                                已自定义
                              </span>
                            )}
                            {hasUnsavedChanges && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{info.description}</p>
                        </div>
                        
                        {/* 展开图标 */}
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          isExpanded ? "bg-slate-100 rotate-90" : "bg-slate-50"
                        )}>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>

                      {/* 模块内容 */}
                      {isExpanded && (
                        <div className={cn(
                          "border-t border-slate-100 p-6",
                          `bg-gradient-to-br ${info.bgGradient}`
                        )}>
                          {!isEditing ? (
                            <div className="space-y-4">
                              {/* Prompt 预览 */}
                              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-white shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt 预览</span>
                                  <span className="text-xs text-gray-400">
                                    {(prompts[module] || DEFAULT_SYSTEM_PROMPTS[module as keyof typeof DEFAULT_SYSTEM_PROMPTS]).length} 字符
                                  </span>
                                </div>
                                <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
                                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                                    {(prompts[module] || DEFAULT_SYSTEM_PROMPTS[module as keyof typeof DEFAULT_SYSTEM_PROMPTS]).slice(0, 600)}
                                    {(prompts[module] || DEFAULT_SYSTEM_PROMPTS[module as keyof typeof DEFAULT_SYSTEM_PROMPTS]).length > 600 && (
                                      <span className="text-gray-400">... (点击编辑查看完整内容)</span>
                                    )}
                                  </pre>
                                </div>
                              </div>
                              
                              {/* 操作按钮 */}
                              <div className="flex items-center gap-3">
                                <Button
                                  onClick={() => setEditingModule(module)}
                                  className={cn(
                                    "h-10 px-5 bg-gradient-to-r text-white shadow-lg hover:shadow-xl transition-shadow",
                                    info.gradient
                                  )}
                                >
                                  <Sliders className="h-4 w-4 mr-2" />
                                  编辑 Prompt
                                </Button>
                                <Button
                                  onClick={() => handleCopyPrompt(module)}
                                  variant="outline"
                                  className="h-10 px-4 bg-white/80 hover:bg-white border-slate-200"
                                >
                                  {copiedId === module ? (
                                    <>
                                      <Check className="h-4 w-4 mr-1.5 text-emerald-500" />
                                      已复制
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4 mr-1.5" />
                                      复制
                                    </>
                                  )}
                                </Button>
                                {isModified && (
                                  <Button
                                    onClick={() => handleResetPrompt(module)}
                                    variant="ghost"
                                    className="h-10 px-4 text-gray-500 hover:text-gray-700 hover:bg-white/50 ml-auto"
                                  >
                                    <RotateCcw className="h-4 w-4 mr-1.5" />
                                    恢复默认
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* 编辑区 */}
                              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                                  <span className="text-xs font-medium text-gray-500">编辑模式</span>
                                  <span className="text-xs text-gray-400">
                                    {prompts[module]?.length || 0} 字符
                                  </span>
                                </div>
                                <Textarea
                                  value={prompts[module]}
                                  onChange={(e) => setPrompts({ ...prompts, [module]: e.target.value })}
                                  placeholder="输入 System Prompt 内容..."
                                  className="w-full min-h-[320px] border-0 focus:ring-0 font-mono text-sm p-4 resize-none"
                                />
                              </div>
                              
                              {/* 编辑操作按钮 */}
                              <div className="flex items-center gap-3">
                                <Button
                                  onClick={() => handleSavePrompt(module)}
                                  className={cn(
                                    "h-10 px-5 bg-gradient-to-r text-white shadow-lg hover:shadow-xl transition-shadow",
                                    info.gradient
                                  )}
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  保存更改
                                </Button>
                                <Button
                                  onClick={() => setEditingModule(null)}
                                  variant="outline"
                                  className="h-10 px-4 bg-white hover:bg-slate-50 border-slate-200"
                                >
                                  <X className="h-4 w-4 mr-1.5" />
                                  取消
                                </Button>
                                <Button
                                  onClick={() => {
                                    handleResetPrompt(module)
                                  }}
                                  variant="ghost"
                                  className="h-10 px-4 text-gray-500 hover:text-gray-700 hover:bg-white/50 ml-auto"
                                >
                                  <RotateCcw className="h-4 w-4 mr-1.5" />
                                  恢复默认
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
