import React, { useState, useEffect } from 'react'
import { snippetService } from '../../services/api'
import { Button } from '@/components/ui/button'
import SnippetList from './SnippetList'
import SnippetEditor from './SnippetEditor'
import SnippetViewer from './SnippetViewer'

function SnippetContainer({ workspaceId }) {
  const [snippets, setSnippets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState('list') // 'list' | 'create' | 'edit' | 'view'
  const [selectedSnippet, setSelectedSnippet] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    fetchSnippets()
    fetchCurrentUser()
  }, [workspaceId])

  const fetchSnippets = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await snippetService.getAll(workspaceId)
      setSnippets(response.data)
    } catch (err) {
      setError('스니펫을 불러오는데 실패했습니다.')
      console.error('Failed to fetch snippets:', err)
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
      await snippetService.create(workspaceId, data)
      await fetchSnippets()
      setView('list')
    } catch (err) {
      setError('스니펫 생성에 실패했습니다.')
      console.error('Failed to create snippet:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (data) => {
    try {
      setIsSaving(true)
      await snippetService.update(workspaceId, selectedSnippet.id, data)
      await fetchSnippets()
      setView('list')
      setSelectedSnippet(null)
    } catch (err) {
      setError('스니펫 수정에 실패했습니다.')
      console.error('Failed to update snippet:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (snippetId) => {
    if (!window.confirm('스니펫을 삭제하시겠습니까?')) return
    try {
      await snippetService.delete(workspaceId, snippetId)
      await fetchSnippets()
      if (view === 'view') {
        setView('list')
        setSelectedSnippet(null)
      }
    } catch (err) {
      setError('스니펫 삭제에 실패했습니다.')
      console.error('Failed to delete snippet:', err)
    }
  }

  const handleEdit = (snippet) => {
    setSelectedSnippet(snippet)
    setView('edit')
  }

  const handleView = (snippet) => {
    setSelectedSnippet(snippet)
    setView('view')
  }

  const handleCancel = () => {
    setView('list')
    setSelectedSnippet(null)
    setError('')
  }

  if (isLoading) {
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          코드 스니펫
          {view === 'list' && snippets.length > 0 && (
            <span className="ml-2 text-sm text-white/50">({snippets.length})</span>
          )}
        </h2>
        {view === 'list' && (
          <Button
            onClick={() => setView('create')}
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            + 새 스니펫
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'list' && (
          <SnippetList
            snippets={snippets}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            currentUserId={currentUserId}
          />
        )}
        {view === 'create' && (
          <SnippetEditor
            onSave={handleCreate}
            onCancel={handleCancel}
            isLoading={isSaving}
          />
        )}
        {view === 'edit' && selectedSnippet && (
          <SnippetEditor
            snippet={selectedSnippet}
            onSave={handleUpdate}
            onCancel={handleCancel}
            isLoading={isSaving}
          />
        )}
        {view === 'view' && selectedSnippet && (
          <SnippetViewer
            snippet={selectedSnippet}
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

export default SnippetContainer
