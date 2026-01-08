'use client'

/**
 * 设置页面
 * 配置 API Key、团队密钥、MCP Server 地址等
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useAppStore } from '@/stores/useAppStore'
import { Save, Eye, EyeOff, Settings } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { apiKey, teamKey, mcpServerUrl, setApiKey, setTeamKey, setMcpServerUrl } = useAppStore()
  const [localApiKey, setLocalApiKey] = useState('')
  const [localTeamKey, setLocalTeamKey] = useState('')
  const [localMcpServerUrl, setLocalMcpServerUrl] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [showTeamKey, setShowTeamKey] = useState(false)

  // 从 store 加载初始值
  useEffect(() => {
    setLocalApiKey(apiKey)
    setLocalTeamKey(teamKey)
    setLocalMcpServerUrl(mcpServerUrl || '')
  }, [apiKey, teamKey, mcpServerUrl])

  // 保存设置
  const handleSave = () => {
    setApiKey(localApiKey.trim())
    setTeamKey(localTeamKey.trim())
    setMcpServerUrl(localMcpServerUrl.trim() || null)
    toast.success('设置已保存')
  }

  // 检查是否有未保存的更改
  const hasChanges =
    localApiKey !== apiKey ||
    localTeamKey !== teamKey ||
    localMcpServerUrl !== (mcpServerUrl || '')

  return (
    <div className="space-y-6 max-w-2xl pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-slate-500 to-gray-500 shadow-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
      <div>
            <h1 className="text-4xl font-serif font-bold gradient-text-primary">设置</h1>
            <p className="text-muted-foreground mt-1">
              配置 API Key 和团队访问密钥（可选，已从环境变量读取默认值）
        </p>
          </div>
        </div>
      </div>
      
      {/* API Key 配置 */}
      <Card className="glass border-0 shadow-xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">SiliconFlow API Key</h2>
          <p className="text-sm text-muted-foreground mb-4">
            用于调用 AI 模型服务。请从{' '}
            <a
              href="https://siliconflow.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              SiliconFlow
            </a>{' '}
            获取你的 API Key。
          </p>
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                type={showApiKey ? 'text' : 'password'}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 团队密钥配置 */}
      <Card className="glass border-0 shadow-xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">团队访问密钥</h2>
          <p className="text-sm text-muted-foreground mb-4">
            用于上传文档到团队知识库。请与团队管理员获取此密钥。
          </p>
          <div className="space-y-2">
            <Label htmlFor="team-key">团队密钥</Label>
            <div className="flex gap-2">
              <Input
                id="team-key"
                type={showTeamKey ? 'text' : 'password'}
                value={localTeamKey}
                onChange={(e) => setLocalTeamKey(e.target.value)}
                placeholder="输入团队访问密钥"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowTeamKey(!showTeamKey)}
              >
                {showTeamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* MCP Server URL 配置（可选） */}
      <Card className="glass border-0 shadow-xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">MCP Server URL (可选)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            用于连接外部 MCP 服务器，扩展功能。留空则使用默认配置。
          </p>
          <div className="space-y-2">
            <Label htmlFor="mcp-url">MCP Server URL</Label>
            <Input
              id="mcp-url"
              type="url"
              value={localMcpServerUrl}
              onChange={(e) => setLocalMcpServerUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1"
            />
          </div>
        </div>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges} 
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
        >
          <Save className="h-4 w-4 mr-2" />
          保存设置
        </Button>
      </div>

      {/* 提示信息 */}
      <Card className="glass border-0 shadow-xl p-4 bg-purple-50/50">
        <p className="text-sm text-muted-foreground">
          <strong>提示：</strong>
          <br />
          • 所有设置都会保存在本地浏览器中，不会上传到服务器
          <br />
          • API Key 用于调用 AI 服务，请妥善保管
          <br />
          • 团队密钥用于访问团队知识库，请勿泄露
        </p>
      </Card>
    </div>
  )
}
