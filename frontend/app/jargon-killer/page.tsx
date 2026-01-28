'use client'

/**
 * 术语通页面 - 模块化版本
 * 页面文件仅负责组装各个组件和hooks
 */

import { useRef } from 'react'
import { useChat } from './hooks/useChat'
import { useBookmark } from './hooks/useBookmark'
import { useCopy } from './hooks/useCopy'
import { WelcomeScreen } from './components/WelcomeScreen'
import { MessageList } from './components/MessageList'
import { ChatInput } from './components/ChatInput'

export default function JargonKillerPage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { messages, input, isLoading, sessionId, messagesEndRef, setInput, handleSend } = useChat()
  const { bookmarkedMessages, handleBookmark } = useBookmark(messages, sessionId)
  const { copiedId, handleCopy } = useCopy()

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {messages.length === 0 ? (
          <WelcomeScreen
            onPromptSelect={setInput}
            textareaRef={textareaRef}
          />
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            bookmarkedMessages={bookmarkedMessages}
            copiedId={copiedId}
            onCopy={handleCopy}
            onBookmark={handleBookmark}
            messagesEndRef={messagesEndRef}
          />
        )}
      </div>
      <ChatInput
        input={input}
        isLoading={isLoading}
        textareaRef={textareaRef}
        onInputChange={setInput}
        onSend={handleSend}
      />
    </div>
  )
}
