import React from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Mic, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TabSelectorProps {
  activeTab: 'analysis' | 'speech' | 'chat'
  onTabChange: (tab: 'analysis' | 'speech' | 'chat') => void
}

export const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'analysis' as const, icon: FileText, label: '分析结果' },
    { id: 'speech' as const, icon: Mic, label: '讲解建议' },
    { id: 'chat' as const, icon: Bot, label: 'AI 解读' },
  ]

  return (
    <div className="flex border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 px-6 sm:px-8">
      {tabs.map(({ id, icon: Icon, label }) => (
        <Button
          key={id}
          variant="ghost"
          onClick={() => onTabChange(id)}
          className={cn(
            "flex-1 max-w-48 rounded-none py-4 relative text-sm font-medium transition-colors",
            activeTab === id
              ? "text-cyan-600 hover:text-cyan-700"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
          )}
        >
          <Icon className="h-4 w-4 mr-2" />
          {label}
          {activeTab === id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-500" />
          )}
        </Button>
      ))}
    </div>
  )
}
