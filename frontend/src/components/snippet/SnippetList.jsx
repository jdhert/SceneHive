import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import CodeBlock from './CodeBlock'

function SnippetList({ snippets, onEdit, onDelete, onView, currentUserId }) {
  if (snippets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">📝</p>
        <p className="text-white/60 text-lg">아직 스니펫이 없습니다</p>
        <p className="text-white/40 text-sm mt-2">새로운 코드 스니펫을 작성해보세요!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {snippets.map((snippet) => (
        <Card
          key={snippet.id}
          className="border-0 bg-white/10 backdrop-blur-lg overflow-hidden"
        >
          <CardContent className="p-0">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{snippet.title}</h3>
                  {snippet.description && (
                    <p className="text-white/50 text-sm mt-1 line-clamp-2">
                      {snippet.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                    <span className="px-2 py-0.5 bg-white/10 rounded">
                      {snippet.language}
                    </span>
                    <span>by {snippet.author?.name}</span>
                    <span>{formatDate(snippet.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onView(snippet)}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    보기
                  </Button>
                  {snippet.author?.id === currentUserId && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(snippet)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(snippet.id)}
                        className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
                      >
                        삭제
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="max-h-64 overflow-hidden">
              <CodeBlock code={snippet.code} language={snippet.language} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return date.toLocaleDateString('ko-KR')
}

export default SnippetList
