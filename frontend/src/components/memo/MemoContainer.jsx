import React, { useState, useEffect } from 'react'
import { memoService } from '../../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import MemoList from './MemoList'
import MemoEditor from './MemoEditor'
import MemoViewer from './MemoViewer'

function MemoContainer({ workspaceId }) {
  const [memos, setMemos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState('list') // 'list' | 'create' | 'edit' | 'view'
  const [selectedMemo, setSelectedMemo] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    fetchMemos()
    fetchCurrentUser()
  }, [workspaceId])

  const fetchMemos = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await memoService.getAll(workspaceId)
      setMemos(response.data)
    } catch (err) {
      setError('메모를 불러오는데 실패했습니다.')
      console.error('Failed to fetch memos:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const userInfo = localStorage.getItem('user')
      if (userInfo) {
        const user = JSON.parse(userInfo)
        setCurrentUserId(user.id)
      }
    } catch (err) {
      console.error('Failed to get current user:', err)
    }
  }

  const handleCreate = async (data) => {
    try {
      setIsSaving(true)
      await memoService.create(workspaceId, data)
      await fetchMemos()
      setView('list')
    } catch (err) {
      setError('메모 생성에 실패했습니다.')
      console.error('Failed to create memo:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (data) => {
    try {
      setIsSaving(true)
      await memoService.update(workspaceId, selectedMemo.id, data)
      await fetchMemos()
      setView('list')
      setSelectedMemo(null)
    } catch (err) {
      setError('메모 수정에 실패했습니다.')
      console.error('Failed to update memo:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAutoSave = async (data) => {
    if (!selectedMemo) return
    try {
      await memoService.update(workspaceId, selectedMemo.id, data)
      // 백그라운드 저장이므로 목록 새로고침 없음
    } catch (err) {
      console.error('Failed to auto-save memo:', err)
    }
  }

  const handleDelete = async (memoId) => {
    if (!window.confirm('메모를 삭제하시겠습니까?')) return
    try {
      await memoService.delete(workspaceId, memoId)
      await fetchMemos()
      if (view === 'view') {
        setView('list')
        setSelectedMemo(null)
      }
    } catch (err) {
      setError('메모 삭제에 실패했습니다.')
      console.error('Failed to delete memo:', err)
    }
  }

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      fetchMemos()
      return
    }
    try {
      setIsLoading(true)
      const response = await memoService.search(workspaceId, searchKeyword)
      setMemos(response.data)
    } catch (err) {
      setError('검색에 실패했습니다.')
      console.error('Failed to search memos:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (memo) => {
    setSelectedMemo(memo)
    setView('edit')
  }

  const handleView = (memo) => {
    setSelectedMemo(memo)
    setView('view')
  }

  const handleCancel = () => {
    setView('list')
    setSelectedMemo(null)
    setError('')
  }

  if (isLoading && view === 'list') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-white/60">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-white">
          마크다운 메모
          {view === 'list' && memos.length > 0 && (
            <span className="ml-2 text-sm text-white/50">({memos.length})</span>
          )}
        </h2>
        {view === 'list' && (
          <Button
            onClick={() => setView('create')}
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            + 새 메모
          </Button>
        )}
      </div>

      {/* Search (only in list view) */}
      {view === 'list' && (
        <div className="flex gap-2 mb-4 flex-shrink-0">
          <Input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="메모 검색..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
          <Button
            onClick={handleSearch}
            variant="secondary"
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            검색
          </Button>
          {searchKeyword && (
            <Button
              onClick={() => {
                setSearchKeyword('')
                fetchMemos()
              }}
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              초기화
            </Button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm flex-shrink-0">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'list' && (
          <div className="h-full overflow-y-auto">
            <MemoList
              memos={memos}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              currentUserId={currentUserId}
            />
          </div>
        )}
        {view === 'create' && (
          <MemoEditor
            onSave={handleCreate}
            onCancel={handleCancel}
            isLoading={isSaving}
          />
        )}
        {view === 'edit' && selectedMemo && (
          <MemoEditor
            memo={selectedMemo}
            onSave={handleUpdate}
            onCancel={handleCancel}
            isLoading={isSaving}
            onAutoSave={handleAutoSave}
          />
        )}
        {view === 'view' && selectedMemo && (
          <MemoViewer
            memo={selectedMemo}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClose={handleCancel}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  )
}

export default MemoContainer
