import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { workspaceService } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ChatContainer from '../components/chat/ChatContainer'
import { SnippetContainer } from '../components/snippet'
import { MemoContainer } from '../components/memo'
import UserMenu from '../components/layout/UserMenu'
import NotificationBell from '../components/notification/NotificationBell'
import Avatar from '../components/user/Avatar'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { WS_URL } from '../lib/ws'
import { useUser } from '../contexts/UserContext'
import { useAccessToken } from '../hooks/useAccessToken'

function WorkspacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const token = useAccessToken()
  const [workspace, setWorkspace] = useState(null)
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('chat')
  const [showInviteCode, setShowInviteCode] = useState(false)

  useEffect(() => {
    fetchWorkspaceData()
  }, [id])

  const fetchMembers = useCallback(async () => {
    if (!id) return
    try {
      const membersRes = await workspaceService.getMembers(id)
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : [])
    } catch (err) {
      console.error('Failed to fetch members:', err)
    }
  }, [id])

  useEffect(() => {
    if (!id || !user?.status) return
    fetchMembers()
  }, [id, user?.status, fetchMembers])

  const fetchWorkspaceData = async () => {
    try {
      setIsLoading(true)
      const [workspaceRes, membersRes] = await Promise.all([
        workspaceService.getById(id),
        workspaceService.getMembers(id),
      ])
      setWorkspace(workspaceRes.data)
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : [])
    } catch (err) {
      setError('?뚰겕?ㅽ럹?댁뒪瑜?遺덈윭?ㅻ뒗???ㅽ뙣?덉뒿?덈떎.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!token || !id) return

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/workspace/${id}/members`, () => {
          fetchMembers()
        })
      },
    })

    client.activate()

    return () => {
      if (client.active) {
        client.deactivate()
      }
    }
  }, [id, fetchMembers, token])

  const handleCopyInviteCode = () => {
    if (workspace?.inviteCode) {
      navigator.clipboard.writeText(workspace.inviteCode)
      alert('초대 코드媛 복사?섏뿀?듬땲??')
    }
  }

  const handleRegenerateInvite = async () => {
    try {
      const response = await workspaceService.regenerateInvite(id)
      setWorkspace({ ...workspace, inviteCode: response.data.inviteCode })
      alert('?덈줈??초대 코드媛 ?앹꽦?섏뿀?듬땲??')
    } catch (err) {
      setError('초대 코드 생성에 실패했습니다.')
    }
  }

  const isOwner = workspace?.owner?.id && user?.id && workspace.owner.id === user.id

  const handleLeaveWorkspace = async () => {
    if (!workspace) return
    const confirmMessage = isOwner
      ? '?뚰겕?ㅽ럹?댁뒪瑜???젣?섏떆寃좎뒿?덇퉴? ???묒뾽? ?섎룎由????놁뒿?덈떎.'
      : '?뚰겕?ㅽ럹?댁뒪?먯꽌 ?섍??쒓쿋?듬땲源?'
    if (!window.confirm(confirmMessage)) return

    try {
      if (isOwner) {
        await workspaceService.delete(id)
      } else {
        await workspaceService.leave(id)
      }
      navigate('/workspaces')
    } catch (err) {
      setError(err.response?.data?.message || '요청을 처리하지 못했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <Card className="border-0 bg-white/20 backdrop-blur-lg">
          <CardContent className="p-8 text-center">
            <p className="text-red-200 text-lg">{error}</p>
            <Button
              onClick={() => navigate('/workspaces')}
              className="mt-4 bg-white/20 hover:bg-white/30 text-white"
            >
              ?뚰겕?ㅽ럹?댁뒪 紐⑸줉?쇰줈
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const membersList = Array.isArray(members) ? members : []

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      {/* Header */}
      <header
        className="border-b border-white/20 px-6 py-4 relative z-50"
        style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-lg">DC</span>
              </div>
              <span className="text-lg font-bold text-white hidden md:inline">DevCollab</span>
            </button>
            <span className="text-white/30">|</span>
            <Button
              variant="ghost"
              onClick={() => navigate('/workspaces')}
              className="text-white hover:bg-white/20"
            >
              목록
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">{workspace?.name}</h1>
              <p className="text-sm text-white/60">{workspace?.description || '설명 없음'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowInviteCode(!showInviteCode)}
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              초대하기
            </Button>
            <Button
              variant="outline"
              onClick={handleLeaveWorkspace}
              className="border-red-400/30 text-red-200 hover:bg-red-400/10"
            >
              {isOwner ? '워크스페이스 삭제' : '나가기'}
            </Button>
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Invite Code Popup */}
      {showInviteCode && (
        <div className="fixed top-20 right-6 z-50">
          <Card className="border-0 w-80" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">초대 코드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                {workspace?.inviteCode}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCopyInviteCode} className="flex-1">
                  복사
                </Button>
                <Button size="sm" variant="outline" onClick={handleRegenerateInvite}>
                  재생성                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowInviteCode(false)}
                className="w-full"
              >
                ?リ린
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)] relative z-0">
        {/* Sidebar */}
        <aside
          className="w-64 border-r border-white/20 p-4"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          {/* Tabs */}
          <nav className="space-y-1 mb-6">
            {['chat', 'snippets', 'memos'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab === 'chat' && '채팅'}
                {tab === 'snippets' && '코드 스니펫'}
                {tab === 'memos' && '메모'}
              </button>
            ))}
          </nav>

          {/* Members */}
          <div>
            <h3 className="text-sm font-medium text-white/50 mb-3 px-2">
              멤버 ({membersList.length})
            </h3>
            <div className="space-y-1">
              {membersList.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-white/80"
                >
                  <Avatar user={member.user} size="sm" showStatus />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{member.user?.name}</p>
                    <p className="text-xs text-white/40">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <div
              className="h-full"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <ChatContainer workspaceId={id} members={members} />
            </div>
          )}
          {activeTab === 'snippets' && (
            <div
              className="h-full"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <SnippetContainer workspaceId={id} />
            </div>
          )}
          {activeTab === 'memos' && (
            <div
              className="h-full"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <MemoContainer workspaceId={id} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default WorkspacePage



