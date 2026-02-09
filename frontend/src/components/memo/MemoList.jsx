import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function MemoList({ memos, onEdit, onDelete, onView, currentUserId }) {
  if (memos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">📄</p>
        <p className="text-white/60 text-lg">아직 메모가 없습니다</p>
        <p className="text-white/40 text-sm mt-2">새로운 메모를 작성해보세요!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {memos.map((memo) => (
        <Card
          key={memo.id}
          className="border-0 bg-white/10 backdrop-blur-lg hover:bg-white/15 transition-colors cursor-pointer"
          onClick={() => onView(memo)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-white font-medium truncate flex-1">
                {memo.title}
              </h3>
              {memo.author?.id === currentUserId && (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(memo)}
                    className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    ✏️
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(memo.id)}
                    className="h-7 w-7 p-0 text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
                  >
                    🗑️
                  </Button>
                </div>
              )}
            </div>

            <p className="text-white/50 text-sm line-clamp-3 mb-3">
              {memo.content ? stripMarkdown(memo.content) : '내용 없음'}
            </p>

            <div className="flex items-center justify-between text-xs text-white/40">
              <span>by {memo.author?.name}</span>
              <span>{formatDate(memo.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function stripMarkdown(text) {
  return text
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/`([^`]+)`/g, '$1') // Code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Images
    .replace(/[-*+]\s/g, '') // List items
    .replace(/\n/g, ' ') // Newlines
    .trim()
    .substring(0, 200)
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

export default MemoList
