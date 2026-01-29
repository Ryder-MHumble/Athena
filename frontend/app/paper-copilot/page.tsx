'use client'

/**
 * 论文伴侣模块 - 模块化版本
 * 页面文件仅负责组装各个组件
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2, RefreshCw, Bookmark, Check } from 'lucide-react'
import { pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/useAppStore'

import {
  UploadArea,
  TabSelector,
  PDFViewer,
  AnalysisResultsTab,
  SpeechTab,
  ChatTab,
} from '@/components/paper-copilot'

import { usePaperAnalysis } from './hooks/usePaperAnalysis'

// 配置 PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function PaperCopilotPage() {
  const {
    file,
    url,
    pdfUrl,
    analysis,
    isLoading,
    activeTab,
    splitPosition,
    chatQuestion,
    chatHistory,
    isChatLoading,
    streamingChatContent,
    speechStreaming,
    hasPaper,
    isSpeechLoading,
    speechLoaded,
    fileInputRef,
    pdfContainerRef,
    setFile,
    setUrl,
    setActiveTab,
    setChatQuestion,
    setIsDraggingSplit,
    handleFileSelect,
    handleAnalyze,
    handleReset,
    handleChatSend,
    normalizeMarkdown,
  } = usePaperAnalysis()

  const { addVocab, vocabList } = useAppStore()
  const [isSaved, setIsSaved] = useState(false)

  // 检查当前论文是否已收藏
  const isAlreadySaved = analysis && vocabList.some(v => 
    v.type === 'paper' && 
    v.paperAnalysis?.oneSentence === analysis.summary?.oneSentence
  )

  // 收藏论文分析结果
  const handleSaveAnalysis = () => {
    if (!analysis || !analysis.summary) {
      toast.error('暂无分析结果可收藏')
      return
    }

    const summary = analysis.summary
    // 使用文件名或 oneSentence 作为标题
    const paperTitle = file?.name?.replace('.pdf', '') || url?.split('/').pop()?.replace('.pdf', '') || summary.oneSentence?.slice(0, 50) || '未命名论文'

    // 生成简短说明作为 explanation
    const explanation = `**核心问题**: ${summary.coreProblem || '未提供'}\n\n**核心直觉**: ${summary.coreIntuition || '未提供'}\n\n**一句话总结**: ${summary.oneSentence || '未提供'}`

    // 添加到 vocabList，类型为 paper
    addVocab(
      paperTitle,
      explanation,
      undefined // context
    )

    // 更新刚添加的条目，设置 type 和 paperAnalysis
    const { vocabList: updatedList, updateVocab } = useAppStore.getState()
    const newItem = updatedList[0] // 刚添加的条目在最前面
    if (newItem) {
      updateVocab(newItem.id, {
        type: 'paper',
        paperAnalysis: {
          title: paperTitle,
          coreProblem: summary.coreProblem,
          previousDilemma: summary.previousDilemma,
          coreIntuition: summary.coreIntuition,
          keySteps: summary.keySteps,
          innovations: summary.innovations,
          boundaries: summary.boundaries,
          oneSentence: summary.oneSentence,
        }
      })
    }

    setIsSaved(true)
    toast.success('已收藏到知识卡片')
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden p-4">
      {/* 上传区域 - 只在没有论文时显示 */}
      {!hasPaper && (
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <UploadArea
            file={file}
            url={url}
            isLoading={isLoading}
            onFileSelect={handleFileSelect}
            onFileRemove={() => {
              setFile(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            onUrlChange={setUrl}
            onAnalyze={handleAnalyze}
            fileInputRef={fileInputRef}
          />
        </div>
      )}

      {/* 分屏显示区域 - 只在有论文时显示，高度固定 */}
      {hasPaper && (
        <div
          id="split-container"
          className="flex-1 flex gap-3 min-h-0"
        >
          {/* 左侧：PDF 查看器 - 独立滚动 */}
          <div
            ref={pdfContainerRef}
            className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
            style={{ width: `${splitPosition}%` }}
          >
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <PDFViewer pdfUrl={pdfUrl} width={`${splitPosition}%`} />
            </div>
          </div>

          {/* 拖拽分隔条 */}
          <div
            className="w-1.5 bg-slate-200 cursor-col-resize hover:bg-cyan-400 transition-all flex-shrink-0 rounded-full"
            onMouseDown={() => setIsDraggingSplit(true)}
          />

          {/* 右侧：AI 分析结果 - 高度固定，内容区域独立滚动 */}
          <div
            className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
            style={{ width: `${100 - splitPosition}%` }}
          >
            {/* 顶部操作栏 - 绝对固定 */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50">
              <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />
              <div className="flex items-center gap-2">
                {analysis && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveAnalysis}
                    disabled={isAlreadySaved || isSaved}
                    className={`text-xs h-8 ${
                      isAlreadySaved || isSaved
                        ? 'border-emerald-300 text-emerald-600 bg-emerald-50'
                        : 'border-cyan-300 text-cyan-600 hover:bg-cyan-50'
                    }`}
                  >
                    {isAlreadySaved || isSaved ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1" />
                        已收藏
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-3.5 w-3.5 mr-1" />
                        收藏分析
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs h-8 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  重新上传
                </Button>
              </div>
            </div>

            {/* 内容区域 - 使用 flex-1 + overflow-hidden 确保不会撑开父容器 */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* 加载状态 */}
              {isLoading && !analysis && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="inline-block p-3 rounded-full bg-cyan-100">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                    </div>
                    <p className="text-gray-600 font-medium">AI 正在分析论文...</p>
                    <p className="text-xs text-gray-500">这可能需要几秒钟</p>
                  </div>
                </div>
              )}

              {/* 空状态 */}
              {!isLoading && !analysis && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="inline-block p-4 rounded-full bg-gray-100">
                      <FileText className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">分析结果将显示在这里</p>
                    <p className="text-xs text-gray-500">上传或选择论文开始分析</p>
                  </div>
                </div>
              )}

              {/* 分析结果 - 独立滚动区域 */}
              {analysis && activeTab === 'analysis' && (
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="p-6">
                    <AnalysisResultsTab analysis={analysis} />
                  </div>
                </div>
              )}

              {/* 讲解 - 独立滚动区域 */}
              {analysis && activeTab === 'speech' && (
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  {isSpeechLoading ? (
                    <div className="flex-1 flex items-center justify-center p-6">
                      <div className="text-center space-y-4">
                        <div className="inline-block p-3 rounded-full bg-cyan-100">
                          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                        </div>
                        <p className="text-gray-600 font-medium">正在生成讲解内容...</p>
                        <p className="text-xs text-gray-500">首次加载需要几秒钟</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <SpeechTab speech={normalizeMarkdown(speechStreaming || analysis.speech)} />
                    </div>
                  )}
                </div>
              )}

              {/* 对话 - 消息列表滚动，输入框固定底部 */}
              {analysis && activeTab === 'chat' && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <ChatTab
                    chatHistory={chatHistory}
                    chatQuestion={chatQuestion}
                    onQuestionChange={setChatQuestion}
                    onSend={handleChatSend}
                    isLoading={isChatLoading}
                    streamingContent={streamingChatContent}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
