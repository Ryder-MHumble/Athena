/**
 * 术语通聊天输入组件
 */

import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  input: string
  isLoading: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement>
  onInputChange: (value: string) => void
  onSend: () => void
}

export function ChatInput({ input, isLoading, textareaRef, onInputChange, onSend }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200/60 px-4 sm:px-8 py-3 sm:py-4 bg-white z-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题... (Shift+Enter 换行，Enter 发送)"
            className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 px-3 py-2.5 text-sm bg-white placeholder:text-gray-400 transition-colors"
            disabled={isLoading}
            rows={1}
          />
          <Button
            onClick={onSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white rounded-lg h-[44px] w-[44px] p-0 flex items-center justify-center shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
  )
}

