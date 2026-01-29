'use client'

/**
 * 后端唤醒组件
 * 在应用加载时自动唤醒Render后端（防止冷启动延迟）
 */

import { useEffect } from 'react'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function BackendWakeup() {
  useEffect(() => {
    // 应用启动时立即调用后端健康检查，唤醒服务
    const wakeupBackend = async () => {
      try {
        await fetch(`${BACKEND_URL}/health`, {
          method: 'GET',
          mode: 'cors',
        })
        console.log('[BackendWakeup] Backend is ready')
      } catch (error) {
        console.log('[BackendWakeup] Backend wakeup request sent')
      }
    }
    
    wakeupBackend()
    
    // 每5分钟发送一次心跳，保持后端活跃
    const interval = setInterval(wakeupBackend, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return null
}

