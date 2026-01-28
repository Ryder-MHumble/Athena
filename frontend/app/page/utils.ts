/**
 * 主页工具函数和常量
 */

import { Feature, Advantage, Stat } from './types'
import { BookOpen, FileText, Users, Zap, CheckCircle, Sparkles } from "lucide-react"

export const features: Feature[] = [
  {
    icon: BookOpen,
    title: "术语通",
    description: "遇到不懂的专业名词？AI 导师秒级响应，用通俗易懂的语言解释复杂概念，支持多轮追问直到彻底理解",
    benefits: ["流式实时响应", "多轮深度追问", "一键收藏到知识卡片"],
    href: "/jargon-killer",
    color: "from-cyan-400 to-cyan-600",
    bgColor: "bg-cyan-50",
    accentColor: "text-cyan-600",
    category: "AI 工具"
  },
  {
    icon: FileText,
    title: "论文伴侣",
    description: "上传 PDF 或输入 Arxiv 链接，自动提取核心观点、生成结构化分析报告和口语化讲解文稿",
    benefits: ["结构化论文解析", "智能讲解文稿", "论文分析收藏"],
    href: "/paper-copilot",
    color: "from-teal-400 to-teal-600",
    bgColor: "bg-teal-50",
    accentColor: "text-teal-600",
    category: "AI 工具"
  },
  {
    icon: Users,
    title: "知识沉淀",
    description: "上传团队内部文档，构建可检索的智能知识库，基于语义搜索快速定位所需内容",
    benefits: ["向量语义检索", "智能问答对话", "团队知识共享"],
    href: "/team-brain",
    color: "from-emerald-400 to-emerald-600",
    bgColor: "bg-emerald-50",
    accentColor: "text-emerald-600",
    category: "知识管理"
  },
  {
    icon: Sparkles,
    title: "知识卡片",
    description: "统一管理术语收藏和论文分析，构建个人知识体系，支持分类筛选和快速检索",
    benefits: ["术语与论文双类型", "分类筛选管理", "3D 卡片复习"],
    href: "/flashcards",
    color: "from-purple-400 to-purple-600",
    bgColor: "bg-purple-50",
    accentColor: "text-purple-600",
    category: "知识管理"
  }
]

export const advantages: Advantage[] = [
  {
    icon: Zap,
    title: "秒级响应",
    description: "基于先进的大语言模型，实时流式输出"
  },
  {
    icon: Sparkles,
    title: "AI 驱动",
    description: "高质量的学习支持和个性化指导"
  },
  {
    icon: CheckCircle,
    title: "易于使用",
    description: "直观界面设计，无需技术背景"
  }
]

export const stats: Stat[] = [
  { label: "AI 响应", value: "SSE 流式" },
  { label: "向量模型", value: "BGE-M3" },
  { label: "主力模型", value: "Qwen 72B" },
  { label: "知识库", value: "RAG 增强" }
]

