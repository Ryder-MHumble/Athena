/**
 * 术语通聊天功能 Hook
 */

import { useState, useRef, useEffect } from 'react'
import { api, ChatMessage } from '@/lib/api'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/useAppStore'

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const getSystemPrompt = useAppStore((state) => state.getSystemPrompt)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 处理发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    const question = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      let fullContent = ''
      
      // 获取用户自定义的 system prompt（如果有）
      const customSystemPrompt = getSystemPrompt('jargon-killer')
      
      for await (const event of api.chatStream({
        session_id: sessionId,
        message: question,
        history: messages,
        thinking_mode: false,
        system_prompt: customSystemPrompt || undefined,
      })) {
        if (event.type === 'content') {
          fullContent += event.delta
          setMessages((prev) => {
            const updated = [...prev]
            const lastIdx = updated.length - 1
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              updated[lastIdx].content = fullContent
            } else {
              updated.push({ role: 'assistant', content: fullContent })
            }
            return updated
          })
        } else if (event.type === 'done') {
          setIsLoading(false)
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      toast.error(error.message || '发送失败，请重试')
      setIsLoading(false)
    }
  }

  return {
    messages,
    input,
    isLoading,
    sessionId,
    messagesEndRef,
    setInput,
    handleSend,
  }
}

