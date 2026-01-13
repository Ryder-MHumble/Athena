import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export interface SpeechTabProps {
  speech: string
}

export const SpeechTab: React.FC<SpeechTabProps> = ({ speech }) => {
  return (
    <div
      className="prose prose-sm max-w-none
        prose-p:text-gray-800 prose-p:leading-relaxed prose-p:m-0
        prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
        prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
        prose-strong:text-gray-900 prose-strong:font-semibold
        prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-xs prose-code:font-mono
        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-3 prose-pre:rounded-lg
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
        prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2
        prose-li:text-gray-800 prose-li:text-sm prose-li:my-1
        prose-blockquote:border-l-4 prose-blockquote:border-purple-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700"
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
      >
        {speech}
      </ReactMarkdown>
    </div>
  )
}
