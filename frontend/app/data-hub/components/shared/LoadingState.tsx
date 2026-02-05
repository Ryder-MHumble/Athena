'use client'

/**
 * 加载状态组件
 */

import React from 'react'
import { Loader2 } from 'lucide-react'

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">加载中...</p>
      </div>
    </div>
  )
}
