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
    { id: 'analysis' as const, icon: FileText, label: '分析' },
    { id: 'speech' as const, icon: Mic, label: '讲解' },
    { id: 'chat' as const, icon: Bot, label: '对话' },
  ]

  return (
    <div className="flex items-center gap-1">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            activeTab === id
              ? "bg-cyan-100 text-cyan-700"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}
