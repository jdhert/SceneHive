import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from '@/components/ui/button'

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="relative group rounded-lg overflow-hidden">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleCopy}
          className="h-8 px-3 bg-gray-700 hover:bg-gray-600 text-white text-xs"
        >
          {copied ? '복사됨!' : '복사'}
        </Button>
      </div>
      <div className="absolute top-2 left-3 z-10">
        <span className="text-xs text-gray-400 font-mono uppercase">{language}</span>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '2.5rem 1rem 1rem 1rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export default CodeBlock
