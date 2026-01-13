import React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, MessageSquare, Send, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

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
  return (
    <div className="flex flex-col h-full">
      {/* 对话历史 */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar min-h-0">
        {chatHistory.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>开始提问，AI 会根据论文内容为你解答</p>
          </div>
        )}
        {chatHistory.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}
        {isLoading && (
          <StreamingChatMessage content={streamingContent} />
        )}
      </div>

      {/* 输入框 */}
      <div className="flex gap-2 border-t border-gray-200 pt-4 flex-shrink-0">
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
          className="min-h-[60px] max-h-[120px] resize-none text-sm"
          disabled={isLoading}
        />
        <Button
          onClick={onSend}
          disabled={!chatQuestion.trim() || isLoading}
          size="lg"
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
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
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:text-gray-800 prose-p:leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  )
}

interface StreamingChatMessageProps {
  content: string
}

const StreamingChatMessage: React.FC<StreamingChatMessageProps> = ({ content }) => {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="bg-gray-100 rounded-lg px-4 py-3 flex-1">
        {content ? (
          <div
            className="prose prose-sm max-w-none
            prose-p:text-gray-800 prose-p:leading-relaxed prose-p:m-0
            prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-2
            prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
            prose-strong:text-gray-900
            prose-code:text-purple-600 prose-code:bg-white prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-xs prose-code:font-mono
            prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-3 prose-pre:rounded-lg
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
            prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2
            prose-li:text-gray-800 prose-li:text-sm prose-li:my-1
            prose-blockquote:border-l-4 prose-blockquote:border-purple-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700"
          >
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
        )}
      </div>
    </div>
  )
}
