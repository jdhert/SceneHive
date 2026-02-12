import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { workspaceService } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import UserMenu from '../components/layout/UserMenu'
import NotificationBell from '../components/notification/NotificationBell'

function WorkspacesPage() {
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Create workspace modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [isCreating, setIsCreating] = useState(false)

  // Join workspace modal state
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true)
      const response = await workspaceService.getAll()
      setWorkspaces(response.data)
    } catch (err) {
      setError('워크스페이스 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWorkspace = async (e) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      const response = await workspaceService.create(createForm)
      setWorkspaces([...workspaces, response.data])
      setShowCreateModal(false)
      setCreateForm({ name: '', description: '' })
    } catch (err) {
      setError(err.response?.data?.message || '워크스페이스 생성에 실패했습니다.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinWorkspace = async (e) => {
    e.preventDefault()
    setIsJoining(true)
    try {
      const response = await workspaceService.join(inviteCode)
      setWorkspaces([...workspaces, response.data])
      setShowJoinModal(false)
      setInviteCode('')
    } catch (err) {
      setError(err.response?.data?.message || '워크스페이스 참여에 실패했습니다.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Top Navigation */}
      <header
        className="border-b border-white/10"
        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-lg">💻</span>
            </div>
            <span className="text-lg font-bold text-white">DevCollab</span>
          </button>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Workspaces</h1>
            <p className="text-white/70 mt-1">협업 공간을 선택하거나 새로 만드세요</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowJoinModal(true)}
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              초대 코드로 참여
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-900 hover:bg-indigo-800 text-white"
            >
              + 새 워크스페이스
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 text-red-100">
            {error}
            <button onClick={() => setError('')} className="ml-4 underline">닫기</button>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="text-center text-white py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">로딩 중...</p>
          </div>
        ) : workspaces.length === 0 ? (
          /* Empty state */
          <Card
            className="border-0 text-center py-12"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <CardContent>
              <p className="text-white/70 text-lg">아직 참여 중인 워크스페이스가 없습니다.</p>
              <p className="text-white/50 mt-2">새 워크스페이스를 만들거나 초대 코드로 참여하세요.</p>
            </CardContent>
          </Card>
        ) : (
          /* Workspace grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <Card
                key={workspace.id}
                className="border-0 cursor-pointer transition-all hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(20px)',
                }}
                onClick={() => navigate(`/workspaces/${workspace.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-white">{workspace.name}</CardTitle>
                  <CardDescription className="text-white/60">
                    {workspace.description || '설명 없음'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-white/50">
                    <span>멤버 {workspace.memberCount}명</span>
                    <span>소유자: {workspace.owner?.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card
            className="w-full max-w-md border-0"
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(40px)',
            }}
          >
            <CardHeader>
              <CardTitle className="text-white">새 워크스페이스 만들기</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">이름</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="워크스페이스 이름"
                    className="border-white/40 bg-white/10 text-white placeholder:text-white/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">설명 (선택)</Label>
                  <Input
                    id="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="워크스페이스 설명"
                    className="border-white/40 bg-white/10 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 border-white/30 bg-white/10 text-white hover:bg-white/20"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 bg-indigo-900 hover:bg-indigo-800 text-white"
                  >
                    {isCreating ? '생성 중...' : '만들기'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Join Workspace Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card
            className="w-full max-w-md border-0"
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(40px)',
            }}
          >
            <CardHeader>
              <CardTitle className="text-white">워크스페이스 참여</CardTitle>
              <CardDescription className="text-white/60">
                초대 코드를 입력하여 워크스페이스에 참여하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinWorkspace} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode" className="text-white">초대 코드</Label>
                  <Input
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="초대 코드 입력"
                    className="border-white/40 bg-white/10 text-white placeholder:text-white/50"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 border-white/30 bg-white/10 text-white hover:bg-white/20"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={isJoining}
                    className="flex-1 bg-indigo-900 hover:bg-indigo-800 text-white"
                  >
                    {isJoining ? '참여 중...' : '참여하기'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default WorkspacesPage
