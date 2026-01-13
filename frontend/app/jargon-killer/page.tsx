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
import { Send, Bookmark, BookmarkCheck, Loader2, Copy, Check, Brain } from 'lucide-react'
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
    <div className="h-screen bg-gradient-to-br from-white to-gray-50 flex flex-col overflow-hidden">
      {/* 顶部导航栏 */}
      <div className="flex-shrink-0 sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 sm:px-8 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">术语通</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">AI 智能导师 • 快速理解任何概念</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-sm sm:text-base font-semibold text-cyan-600">{bookmarkedMessages.size} 个已保存</p>
            <p className="text-xs text-gray-500 mt-0.5">收藏到单词本</p>
          </div>
        </div>
      </div>

      {/* 主体内容 - 使用flexbox分割 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* 欢迎界面或消息列表 */}
        {messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-10 flex items-center justify-center">
            <div className="max-w-2xl w-full space-y-8">
              {/* 欢迎区 */}
              <div className="text-center space-y-6">
                <div className="inline-block p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-cyan-100 to-teal-100">
                  <Brain className="h-12 w-12 sm:h-16 sm:w-16 text-cyan-600 mx-auto" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">有什么我可以帮你理解的？</h2>
                  <p className="text-gray-600 text-sm sm:text-lg leading-relaxed">
                    我是你的 AI 导师，可以用简洁清晰的方式解释任何技术术语和复杂概念。
                  </p>
                </div>
              </div>

              {/* 快速提示 - 响应式网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { q: 'Transformer 是什么？', icon: '🤖', color: 'from-blue-500 to-cyan-500' },
                  { q: 'RAG 和微调的区别？', icon: '🔧', color: 'from-purple-500 to-pink-500' },
                  { q: 'LLM 幻觉问题如何解决？', icon: '✨', color: 'from-amber-500 to-orange-500' },
                  { q: '向量数据库为什么重要？', icon: '📊', color: 'from-green-500 to-emerald-500' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(item.q)
                      textareaRef.current?.focus()
                    }}
                    className="group relative p-4 rounded-xl border-2 border-gray-200 hover:border-cyan-400 active:border-cyan-500 transition-all text-left overflow-hidden bg-white hover:bg-cyan-50/50"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <div className="relative space-y-2">
                      <div className="text-lg">{item.icon}</div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{item.q}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 sm:gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* 头像 */}
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs sm:text-sm font-semibold ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
                    }`}
                  >
                    {message.role === 'user' ? '你' : 'AI'}
                  </div>

                  {/* 消息内容 */}
                  <div className={`flex-1 max-w-xs sm:max-w-xl group ${message.role === 'user' ? 'text-right' : ''}`}>
                    {message.role === 'user' ? (
                      <div className="inline-block max-w-xs sm:max-w-lg bg-gradient-to-r from-cyan-500 to-teal-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md break-words">
                        {message.content}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                          <div className="prose prose-sm max-w-none text-xs sm:text-sm
                            prose-p:text-gray-800 prose-p:leading-relaxed prose-p:m-0
                            prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-2
                            prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
                            prose-strong:text-gray-900 prose-strong:font-semibold
                            prose-code:text-cyan-600 prose-code:bg-cyan-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                            prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto
                            prose-a:text-cyan-600 prose-a:no-underline hover:prose-a:underline
                            prose-ul:list-disc prose-ul:pl-4 prose-ul:my-1.5
                            prose-ol:list-decimal prose-ol:pl-4 prose-ol:my-1.5
                            prose-li:text-gray-800 prose-li:text-xs sm:prose-li:text-sm prose-li:my-0.5
                            prose-blockquote:border-l-4 prose-blockquote:border-cyan-300 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-gray-700">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex, rehypeHighlight]}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 sm:h-8 px-2 sm:px-2.5 text-xs border border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-lg transition-all"
                            onClick={() => handleCopy(message.content, `msg-${index}`)}
                          >
                            {copiedId === `msg-${index}` ? (
                              <>
                                <Check className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-1 text-green-600" />
                                <span className="hidden sm:inline">已复制</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-1" />
                                <span className="hidden sm:inline">复制</span>
                              </>
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 sm:h-8 px-2 sm:px-2.5 text-xs rounded-lg border transition-colors ${
                              bookmarkedMessages.has(`msg-${index}`)
                                ? 'border-cyan-400 bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
                                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                            onClick={() => handleBookmark(message, index)}
                          >
                            {bookmarkedMessages.has(`msg-${index}`) ? (
                              <>
                                <BookmarkCheck className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-1 fill-current" />
                                <span className="hidden sm:inline">已保存</span>
                              </>
                            ) : (
                              <>
                                <Bookmark className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-1" />
                                <span className="hidden sm:inline">保存</span>
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
                <div className="flex gap-2 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-gray-600" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                    思考中...
                  </div>
                </div>
              )}

              {/* 占位符确保最后消息不被输入框遮挡 */}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        )}
      </div>

      {/* 输入框 - 固定在底部 */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 sm:px-8 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题... (Shift+Enter 换行，Enter 发送)"
              className="w-full min-h-[48px] sm:min-h-[56px] max-h-[200px] resize-none rounded-xl border-2 border-gray-300 focus:border-cyan-500 focus:ring-0 p-3 sm:p-4 text-xs sm:text-sm bg-white placeholder:text-gray-500 transition-colors"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2.5 sm:right-3 bottom-2.5 sm:bottom-3 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white rounded-lg h-8 sm:h-9 w-8 sm:w-9 p-0 flex items-center justify-center shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 animate-spin" />
              ) : (
                <Send className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 sm:mt-3">
            💡 提示：此工具使用AI生成，请验证重要信息。支持 Markdown、数学公式（$...$）
          </p>
        </div>
      </div>
    </div>
  )
}
