'use client'

/**
 * 术语通模块 - 多轮对话界面
 * 参考 ChatGPT 和 DeepSeek 设计
 * 支持复制、思考模式、高级Markdown渲染、流式输出
 */

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api, ChatMessage } from '@/lib/api'
import { useAppStore } from '@/stores/useAppStore'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'
import { Send, Bookmark, BookmarkCheck, Loader2, Bot, User, Copy, Check, Brain } from 'lucide-react'
import { toast } from 'sonner'

export default function JargonKillerPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Set<string>>(new Set())
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [thinkingMode, setThinkingMode] = useState(true)
  const [streamingContent, setStreamingContent] = useState<string>('')
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { addVocab } = useAppStore()

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingContent])

  // 处理发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    }

    const tempAssistantId = `temp-${Date.now()}`
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingContent('')
    setStreamingMessageId(tempAssistantId)
    
    let streamInterval: NodeJS.Timeout | null = null

    try {
      const response = await api.chat({
        session_id: sessionId,
        message: userMessage.content,
        history: messages,
        thinking_mode: thinkingMode,
      })

      // 模拟流式输出（实际应该从后端SSE获取）
      const fullText = response.message
      if (!fullText) {
        setIsLoading(false)
        setStreamingContent('')
        setStreamingMessageId(null)
        return
      }
      
      // 立即开始流式输出，不等待完整响应
      let currentIndex = 0
      streamInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setStreamingContent(fullText.slice(0, currentIndex + 10))
          currentIndex += 10
        } else {
          if (streamInterval) {
            clearInterval(streamInterval)
            streamInterval = null
          }
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: fullText,
          }
          setMessages((prev) => [...prev, assistantMessage])
          setStreamingContent('')
          setStreamingMessageId(null)
          setIsLoading(false)
        }
      }, 30) // 每30ms输出10个字符，让流式效果更明显

    } catch (error: any) {
      // 清理流式输出定时器
      if (streamInterval) {
        clearInterval(streamInterval)
        streamInterval = null
      }
      
      console.error('Chat error:', error)
      let errorMessage = '发送消息失败'
      
      if (error.response) {
        const status = error.response.status
        try {
          const errorData = await error.response.json()
          if (status === 401) {
            errorMessage = 'API Key 未配置或无效，请检查环境变量或设置页面'
          } else if (status === 422) {
            errorMessage = `请求格式错误: ${errorData.detail || '请检查请求数据格式'}`
          } else if (status === 500) {
            errorMessage = `服务器错误: ${errorData.detail || '请稍后重试'}`
          } else {
            errorMessage = errorData.detail || error.message || '请求失败'
          }
        } catch {
          errorMessage = `请求失败 (${status}): ${error.message || '未知错误'}`
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      setStreamingContent('')
      setStreamingMessageId(null)
      setIsLoading(false)
    }
  }

  // 处理复制
  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      toast.error('复制失败')
    }
  }

  // 处理收藏
  const handleBookmark = (message: ChatMessage, index: number) => {
    if (message.role !== 'assistant') return

    const messageId = `msg-${index}`
    const explanation = message.content?.trim() || streamingContent.trim()
    if (!explanation) {
      toast.error('当前回答为空，无法收藏')
      return
    }

    if (bookmarkedMessages.has(messageId)) {
      toast.info('已取消收藏')
      setBookmarkedMessages((prev) => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
    } else {
      // 提取术语和解释
      const userMsg = messages[index - 1]
      const term = userMsg?.content || '术语'
      addVocab(term, explanation)
      setBookmarkedMessages((prev) => new Set(prev).add(messageId))
      toast.success('已添加到生词本')
    }
  }

  // 处理键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Header - 简化 */}
      <div className="mb-4 flex-shrink-0 flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">术语通</h1>
      </div>

      {/* 消息列表 */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 space-y-6 mb-4 custom-scrollbar min-h-0 px-2 ${
          messages.length > 0 || streamingContent ? 'overflow-y-auto' : 'overflow-hidden'
        }`}
        style={{ scrollbarGutter: 'stable' }}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100">
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">开始对话</h3>
                <p className="text-sm text-gray-500">
                  例如："什么是 Transformer？" 或 "解释一下 RAG 和微调的区别"
                </p>
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          const messageId = `msg-${index}`
          const isUser = message.role === 'user'
          
          return (
            <div
              key={index}
              className={`flex gap-4 group ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* 头像 */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isUser 
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}>
                {isUser ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              
              {/* 消息内容 */}
              <div className={`flex-1 ${isUser ? 'flex flex-col items-end' : ''} max-w-[85%]`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}>
                  {isUser ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none 
                      prose-p:text-gray-800 prose-p:leading-relaxed 
                      prose-headings:text-gray-900 prose-headings:font-semibold 
                      prose-strong:text-gray-900 
                      prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                      prose-pre:bg-gray-900 prose-pre:text-gray-100
                      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                      prose-ul:list-disc prose-ol:list-decimal
                      prose-blockquote:border-l-4 prose-blockquote:border-purple-300 prose-blockquote:pl-4 prose-blockquote:italic">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex, rehypeHighlight]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                
                {/* 操作按钮 - 悬浮显示 */}
                <div className={`flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                  isUser ? 'flex-row-reverse' : ''
                }`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => handleCopy(message.content, messageId)}
                  >
                    {copiedMessageId === messageId ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        复制
                      </>
                    )}
                  </Button>
                  
                  {!isUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
                      onClick={() => handleBookmark(message, index)}
                    >
                      {bookmarkedMessages.has(messageId) ? (
                        <>
                          <BookmarkCheck className="h-3 w-3 mr-1 text-purple-600 fill-current" />
                          已收藏
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-3 w-3 mr-1" />
                          收藏
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* 流式输出显示 */}
        {streamingMessageId && streamingContent && (
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 max-w-[85%]">
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3">
                <div className="prose prose-sm max-w-none 
                  prose-p:text-gray-800 prose-p:leading-relaxed 
                  prose-headings:text-gray-900 prose-headings:font-semibold 
                  prose-strong:text-gray-900 
                  prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeHighlight]}
                  >
                    {streamingContent}
                  </ReactMarkdown>
                </div>
                <span className="inline-block w-2 h-4 bg-purple-600 ml-1 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 max-w-[85%]">
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-600">
                    {thinkingMode ? 'AI 正在思考...' : 'AI 正在回复...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 - DeepSeek风格，思考模式按钮在输入框内 */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto p-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题... (Shift+Enter 换行，Enter 发送)"
              className="min-h-[60px] max-h-[200px] resize-none bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-gray-900 placeholder:text-gray-400 pr-24"
              disabled={isLoading}
            />
            
            {/* 思考模式按钮 - 在输入框内右侧 */}
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setThinkingMode(!thinkingMode)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  thinkingMode
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Brain className={`h-3.5 w-3.5 ${thinkingMode ? 'text-purple-600' : 'text-gray-400'}`} />
                <span>{thinkingMode ? '思考' : '快速'}</span>
              </button>
              
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="h-8 px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
