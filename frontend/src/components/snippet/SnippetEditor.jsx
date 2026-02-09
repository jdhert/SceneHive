import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CodeBlock from './CodeBlock'

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
  'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
  'html', 'css', 'sql', 'bash', 'json', 'yaml', 'markdown'
]

function SnippetEditor({ snippet, onSave, onCancel, isLoading }) {
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [description, setDescription] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (snippet) {
      setTitle(snippet.title || '')
      setCode(snippet.code || '')
      setLanguage(snippet.language || 'javascript')
      setDescription(snippet.description || '')
    }
  }, [snippet])

  const validate = () => {
    const newErrors = {}
    if (!title.trim()) newErrors.title = '제목을 입력하세요'
    if (title.length > 200) newErrors.title = '제목은 200자 이하여야 합니다'
    if (!code.trim()) newErrors.code = '코드를 입력하세요'
    if (!language) newErrors.language = '언어를 선택하세요'
    if (description.length > 500) newErrors.description = '설명은 500자 이하여야 합니다'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({ title, code, language, description })
  }

  return (
    <Card className="border-0 bg-white/10 backdrop-blur-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-white text-lg">
          {snippet ? '스니펫 수정' : '새 스니펫 작성'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white/80">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="스니펫 제목"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            {errors.title && <p className="text-red-400 text-sm">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="language" className="text-white/80">언어</Label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang} className="bg-gray-800">
                  {lang}
                </option>
              ))}
            </select>
            {errors.language && <p className="text-red-400 text-sm">{errors.language}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="code" className="text-white/80">코드</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                {showPreview ? '편집' : '미리보기'}
              </Button>
            </div>
            {showPreview ? (
              <CodeBlock code={code} language={language} />
            ) : (
              <textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="코드를 입력하세요..."
                rows={12}
                className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/40 font-mono text-sm resize-none"
              />
            )}
            {errors.code && <p className="text-red-400 text-sm">{errors.code}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white/80">설명 (선택)</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="스니펫에 대한 설명..."
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm resize-none"
            />
            {errors.description && <p className="text-red-400 text-sm">{errors.description}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white"
            >
              {isLoading ? '저장 중...' : (snippet ? '수정' : '저장')}
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

export default SnippetEditor
