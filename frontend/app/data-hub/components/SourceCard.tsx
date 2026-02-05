'use client'

/**
 * 信源卡片组件 - 优化版
 * 显示单个信源的信息和操作，包含头像、粉丝数等
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink, Trash2, Loader2, Users, BadgeCheck } from 'lucide-react'
import { BsTwitterX, BsYoutube } from 'react-icons/bs'

interface SourceCardProps {
  platform: 'twitter' | 'youtube'
  name: string  // username，用于删除等操作
  displayName?: string  // 显示名称，优先显示此字段
  url: string
  avatar?: string
  followers?: number
  verified?: boolean
  onDelete: (platform: string, name: string) => Promise<void>
}

export function SourceCard({
  platform,
  name,
  displayName,
  url,
  avatar,
  followers,
  verified,
  onDelete
}: SourceCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(platform, name)
    } catch (err) {
      console.error('删除失败:', err)
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  const platformConfig = {
    twitter: {
      icon: BsTwitterX,
      color: 'text-gray-900',
      bgColor: 'bg-gray-100',
      borderColor: 'hover:border-gray-300'
    },
    youtube: {
      icon: BsYoutube,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'hover:border-red-300'
    }
  }

  const config = platformConfig[platform]
  const Icon = config.icon

  const formatFollowers = (num?: number) => {
    if (!num) return null
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className={`group relative bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all ${config.borderColor}`}>
      {/* 头像和平台标识 */}
      <div className="flex items-start gap-3 mb-2">
        {/* 头像 */}
        <div className="relative flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={displayName || name}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || name)}&background=random`
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {(displayName || name).charAt(0).toUpperCase()}
            </div>
          )}
          {/* 平台角标 */}
          <div className={`absolute -bottom-1 -right-1 ${config.bgColor} rounded-full p-1 border-2 border-white`}>
            <Icon className={`h-3 w-3 ${config.color}`} />
          </div>
        </div>

        {/* 账号信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{displayName || name}</h4>
            {verified && (
              <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-cyan-600 flex items-center gap-1 group/link"
          >
            <span className="truncate">@{name}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </a>
          {/* 粉丝数 */}
          {followers && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <Users className="h-3 w-3" />
              <span>{formatFollowers(followers)} 粉丝</span>
            </div>
          )}
        </div>
      </div>

      {/* 删除按钮 */}
      {!showConfirm ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfirm(true)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
          disabled={isDeleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white border border-red-200 rounded-md p-1 shadow-lg z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfirm(false)}
            className="text-xs px-2 py-1 h-auto text-gray-600 hover:bg-gray-100"
          >
            取消
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs px-2 py-1 h-auto text-red-600 hover:bg-red-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                删除中
              </>
            ) : (
              '确认'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
