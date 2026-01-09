'use client'

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
import 'highlight.js/styles/atom-one-dark.css'
import { Send, Bookmark, BookmarkCheck, Loader2, Copy, Check, Bot, Brain, User } from 'lucide-react'
import { toast } from 'sonner'

export default function JargonKillerPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`)
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { addVocab } = useAppStore()

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 处理发送消息 - 不用思考模式，直接快速
  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // 调用流式 API
      let fullContent = ''
      
      for await (const event of api.chatStream({
        session_id: sessionId,
        message: userMessage.content,
        history: messages,
        thinking_mode: false,  // 默认不用思考模式
      })) {
        if (event.type === 'content') {
          fullContent += event.delta
          // 实时更新最后一条消息
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

  // 处理复制
  const handleCopy = async (content: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(msgId)
      toast.success('已复制')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  // 处理收藏 - 完整保存回复
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
      // 获取用户问题
      const userMsg = messages[index - 1]?.content || '术语'
      
      // 保存完整信息
      addVocab(userMsg, explanation, {
        question: userMsg,
        answer: explanation,
        sessionId: sessionId,
      })
      
      setBookmarkedMessages((prev) => new Set(prev).add(msgId))
      toast.success('已保存到单词本！')
    }
  }

  // 键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* 简洁 Header */}
      <div className="border-b border-gray-200 px-4 sm:px-8 py-4 bg-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">术语通</h1>
          <p className="text-sm text-gray-600">AI 智能导师 - 快速模式</p>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 bg-white">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-6">
              <div className="text-5xl">💡</div>
              <h2 className="text-3xl font-semibold text-gray-900">有什么我可以帮你理解的？</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                我是你的 AI 导师，可以用通俗易懂的方式解释任何技术术语和概念。
              </p>
              {/* 热门问题 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 max-w-2xl mx-auto">
                {[
                  { q: 'Transformer 是什么？', icon: '🤖' },
                  { q: 'RAG 和微调有什么区别？', icon: '🔧' },
                  { q: 'LLM 的幻觉问题怎么解决？', icon: '✨' },
                  { q: '向量数据库为什么重要？', icon: '📊' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(item.q)
                      textareaRef.current?.focus()
                    }}
                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <div className="text-lg mb-1">{item.icon}</div>
                    {item.q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 消息对话 */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* 头像 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {message.role === 'user' ? '你' : 'AI'}
              </div>

              {/* 消息内容 */}
              <div className={`flex-1 max-w-2xl ${message.role === 'user' ? 'text-right' : ''}`}>
                {message.role === 'user' ? (
                  <div className="inline-block max-w-lg bg-blue-600 text-white px-4 py-2 rounded-lg text-sm leading-relaxed">
                    {message.content}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="prose prose-sm max-w-none dark:prose-invert
                      prose-p:text-gray-800 prose-p:leading-relaxed prose-p:m-0
                      prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                      prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                      prose-strong:text-gray-900
                      prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-xs prose-code:font-mono
                      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-3 prose-pre:rounded-lg
                      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                      prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
                      prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2
                      prose-li:text-gray-800 prose-li:text-sm prose-li:my-1
                      prose-blockquote:border-l-4 prose-blockquote:border-purple-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex, rehypeHighlight]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 pt-2 opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleCopy(message.content, `msg-${index}`)}
                      >
                        {copiedId === `msg-${index}` ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            复制
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleBookmark(message, index)}
                      >
                        {bookmarkedMessages.has(`msg-${index}`) ? (
                          <>
                            <BookmarkCheck className="h-3.5 w-3.5 mr-1 text-purple-600 fill-current" />
                            已保存
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-3.5 w-3.5 mr-1" />
                            保存
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
              </div>
              <div className="text-sm text-gray-600">思考中...</div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入框 - ChatGPT 风格 */}
      <div className="border-t border-gray-200 bg-white px-4 sm:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题... (Shift+Enter 换行, Enter 发送)"
              className="w-full min-h-[52px] max-h-[200px] resize-none rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:ring-0 p-4 text-sm bg-white"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-3 bottom-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg h-8 w-8 p-0 flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            此工具可能会生成不准确的信息。请验证重要信息。
          </p>
        </div>
      </div>
    </div>
  )
}

function JargonKillerPageAdvanced() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`)
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
    
    try {
      let fullContent = ''
      
      // 使用流式 API
      for await (const event of api.chatStream({
        session_id: sessionId,
        message: userMessage.content,
        history: messages,
        thinking_mode: thinkingMode,
      })) {
        if (event.type === 'content') {
          fullContent += event.delta
          setStreamingContent(fullContent)
        } else if (event.type === 'done') {
          // 流式完成
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: fullContent,
          }
          setMessages((prev) => [...prev, assistantMessage])
          setStreamingContent('')
          setStreamingMessageId(null)
          setIsLoading(false)
        } else if (event.type === 'error') {
          throw new Error(event.error || '流式请求出错')
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      let errorMessage = '发送消息失败'
      
      if (error.message) {
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
      // 提取术语和解释，保存完整对话上下文
      const userMsg = messages[index - 1]
      const term = userMsg?.content || '术语'
      
      // 保存完整的对话上下文
      addVocab(term, explanation, {
        question: term,
        answer: explanation,
        sessionId: sessionId,
      })
      
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
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-gradient-to-br from-white via-purple-50/30 to-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">术语通</h1>
              <p className="text-sm text-gray-600">AI 智能导师，帮你理解复杂概念</p>
            </div>
          </div>
          
          {/* 思考模式按钮 - Header 中 */}
          <button
            type="button"
            onClick={() => setThinkingMode(!thinkingMode)}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              thinkingMode
                ? 'bg-purple-100 text-purple-700 border border-purple-300 shadow-md'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <Brain className={`h-4 w-4 ${thinkingMode ? 'text-purple-600' : 'text-gray-500'}`} />
            <span>{thinkingMode ? '思考模式' : '快速模式'}</span>
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 ${
          messages.length > 0 || streamingContent ? '' : 'flex items-center justify-center'
        }`}
        style={{ scrollbarGutter: 'stable' }}
      >
        <div className="max-w-5xl mx-auto w-full">
          {messages.length === 0 && !streamingContent && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100">
                <Bot className="h-10 w-10 text-purple-600" />
              </div>
              <div className="space-y-3 max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-gray-900">开始对话</h3>
                <p className="text-gray-600 leading-relaxed">
                  向我提问任何技术、商业或战略相关的术语，我会用通俗易懂的方式为你解释
                </p>
              </div>
              
              {/* 热门问题建议 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6">
                {[
                  "什么是 Transformer？如何改变了 AI？",
                  "RAG 和微调的区别是什么？",
                  "解释一下大模型的'幻觉'问题",
                  "什么是向量数据库？为什么重要？",
                ].map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(question)
                      textareaRef.current?.focus()
                    }}
                    className="p-3 rounded-lg bg-white border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 text-left text-sm text-gray-700 hover:text-gray-900 font-medium"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 消息列表 */}
          <div className="space-y-6">
            {messages.map((message, index) => {
              const messageId = `msg-${index}`
              const isUser = message.role === 'user'
              
              return (
                <div
                  key={index}
                  className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}
                >
                  {/* 头像 */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-white flex-row-center ${
                    isUser 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-br from-purple-600 to-indigo-600'
                  }`}>
                    {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>
                  
                  {/* 消息内容 */}
                  <div className={`flex-1 max-w-2xl ${isUser ? 'text-right' : 'text-left'}`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 shadow-sm rounded-bl-none'
                    }`}>
                      {isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert
                          prose-p:text-gray-800 prose-p:leading-relaxed prose-p:m-0
                          prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-2
                          prose-h1:text-base prose-h2:text-base prose-h3:text-sm
                          prose-strong:text-gray-900 prose-strong:font-semibold
                          prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-xs prose-code:font-mono
                          prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-3 prose-pre:rounded-lg
                          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                          prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
                          prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2
                          prose-li:text-gray-800 prose-li:my-1
                          prose-blockquote:border-l-4 prose-blockquote:border-purple-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700">
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
                    {!isUser && (
                      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          onClick={() => handleCopy(message.content, messageId)}
                        >
                          {copiedMessageId === messageId ? (
                            <>
                              <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 mr-1.5" />
                              复制
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          onClick={() => handleBookmark(message, index)}
                        >
                          {bookmarkedMessages.has(messageId) ? (
                            <>
                              <BookmarkCheck className="h-3.5 w-3.5 mr-1.5 text-purple-600 fill-current" />
                              已收藏
                            </>
                          ) : (
                            <>
                              <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                              收藏
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* 流式输出显示 */}
            {streamingMessageId && streamingContent && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex-1 max-w-2xl">
                  <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="prose prose-sm max-w-none
                      prose-p:text-gray-800 prose-p:leading-relaxed prose-p:m-0
                      prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-2
                      prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-xs">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex, rehypeHighlight]}
                      >
                        {streamingContent}
                      </ReactMarkdown>
                    </div>
                    <span className="inline-block w-2 h-4 bg-purple-600 ml-1 mt-1 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {isLoading && !streamingContent && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex-1 max-w-2xl">
                  <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      <span className="text-sm text-gray-600">
                        {thinkingMode ? 'AI 正在深入思考...' : 'AI 正在快速回复...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入框 - 黏性 */}
      <div className="flex-shrink-0 border-t border-gray-200/50 bg-white/80 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题，如'什么是 Transformer？' (Shift+Enter 换行，Enter 发送)"
              className="min-h-[56px] max-h-[200px] resize-none bg-white border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-gray-900 placeholder:text-gray-500 pr-32 rounded-2xl px-4 py-3 text-sm"
              disabled={isLoading}
            />
            
            {/* 操作按钮 - 右侧 */}
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              {/* 移动端思考模式 */}
              <button
                type="button"
                onClick={() => setThinkingMode(!thinkingMode)}
                className={`sm:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                  thinkingMode
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
                title={thinkingMode ? '思考模式' : '快速模式'}
              >
                <Brain className="h-4 w-4" />
              </button>
              
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="h-8 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    <span>发送</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
