'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { ExternalLink } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // ─── TABELAS ───
        table: ({ children }) => (
          <div className="chat-table-wrapper my-3 rounded-lg border border-gray-200 dark:border-white/[0.08] shadow-sm">
            <table className="chat-table min-w-full text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-primary/5 dark:bg-white/[0.04]">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="even:bg-gray-50/50 hover:bg-blue-50/50 dark:even:bg-white/[0.02] dark:hover:bg-white/[0.05] transition-colors">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2.5 text-left font-semibold text-primary dark:text-[#7aa6ff] text-xs uppercase tracking-wider border-b border-gray-200 dark:border-white/[0.08] whitespace-nowrap">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-gray-700 dark:text-white/85 border-b border-gray-100 dark:border-white/[0.06]">
            {children}
          </td>
        ),

        // ─── TÍTULOS ───
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2 pb-1 border-b border-gray-200 dark:border-white/[0.08] flex items-center gap-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold text-gray-900 dark:text-white mt-3 mb-2 pb-1 border-b border-gray-200 dark:border-white/[0.08] flex items-center gap-2">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold text-gray-800 dark:text-white/95 mt-3 mb-1.5">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-gray-700 dark:text-white/85 mt-2 mb-1">
            {children}
          </h4>
        ),

        // ─── PARÁGRAFOS ───
        p: ({ children }) => (
          <p className="text-sm text-gray-700 dark:text-white/85 leading-relaxed mb-2 last:mb-0">
            {children}
          </p>
        ),

        // ─── NEGRITO E ITÁLICO ───
        strong: ({ children }) => (
          <strong className="font-semibold text-primary dark:text-[#7aa6ff]">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-600 dark:text-white/70">{children}</em>
        ),
        del: ({ children }) => (
          <del className="line-through text-gray-400 dark:text-white/40">{children}</del>
        ),

        // ─── LISTAS ───
        ul: ({ children }) => (
          <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-white/85 mb-2 space-y-1.5 dark:marker:text-white/40">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 text-sm text-gray-700 dark:text-white/85 mb-2 space-y-1.5 dark:marker:text-white/40">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-gray-700 dark:text-white/85 leading-relaxed [&>ul]:mt-1 [&>ol]:mt-1">
            {children}
          </li>
        ),

        // ─── CITAÇÃO / BLOCKQUOTE ───
        blockquote: ({ children }) => (
          <blockquote className="chat-blockquote my-3 pl-4 py-2 bg-blue-50/50 dark:bg-white/[0.04] rounded-r-lg text-gray-600 dark:text-white/75 italic">
            {children}
          </blockquote>
        ),

        // ─── CÓDIGO ───
        pre: ({ children }) => (
          <pre className="my-3 bg-gray-900 dark:bg-black/50 dark:border dark:border-white/[0.08] text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
            {children}
          </pre>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes('language-')
          if (isBlock) {
            return (
              <code className="text-sm font-mono">{children}</code>
            )
          }
          return (
            <code className="bg-primary/10 text-primary dark:bg-[#1a4fd6]/20 dark:text-[#7aa6ff] px-1.5 py-0.5 rounded text-xs font-mono font-medium">
              {children}
            </code>
          )
        },

        // ─── SEPARADOR ───
        hr: () => (
          <hr className="my-4 border-none h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-white/15" />
        ),

        // ─── LINKS ───
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-hover dark:text-[#7aa6ff] dark:hover:text-[#a8c3ff] hover:underline inline-flex items-center gap-0.5"
          >
            {children}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
