import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Upload, X, Loader2, Link as LinkIcon, CheckCircle2, Zap, Wrench } from 'lucide-react'

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
  const [activeMode, setActiveMode] = useState<'pdf' | 'url'>('pdf')

  return (
    <div className="w-full flex-shrink-0">
      <div className="p-8 sm:p-12 bg-gradient-to-br from-white via-cyan-50/30 to-white rounded-2xl border border-gray-200 shadow-lg transition-all">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* 标题区 */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-2xl blur-2xl opacity-20" />
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-xl">
                  <FileText className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">开始论文分析</h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                上传 PDF 或粘贴 Arxiv URL，AI 将为您进行深度分析、生成摘要和实时讲解
              </p>
            </div>
          </div>

          {/* Tab 切换 */}
          <div className="flex items-center justify-center gap-2 p-1 bg-gray-100 rounded-xl w-fit mx-auto">
            <button
              onClick={() => setActiveMode('pdf')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeMode === 'pdf'
                  ? 'bg-white text-cyan-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="h-4 w-4" />
              上传 PDF 文件
            </button>
            <button
              onClick={() => setActiveMode('url')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeMode === 'url'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LinkIcon className="h-4 w-4" />
              粘贴 Arxiv URL
            </button>
          </div>

          {/* 内容区 */}
          <div className="min-h-[300px]">
            {/* PDF 上传模式 */}
            {activeMode === 'pdf' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
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
                    className="w-full relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 hover:border-cyan-400 p-12 transition-all hover:bg-cyan-50/50 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative flex flex-col items-center justify-center space-y-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-50 group-hover:scale-110 transition-transform">
                        <FileText className="h-10 w-10 text-cyan-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 text-lg mb-1">点击上传或拖放文件</p>
                        <p className="text-sm text-gray-600">支持 PDF 格式，单个文件最大 50MB</p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="relative rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 pt-1">
                        <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 mb-1">✓ 文件已选择</p>
                        <p className="text-sm text-gray-700 truncate">{file.name}</p>
                        <p className="text-xs text-gray-600 mt-2">
                          大小：{(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 h-9 w-9 p-0 hover:bg-red-100 text-red-600 rounded-lg"
                        onClick={onFileRemove}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* 分析按钮 */}
                {file && (
                  <Button
                    onClick={onAnalyze}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-semibold text-base py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        AI 正在分析中...
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
            )}

            {/* URL 输入模式 - 开发中提示 */}
            {activeMode === 'url' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="relative rounded-xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-10">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
                      <Wrench className="h-10 w-10 text-amber-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900 text-lg">🚧 功能开发中</p>
                      <p className="text-sm text-gray-600 max-w-md mx-auto">
                        Arxiv URL 输入功能正在紧锣密鼓地开发中，敬请期待！<br/>
                        目前请使用 <span className="font-semibold text-cyan-600">PDF 上传</span> 功能。
                      </p>
                    </div>
                    <Button
                      onClick={() => setActiveMode('pdf')}
                      variant="outline"
                      className="border-cyan-300 text-cyan-600 hover:bg-cyan-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      切换到 PDF 上传
                    </Button>
                  </div>
                </div>

                {/* 功能预览 */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-700 mb-3">💡 即将支持的功能：</p>
                  <ul className="text-xs text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500">▸</span>
                      <span>直接粘贴 Arxiv 论文链接</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500">▸</span>
                      <span>自动抓取和解析论文 PDF</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500">▸</span>
                      <span>支持更多学术平台链接</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* 功能特点 */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200">
            {[
              { icon: '📄', label: 'PDF 上传', desc: '本地文件分析' },
              { icon: '🤖', label: 'AI 智能', desc: '深度理解论文' },
              { icon: '⚡', label: '秒级响应', desc: '快速生成结果' },
            ].map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl mb-2">{feature.icon}</div>
                <p className="font-medium text-sm text-gray-900">{feature.label}</p>
                <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
