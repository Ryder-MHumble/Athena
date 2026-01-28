/**
 * 单词本搜索栏组件
 */

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FilterMode } from '../hooks/useFlashcards'

interface SearchBarProps {
  searchTerm: string
  filterMode?: FilterMode
  onSearchChange: (value: string) => void
  onFilterChange?: (mode: FilterMode) => void
}

export function SearchBar({ searchTerm, onSearchChange }: SearchBarProps) {
  return (
    <div className="relative group w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
      <Input
        placeholder="搜索已保存的术语 (如: 'Pareto', 'SWOT')..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full h-10 pl-10 pr-10 text-sm border-0 bg-white rounded-xl shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-cyan-500/40 transition-all placeholder:text-gray-400"
      />
      {searchTerm && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

