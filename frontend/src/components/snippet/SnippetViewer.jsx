import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CodeBlock from './CodeBlock'

function SnippetViewer({ snippet, onEdit, onDelete, onClose, currentUserId }) {
  const isAuthor = snippet.author?.id === currentUserId

  return (
    <Card className="border-0 bg-white/10 backdrop-blur-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-white text-xl">{snippet.title}</CardTitle>
            <div className="flex items-center gap-3 mt-2 text-sm text-white/50">
              <span className="px-2 py-0.5 bg-white/10 rounded">
                {snippet.language}
              </span>
              <span>by {snippet.author?.name}</span>
              <span>{formatDateTime(snippet.createdAt)}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            닫기
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {snippet.description && (
          <p className="text-white/70 text-sm">{snippet.description}</p>
        )}

        <CodeBlock code={snippet.code} language={snippet.language} />

        {isAuthor && (
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => onEdit(snippet)}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white"
            >
              수정
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm('스니펫을 삭제하시겠습니까?')) {
                  onDelete(snippet.id)
                }
              }}
              className="border-red-400/30 text-red-400 hover:bg-red-400/10"
            >
              삭제
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatDateTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default SnippetViewer
