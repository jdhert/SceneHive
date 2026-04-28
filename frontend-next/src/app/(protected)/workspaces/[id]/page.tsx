'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { workspaceService } from '@/services/api';
import { useUser } from '@/providers/user-provider';
import { useAccessToken } from '@/hooks/use-access-token';
import { WS_URL } from '@/lib/ws';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/layout/user-menu';
import { SceneHiveIcon } from '@/components/layout/scenehive-icon';
import NotificationBell from '@/components/notification/notification-bell';
import Avatar from '@/components/user/avatar';
import ChatContainer from '@/components/chat/chat-container';
import { SnippetContainer } from '@/components/snippet/snippet-container';
import { MemoContainer } from '@/components/memo/memo-container';
import SearchContainer from '@/components/search/search-container';
import ErrorBoundary from '@/components/common/error-boundary';
import type { Workspace, WorkspaceMember } from '@/types';
import { Client } from '@stomp/stompjs';

const BG = '#0B0B14';
const AMBER = '#F59E0B';

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
      setError('클럽 정보를 불러오는 데 실패했습니다.');
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
    if (!confirm('정말 이 클럽을 떠나시겠습니까?')) return;
    try {
      await workspaceService.leave(workspaceId);
      router.push('/workspaces');
    } catch { setError('클럽 탈퇴에 실패했습니다.'); }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 클럽을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      await workspaceService.delete(workspaceId);
      router.push('/workspaces');
    } catch { setError('클럽 삭제에 실패했습니다.'); }
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: AMBER }} />
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: '#FCA5A5' }}>{error}</p>
          <Button onClick={() => router.push('/workspaces')}
            className="text-white font-medium"
            style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}>
            클럽 목록으로
          </Button>
        </div>
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'chat', label: '토론', icon: '💬' },
    { key: 'snippets', label: '명대사', icon: '🎞️' },
    { key: 'memos', label: '리뷰', icon: '📝' },
    { key: 'search', label: '검색', icon: '🔍' },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: BG }}>
      {/* Header */}
      <header className="border-b flex-shrink-0"
        style={{ borderColor: 'rgba(245,158,11,0.15)', background: 'rgba(11,11,20,0.9)', backdropFilter: 'blur(10px)' }}>
        <div className="px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button onClick={() => router.push('/home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <SceneHiveIcon className="w-6 h-6 shrink-0" />
              <span className="text-base sm:text-lg font-bold tracking-tight" style={{ color: AMBER }}>SceneHive</span>
            </button>
            <span style={{ color: 'rgba(245,158,11,0.3)' }}>|</span>
            <h1 className="text-base sm:text-lg font-semibold text-white truncate">{workspace?.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowInvite(!showInvite)} variant="outline" className="text-sm"
              style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'transparent', color: 'rgba(245,158,11,0.85)' }}>
              초대
            </Button>
            {isOwner ? (
              <Button onClick={handleDelete} variant="outline" className="text-sm"
                style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#FCA5A5' }}>
                삭제
              </Button>
            ) : (
              <Button onClick={handleLeave} variant="outline" className="text-sm"
                style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)' }}>
                나가기
              </Button>
            )}
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Invite bar */}
      {showInvite && (
        <div className="px-6 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(245,158,11,0.1)', background: 'rgba(245,158,11,0.05)' }}>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>초대 코드:</span>
            <code className="px-3 py-1 rounded font-mono text-sm"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: AMBER }}>
              {inviteCode}
            </code>
            <Button onClick={handleCopyInvite} className="text-xs h-8 text-white"
              style={{ background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)', border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.3)'}` }}>
              {copied ? '복사됨!' : '복사'}
            </Button>
            {isOwner && (
              <Button onClick={handleRegenerateInvite} className="text-xs h-8 text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}>
                재생성
              </Button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="px-6 py-2 text-sm flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }}>
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <aside className="w-56 border-r flex-shrink-0 flex flex-col min-h-0"
          style={{ borderColor: 'rgba(245,158,11,0.1)', background: 'rgba(255,255,255,0.02)' }}>
          {/* Tabs */}
          <div className="p-3 space-y-1">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
                style={activeTab === tab.key
                  ? { background: 'rgba(245,158,11,0.15)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', fontWeight: 600 }
                  : { color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }
                }>
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Members */}
          <div className="mt-auto border-t p-3" style={{ borderColor: 'rgba(245,158,11,0.1)' }}>
            <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
              멤버 ({members.length})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <Avatar user={member.user} size="xs" showStatus />
                  <span className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>{member.user?.name}</span>
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
              <div className="h-full flex flex-col min-h-0 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <ChatContainer workspaceId={id} members={members} />
              </div>
            )}
            {activeTab === 'snippets' && (
              <div className="h-full flex flex-col min-h-0 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <SnippetContainer workspaceId={id} />
              </div>
            )}
            {activeTab === 'memos' && (
              <div className="h-full flex flex-col min-h-0 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <MemoContainer workspaceId={id} />
              </div>
            )}
            {activeTab === 'search' && (
              <div className="h-full flex flex-col min-h-0 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <SearchContainer workspaceId={id} onNavigate={(tab) => setActiveTab(tab as TabType)} />
              </div>
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
