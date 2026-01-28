/**
 * 单词本功能 Hook
 */

import { useState } from 'react'
import { useAppStore, VocabItem } from '@/stores/useAppStore'
import { toast } from 'sonner'

export type FilterMode = 'all' | 'recent' | 'frequent'

export function useFlashcards() {
  const { vocabList, removeVocab, recordReview } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set())
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  const filteredVocab = vocabList
    .filter((item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.explanation?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (filterMode === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (filterMode === 'frequent') {
        return (b.reviewCount || 0) - (a.reviewCount || 0)
      }
      return 0
    })

  const handleDelete = (id: string) => {
    removeVocab(id)
    toast.success('已删除')
  }

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success('已复制')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  const toggleFlip = (id: string) => {
    setFlippedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
        recordReview(id)
      }
      return newSet
    })
  }

  return {
    vocabList,
    filteredVocab,
    searchTerm,
    filterMode,
    copiedId,
    flippedIds,
    setSearchTerm,
    setFilterMode,
    handleDelete,
    handleCopy,
    toggleFlip,
  }
}

