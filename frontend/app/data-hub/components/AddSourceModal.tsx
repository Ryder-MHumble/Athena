'use client'

/**
 * 添加信源弹窗组件
 * 支持批量添加 Twitter 和 YouTube 信源账号
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'

interface AddSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (urls: string[]) => Promise<void>
}

export function AddSourceModal({
  isOpen,
  onClose,
  onAdd,
}: AddSourceModalProps) {
  const [urls, setUrls] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urls.trim()) {
      setError('请输入 URL')
      return
    }

    // 解析多行 URL
    const urlList = urls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0)

    if (urlList.length === 0) {
      setError('请输入有效的 URL')
      return
    }

    // 验证所有 URL 格式
    const invalidUrls = urlList.filter(url => {
      const isTwitter = url.includes('x.com/') || url.includes('twitter.com/')
      const isYoutube = url.includes('youtube.com/')
      return !isTwitter && !isYoutube
    })

    if (invalidUrls.length > 0) {
      setError(`以下 URL 格式无效：\n${invalidUrls.join('\n')}`)
      return
    }

    setIsAdding(true)
    setError('')

    try {
      await onAdd(urlList)
      setUrls('')
      onClose()
    } catch (err: any) {
      setError(err.message || '添加失败')
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    setUrls('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">添加信源账号</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                账号 URL（支持批量添加，一行一个）
              </label>
              <textarea
                placeholder={`输入 X 或 YouTube 账号 URL，一行一个...\n\n例如：\nhttps://x.com/karpathy\nhttps://x.com/AndrewYNg\nhttps://youtube.com/@a16z`}
                value={urls}
                onChange={(e) => {
                  setUrls(e.target.value)
                  setError('')
                }}
                rows={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                支持格式：https://x.com/username 或 https://youtube.com/@channel
              </p>
              {error && <p className="mt-1.5 text-xs text-red-500 whitespace-pre-wrap">{error}</p>}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              取消
            </Button>
            <Button
              type="submit"
              disabled={isAdding}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  添加中...
                </>
              ) : (
                '添加'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
