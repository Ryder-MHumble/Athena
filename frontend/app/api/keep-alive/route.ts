/**
 * Keep-Alive API Route
 * 定时调用后端健康检查，防止Render免费版休眠
 */

import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
    })
    
    if (response.ok) {
      return NextResponse.json({ status: 'ok', backend: 'healthy' })
    } else {
      return NextResponse.json({ status: 'ok', backend: 'unhealthy' }, { status: 200 })
    }
  } catch (error) {
    return NextResponse.json({ status: 'ok', backend: 'error' }, { status: 200 })
  }
}

