import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function MarkdownPreview({ content }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-white border-b border-white/20 pb-2 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-1 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-white mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-white/80 mb-3 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-white/80 mb-3 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-white/80 mb-3 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-white/80">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {children}
            </a>
          ),
          code: ({ inline, children }) =>
            inline ? (
              <code className="px-1.5 py-0.5 bg-white/10 rounded text-pink-300 text-sm font-mono">
                {children}
              </code>
            ) : (
              <code className="block p-3 bg-black/30 rounded-lg text-green-300 text-sm font-mono overflow-x-auto">
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-white/30 pl-4 text-white/60 italic mb-3">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse border border-white/20">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/10">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-white/20 px-3 py-2 text-left text-white font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-white/20 px-3 py-2 text-white/80">
              {children}
            </td>
          ),
          hr: () => <hr className="border-white/20 my-4" />,
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg my-3"
            />
          ),
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownPreview
