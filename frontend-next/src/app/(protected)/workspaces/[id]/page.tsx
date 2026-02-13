'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { workspaceService } from '@/services/api';
import { useUser } from '@/providers/user-provider';
import { useAccessToken } from '@/hooks/use-access-token';
import { WS_URL } from '@/lib/ws';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/layout/user-menu';
import NotificationBell from '@/components/notification/notification-bell';
import Avatar from '@/components/user/avatar';
import ChatContainer from '@/components/chat/chat-container';
import { SnippetContainer } from '@/components/snippet/snippet-container';
import { MemoContainer } from '@/components/memo/memo-container';
import SearchContainer from '@/components/search/search-container';
import ErrorBoundary from '@/components/common/error-boundary';
import type { Workspace, WorkspaceMember } from '@/types';
import { Client } from '@stomp/stompjs';

type TabType = 'chat' | 'snippets' | 'memos' | 'search';

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const workspaceId = parseInt(id);

  const { user, isLoading: isUserLoading } = useUser();
  const token = useAccessToken();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);

  const clientRef = useRef<Client | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const membersRes = await workspaceService.getMembers(workspaceId);
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  }, [workspaceId]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [wsRes, membersRes] = await Promise.all([
        workspaceService.getById(workspaceId),
        workspaceService.getMembers(workspaceId),
      ]);
      setWorkspace(wsRes.data);
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      setInviteCode(wsRes.data.inviteCode || '');
    } catch {
      setError('워크스페이스를 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!token || isUserLoading) return;
    fetchData();
  }, [fetchData, token, isUserLoading]);

  useEffect(() => {
    if (!token || isUserLoading || !user?.status) return;
    fetchMembers();
  }, [token, isUserLoading, user?.status, fetchMembers]);

  // WebSocket for member updates
  useEffect(() => {
    if (!token || !workspaceId) return;

    let client: Client;

    const initClient = async () => {
      const SockJS = (await import('sockjs-client')).default;
      client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 15000,
        onConnect: () => {
          client.subscribe(`/topic/workspace/${workspaceId}/members`, (message) => {
            try {
              const payload = JSON.parse(message.body);
              if (Array.isArray(payload)) {
                setMembers(payload);
              } else {
                fetchMembers();
              }
            } catch {
              fetchMembers();
            }
          });
        },
      });
      client.activate();
      clientRef.current = client;
    };

    initClient();
    return () => { if (client?.active) client.deactivate(); };
  }, [token, workspaceId, fetchMembers]);

  const isOwner = workspace?.owner?.id === user?.id;

  const handleLeave = async () => {
    if (!confirm('정말 이 워크스페이스를 떠나시겠습니까?')) return;
    try {
      await workspaceService.leave(workspaceId);
      router.push('/workspaces');
    } catch { setError('워크스페이스 탈퇴에 실패했습니다.'); }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 워크스페이스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      await workspaceService.delete(workspaceId);
      router.push('/workspaces');
    } catch { setError('워크스페이스 삭제에 실패했습니다.'); }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateInvite = async () => {
    try {
      const res = await workspaceService.regenerateInvite(workspaceId);
      setInviteCode(res.data.inviteCode);
    } catch { setError('초대 코드 재생성에 실패했습니다.'); }
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="text-center">
          <p className="text-red-300 mb-4">{error}</p>
          <Button onClick={() => router.push('/workspaces')} className="bg-white/20 text-white">워크스페이스 목록</Button>
        </div>
      </div>
    );
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'chat', label: '채팅' },
    { key: 'snippets', label: '스니펫' },
    { key: 'memos', label: '메모' },
    { key: 'search', label: '검색' },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <header className="border-b border-white/10 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
        <div className="px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/workspaces')} className="flex items-center gap-2 hover:opacity-80">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><span className="text-lg">💻</span></div>
              <span className="text-lg font-bold text-white hidden md:inline">DevCollab</span>
            </button>
            <span className="text-white/30">|</span>
            <h1 className="text-lg font-semibold text-white">{workspace?.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowInvite(!showInvite)} variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-sm">
              초대
            </Button>
            {isOwner ? (
              <Button onClick={handleDelete} variant="outline" className="border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-sm">삭제</Button>
            ) : (
              <Button onClick={handleLeave} variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-sm">나가기</Button>
            )}
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Invite popup */}
      {showInvite && (
        <div className="px-6 py-3 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <span className="text-white/70 text-sm">초대 코드:</span>
            <code className="px-3 py-1 rounded bg-white/10 text-white font-mono text-sm">{inviteCode}</code>
            <Button onClick={handleCopyInvite} className="bg-white/10 text-white text-xs h-8">{copied ? '복사됨!' : '복사'}</Button>
            {isOwner && <Button onClick={handleRegenerateInvite} className="bg-white/10 text-white text-xs h-8">재생성</Button>}
          </div>
        </div>
      )}

      {error && <div className="px-6 py-2 bg-red-500/20 text-red-100 text-sm">{error}</div>}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 flex-shrink-0 flex flex-col min-h-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {/* Tabs */}
          <div className="p-3 space-y-1">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === tab.key ? 'bg-white/20 text-white font-medium' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Members */}
          <div className="mt-auto border-t border-white/10 p-3">
            <p className="text-white/50 text-xs font-medium mb-2 uppercase">멤버 ({members.length})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <Avatar user={member.user} size="xs" showStatus />
                  <span className="text-white/70 text-sm truncate">{member.user?.name}</span>
                  {member.role === 'OWNER' && <span className="text-yellow-400 text-xs">👑</span>}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-hidden min-h-0">
          <ErrorBoundary>
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col min-h-0 overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)' }}>
                <ChatContainer workspaceId={id} members={members} />
              </div>
            )}
            {activeTab === 'snippets' && (
              <div className="h-full flex flex-col min-h-0 overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)' }}>
                <SnippetContainer workspaceId={id} />
              </div>
            )}
            {activeTab === 'memos' && (
              <div className="h-full flex flex-col min-h-0 overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)' }}>
                <MemoContainer workspaceId={id} />
              </div>
            )}
            {activeTab === 'search' && (
              <div className="h-full flex flex-col min-h-0 overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)' }}>
                <SearchContainer workspaceId={id} onNavigate={(tab) => setActiveTab(tab as TabType)} />
              </div>
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
