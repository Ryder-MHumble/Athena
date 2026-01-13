import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Upload, X, Loader2, Link as LinkIcon, CheckCircle2, Zap } from 'lucide-react'

export interface UploadAreaProps {
  file: File | null
  url: string
  isLoading: boolean
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileRemove: () => void
  onUrlChange: (url: string) => void
  onAnalyze: () => void
  fileInputRef: React.RefObject<HTMLInputElement>
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  file,
  url,
  isLoading,
  onFileSelect,
  onFileRemove,
  onUrlChange,
  onAnalyze,
  fileInputRef,
}) => {
  const hasInput = file || url.trim()

  return (
    <div className="w-full flex-shrink-0">
      <div className="p-8 sm:p-12 bg-gradient-to-br from-white via-cyan-50/30 to-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* 标题区 - 现代化设计 */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-3xl blur-xl opacity-30" />
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500 to-teal-600 border border-cyan-300/50">
                  <FileText className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">开始论文分析</h2>
              <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                上传 PDF 或粘贴 Arxiv URL，AI 将为您进行深度分析、生成摘要和实时讲解
              </p>
            </div>
          </div>

          {/* 两种上传方式 - 卡片布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：文件上传 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-100">
                  <Upload className="h-5 w-5 text-cyan-600" />
                </div>
                <h3 className="font-semibold text-gray-900">上传 PDF 文件</h3>
              </div>
              
              <Input
                type="file"
                accept=".pdf"
                onChange={onFileSelect}
                ref={fileInputRef}
                className="hidden"
              />

              {!file ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 hover:border-cyan-400 p-8 sm:p-10 transition-all hover:bg-cyan-50/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                  
                  <div className="relative flex flex-col items-center justify-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 group-hover:bg-cyan-100 transition-colors">
                      <FileText className="h-8 w-8 text-gray-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">点击上传或拖放文件</p>
                      <p className="text-sm text-gray-600 mt-1">支持 PDF 格式，单个文件最大 50MB</p>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="relative rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 pt-1">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">已选择文件</p>
                      <p className="text-sm text-gray-600 mt-1 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        大小：{(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                      onClick={onFileRemove}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧：URL 输入 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100">
                  <LinkIcon className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">粘贴 Arxiv URL</h3>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="粘贴 Arxiv URL..."
                  value={url}
                  onChange={(e) => onUrlChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && url.trim() && !file) {
                      e.preventDefault()
                      onAnalyze()
                    }
                  }}
                  disabled={isLoading || !!file}
                  className="border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg text-sm placeholder:text-gray-400 disabled:opacity-50"
                />
                
                {url && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium text-gray-700 mb-1">✓ URL 已识别</p>
                    <p className="line-clamp-2">{url}</p>
                  </div>
                )}

                <div className="text-xs text-gray-600 space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-900">示例 URL：</p>
                  <p className="font-mono text-blue-800 break-all">https://arxiv.org/abs/2501.12345</p>
                </div>
              </div>
            </div>
          </div>

          {/* 分析按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {hasInput && (
              <Button
                onClick={onAnalyze}
                disabled={isLoading}
                className="sm:min-w-[200px] bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 hover:from-cyan-600 hover:via-teal-600 hover:to-cyan-700 text-white font-semibold text-lg py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    AI 分析中...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    开始智能分析
                  </>
                )}
              </Button>
            )}
          </div>

          {/* 功能特点 - 三列网格 */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            {[
              { icon: '📄', label: 'PDF 上传', desc: '支持本地上传' },
              { icon: '🔗', label: '链接导入', desc: 'Arxiv 支持' },
              { icon: '⚡', label: '快速分析', desc: '秒级生成' },
            ].map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl mb-2">{feature.icon}</div>
                <p className="font-medium text-sm text-gray-900">{feature.label}</p>
                <p className="text-xs text-gray-600 mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
