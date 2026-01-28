/**
 * 术语通消息列表组件
 */

import { ChatMessage } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.css'
import { Loader2, Copy, Check, Bookmark, BookmarkCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  bookmarkedMessages: Set<string>
  copiedId: string | null
  onCopy: (content: string, msgId: string) => void
  onBookmark: (message: ChatMessage, index: number) => void
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export function MessageList({
  messages,
  isLoading,
  bookmarkedMessages,
  copiedId,
  onCopy,
  onBookmark,
  messagesEndRef,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 min-h-0">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-6">
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
                <div className="space-y-3">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow">
                    <div className="prose prose-base max-w-none
                      prose-p:text-gray-800 prose-p:leading-[1.8] prose-p:my-4 prose-p:text-[15px]
                      prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3 prose-headings:leading-tight
                      prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                      prose-strong:text-gray-900 prose-strong:font-semibold
                      prose-code:text-cyan-600 prose-code:bg-cyan-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-sm prose-pre:p-4 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:my-5
                      prose-a:text-cyan-600 prose-a:no-underline hover:prose-a:underline
                      prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4 prose-ul:space-y-2
                      prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4 prose-ol:space-y-2
                      prose-li:text-gray-800 prose-li:text-[15px] prose-li:leading-[1.7]
                      prose-blockquote:border-l-4 prose-blockquote:border-cyan-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:my-5
                      prose-hr:border-gray-200 prose-hr:my-6
                      prose-table:text-sm prose-table:my-5
                      [&>*:first-child]:mt-0
                      [&>*:last-child]:mb-0">
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
                      onClick={() => onCopy(message.content, `msg-${index}`)}
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
                      onClick={() => onBookmark(message, index)}
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
  )
}

