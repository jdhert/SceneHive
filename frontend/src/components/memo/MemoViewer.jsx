import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MarkdownPreview from './MarkdownPreview'

function MemoViewer({ memo, onEdit, onDelete, onClose, currentUserId }) {
  const isAuthor = memo.author?.id === currentUserId

  return (
    <Card className="border-0 bg-white/10 backdrop-blur-lg h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-white text-xl">{memo.title}</CardTitle>
            <div className="flex items-center gap-3 mt-2 text-sm text-white/50">
              <span>by {memo.author?.name}</span>
              <span>{formatDateTime(memo.updatedAt)}</span>
              {memo.createdAt !== memo.updatedAt && (
                <span className="text-white/30">(수정됨)</span>
              )}
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
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
          {memo.content ? (
            <MarkdownPreview content={memo.content} />
          ) : (
            <p className="text-white/40 text-sm">내용이 없습니다.</p>
          )}
        </div>

        {isAuthor && (
          <div className="flex gap-3 flex-shrink-0">
            <Button
              onClick={() => onEdit(memo)}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white"
            >
              수정
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm('메모를 삭제하시겠습니까?')) {
                  onDelete(memo.id)
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

export default MemoViewer
