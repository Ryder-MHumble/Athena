import React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { toast } from 'sonner'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatTabProps {
  chatHistory: ChatMessage[]
  chatQuestion: string
  onQuestionChange: (question: string) => void
  onSend: () => void
  isLoading: boolean
  streamingContent: string
}

export const ChatTab: React.FC<ChatTabProps> = ({
  chatHistory,
  chatQuestion,
  onQuestionChange,
  onSend,
  isLoading,
  streamingContent,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

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

  // 自动滚动到底部
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, streamingContent])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 对话历史 - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto space-y-4 p-6 custom-scrollbar min-h-0">
        {chatHistory.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-sm">开始提问，AI 会根据论文内容为你解答</p>
          </div>
        )}
        {chatHistory.map((msg, idx) => (
          <ChatMessage 
            key={idx} 
            message={msg} 
            msgId={`msg-${idx}`}
            onCopy={handleCopy}
            copiedId={copiedId}
          />
        ))}
        {isLoading && (
          <StreamingChatMessage content={streamingContent} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 - 固定在底部 */}
      <div className="flex-shrink-0 flex gap-2 border-t border-gray-200 p-4 bg-white">
        <Textarea
          value={chatQuestion}
          onChange={(e) => onQuestionChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder="输入你的问题..."
          className="min-h-[50px] max-h-[100px] resize-none text-sm flex-1"
          disabled={isLoading}
        />
        <Button
          onClick={onSend}
          disabled={!chatQuestion.trim() || isLoading}
          size="lg"
          className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white h-[50px] px-4"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}

interface ChatMessageProps {
  message: ChatMessage
  msgId: string
  onCopy: (content: string, msgId: string) => void
  copiedId: string | null
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, msgId, onCopy, copiedId }) => {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* 头像 */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
          isUser
            ? 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white'
            : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
        }`}
      >
        {isUser ? '你' : 'AI'}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 max-w-[80%] group`}>
        {isUser ? (
          <div className="inline-block max-w-full bg-gradient-to-r from-cyan-500 to-teal-600 text-white px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md break-words">
            {message.content}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="prose prose-sm max-w-none text-sm
                prose-p:text-gray-800 prose-p:leading-relaxed prose-p:m-0
                prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-2
                prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-code:text-cyan-600 prose-code:bg-cyan-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto
                prose-a:text-cyan-600 prose-a:no-underline hover:prose-a:underline
                prose-ul:list-disc prose-ul:pl-4 prose-ul:my-1.5
                prose-ol:list-decimal prose-ol:pl-4 prose-ol:my-1.5
                prose-li:text-gray-800 prose-li:text-sm prose-li:my-0.5
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
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs border border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => onCopy(message.content, msgId)}
              >
                {copiedId === msgId ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    <span>复制</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface StreamingChatMessageProps {
  content: string
}

const StreamingChatMessage: React.FC<StreamingChatMessageProps> = ({ content }) => {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-700">
        AI
      </div>
      <div className="flex-1 max-w-[80%]">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          {content ? (
            <div className="prose prose-sm max-w-none text-sm
              prose-p:text-gray-800 prose-p:leading-relaxed prose-p:m-0
              prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-2
              prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-code:text-cyan-600 prose-code:bg-cyan-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
              prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto
              prose-a:text-cyan-600 prose-a:no-underline hover:prose-a:underline
              prose-ul:list-disc prose-ul:pl-4 prose-ul:my-1.5
              prose-ol:list-decimal prose-ol:pl-4 prose-ol:my-1.5
              prose-li:text-gray-800 prose-li:text-sm prose-li:my-0.5
              prose-blockquote:border-l-4 prose-blockquote:border-cyan-300 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-gray-700">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
          )}
        </div>
      </div>
    </div>
  )
}
