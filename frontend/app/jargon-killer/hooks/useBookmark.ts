/**
 * 术语通收藏功能 Hook
 */

import { useState } from 'react'
import { ChatMessage } from '@/lib/api'
import { useAppStore } from '@/stores/useAppStore'
import { toast } from 'sonner'

export function useBookmark(messages: ChatMessage[], sessionId: string) {
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Set<string>>(new Set())
  const { addVocab } = useAppStore()

  const handleBookmark = (message: ChatMessage, index: number) => {
    if (message.role !== 'assistant') return

    const msgId = `msg-${index}`
    const explanation = message.content?.trim()
    if (!explanation) {
      toast.error('回复为空，无法收藏')
      return
    }

    if (bookmarkedMessages.has(msgId)) {
      setBookmarkedMessages((prev) => {
        const next = new Set(prev)
        next.delete(msgId)
        return next
      })
      toast.info('已取消收藏')
    } else {
      const userMsg = messages[index - 1]?.content || '术语'
      
      addVocab(userMsg, explanation, {
        question: userMsg,
        answer: explanation,
        sessionId: sessionId,
      })
      
      setBookmarkedMessages((prev) => new Set(prev).add(msgId))
      toast.success('已保存到单词本！')
    }
  }

  return {
    bookmarkedMessages,
    handleBookmark,
  }
}

