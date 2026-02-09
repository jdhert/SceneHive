import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MarkdownPreview from './MarkdownPreview'

function MemoEditor({ memo, onSave, onCancel, isLoading, onAutoSave }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState({})
  const [lastSaved, setLastSaved] = useState(null)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (memo) {
      setTitle(memo.title || '')
      setContent(memo.content || '')
    }
  }, [memo])

  // Autosave with debounce
  useEffect(() => {
    if (!memo || !isDirty || !onAutoSave) return

    const timer = setTimeout(() => {
      if (title.trim()) {
        onAutoSave({ title, content })
        setLastSaved(new Date())
        setIsDirty(false)
      }
    }, 2000) // 2초 디바운스

    return () => clearTimeout(timer)
  }, [title, content, isDirty, memo, onAutoSave])

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    setIsDirty(true)
  }

  const handleContentChange = (e) => {
    setContent(e.target.value)
    setIsDirty(true)
  }

  const validate = () => {
    const newErrors = {}
    if (!title.trim()) newErrors.title = '제목을 입력하세요'
    if (title.length > 200) newErrors.title = '제목은 200자 이하여야 합니다'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({ title, content })
  }

  const formatLastSaved = () => {
    if (!lastSaved) return null
    return `마지막 저장: ${lastSaved.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`
  }

  return (
    <Card className="border-0 bg-white/10 backdrop-blur-lg h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">
            {memo ? '메모 수정' : '새 메모 작성'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-white/40">{formatLastSaved()}</span>
            )}
            {isDirty && (
              <span className="text-xs text-yellow-400">저장 중...</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
          <div className="space-y-2 flex-shrink-0">
            <Label htmlFor="title" className="text-white/80">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="메모 제목"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            {errors.title && <p className="text-red-400 text-sm">{errors.title}</p>}
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <Label htmlFor="content" className="text-white/80">내용 (Markdown 지원)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                  className={`text-xs ${!showPreview ? 'text-white bg-white/20' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                  편집
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                  className={`text-xs ${showPreview ? 'text-white bg-white/20' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                  미리보기
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              {showPreview ? (
                <div className="h-full overflow-y-auto p-4 bg-white/5 rounded-lg border border-white/10">
                  {content ? (
                    <MarkdownPreview content={content} />
                  ) : (
                    <p className="text-white/40 text-sm">내용을 입력하면 미리보기가 표시됩니다.</p>
                  )}
                </div>
              ) : (
                <textarea
                  id="content"
                  value={content}
                  onChange={handleContentChange}
                  placeholder="마크다운으로 메모를 작성하세요...

# 제목
## 소제목

- 목록 항목
- 또 다른 항목

**굵게**, *기울임*, `코드`

```
코드 블록
```"
                  className="w-full h-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 font-mono text-sm resize-none"
                />
              )}
            </div>
          </div>

          <div className="flex gap-3 flex-shrink-0">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white"
            >
              {isLoading ? '저장 중...' : (memo ? '수정 완료' : '저장')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default MemoEditor
