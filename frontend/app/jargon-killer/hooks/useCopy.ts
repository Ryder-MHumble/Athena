/**
 * 术语通复制功能 Hook
 */

import { useState } from 'react'
import { toast } from 'sonner'

export function useCopy() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  return {
    copiedId,
    handleCopy,
  }
}

