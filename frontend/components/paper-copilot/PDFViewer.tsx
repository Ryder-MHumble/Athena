import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, ZoomIn, ZoomOut, Maximize2, Loader2 } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

export interface PDFViewerProps {
  pdfUrl: string | null
  width: string
  onPageChange?: (page: number, totalPages: number) => void
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, width, onPageChange }) => {
  const [pageNumber, setPageNumber] = useState(1)
  const [numPages, setNumPages] = useState<number>(0)
  const [zoomScale, setZoomScale] = useState(1.2)  // 初始缩放比例改为 1.2

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
    onPageChange?.(1, numPages)
  }

  const handlePageChange = (newPage: number) => {
    setPageNumber(newPage)
    onPageChange?.(newPage, numPages)
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">PDF 预览不可用（URL 模式）</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col h-full">
      {/* 页面控制 - 固定在顶部 */}
      <div className="sticky top-0 bg-white z-10 pb-4 mb-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
          >
            上一页
          </Button>
          <span className="text-sm text-gray-600 px-3">
            第 {pageNumber} 页 / 共 {numPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages}
          >
            下一页
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoomScale((z) => Math.min(2, z + 0.1))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoomScale((z) => Math.max(0.6, z - 0.1))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoomScale(1)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <span className="text-gray-500">单击页面左右侧可翻页</span>
        </div>
      </div>

      {/* PDF 内容容器 */}
      <div
        className="flex-1 overflow-y-auto flex justify-center bg-gray-100 rounded-lg relative"
        onWheel={(e) => {
          e.stopPropagation()
        }}
      >
        {/* 左右点击区域翻页 */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/6 cursor-pointer z-10"
          onClick={() => handlePageChange(Math.max(1, pageNumber - 1))}
          aria-label="上一页"
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1/6 cursor-pointer z-10"
          onClick={() => handlePageChange(Math.min(numPages, pageNumber + 1))}
          aria-label="下一页"
        />
        <div className="flex items-center justify-center p-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={handleDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            }
          >
            {typeof window !== 'undefined' && (
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-2xl rounded-lg"
                scale={zoomScale}
                width={Math.max(300, Math.min(800, parseFloat(width) - 80))}
              />
            )}
          </Document>
        </div>
      </div>
    </div>
  )
}
