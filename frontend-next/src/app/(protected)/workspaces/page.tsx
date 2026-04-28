'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { workspaceService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UserMenu from '@/components/layout/user-menu';
import { SceneHiveIcon } from '@/components/layout/scenehive-icon';
import NotificationBell from '@/components/notification/notification-bell';
import type { Workspace } from '@/types';

const BG = '#0B0B14';
const AMBER = '#F59E0B';
const AMBER_DARK = '#D97706';
const BRAND_TEXT = 'rgba(255,255,255,0.92)';
const CARD_BG = 'rgba(255,255,255,0.04)';
const CARD_BORDER = '1px solid rgba(245,158,11,0.12)';

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);
      const response = await workspaceService.getAll();
      setWorkspaces(response.data);
    } catch {
      setError('클럽 목록을 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await workspaceService.create(createForm);
      setWorkspaces([...workspaces, response.data]);
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '' });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || '영화 클럽 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    try {
      const response = await workspaceService.join(inviteCode);
      setWorkspaces([...workspaces, response.data]);
      setShowJoinModal(false);
      setInviteCode('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || '영화 클럽 참여에 실패했습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  const inputStyle = {
    borderColor: 'rgba(245,158,11,0.25)',
    background: 'rgba(255,255,255,0.06)',
    color: 'white',
  };

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-24 right-[-10%] w-[28rem] h-[28rem] rounded-full blur-3xl opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.55), transparent 68%)' }}
        />
      </div>

      <header
        className="relative z-10 border-b flex-shrink-0"
        style={{
          borderColor: 'rgba(245,158,11,0.15)',
          background: 'rgba(11,11,20,0.9)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <Link href="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <SceneHiveIcon className="w-6 h-6 shrink-0" />
            <span className="text-base sm:text-lg font-bold tracking-tight" style={{ color: BRAND_TEXT }}>SceneHive</span>
          </Link>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">영화 클럽</h1>
            <p className="mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>클럽을 선택하거나 새로 만드세요</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button onClick={() => setShowJoinModal(true)} variant="outline"
              className="font-medium"
              style={{ borderColor: 'rgba(245,158,11,0.28)', background: 'rgba(245,158,11,0.06)', color: 'rgba(245,158,11,0.9)' }}>
              초대 코드로 참여
            </Button>
            <Button onClick={() => setShowCreateModal(true)}
              className="font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`, boxShadow: '0 14px 30px rgba(245,158,11,0.18)' }}>
              + 새 클럽 만들기
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg text-sm"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
            {error}
            <button onClick={() => setError('')} className="ml-4 underline opacity-70">닫기</button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: AMBER }} />
            <p className="mt-4" style={{ color: 'rgba(255,255,255,0.5)' }}>로딩 중...</p>
          </div>
        ) : workspaces.length === 0 ? (
          <Card className="border-0 text-center py-12"
            style={{ background: CARD_BG, border: CARD_BORDER }}>
            <CardContent>
              <div className="mb-4"><SceneHiveIcon className="w-12 h-12 mx-auto" /></div>
              <p className="text-lg text-white">아직 참여 중인 영화 클럽이 없습니다.</p>
              <p className="mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>새 클럽을 만들거나 초대 코드로 참여하세요</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <Card key={workspace.id}
                className="border-0 cursor-pointer transition-all hover:scale-105"
                style={{ background: CARD_BG, border: CARD_BORDER }}
                onClick={() => router.push(`/workspaces/${workspace.id}`)}>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <SceneHiveIcon className="w-5 h-5 shrink-0" />
                    <CardTitle className="text-white">{workspace.name}</CardTitle>
                  </div>
                  <CardDescription style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {workspace.description || '설명 없음'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <span>멤버 {workspace.memberCount}명</span>
                    <span>개설자: {workspace.owner?.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <Card className="w-full max-w-md border-0"
            style={{ background: 'rgba(18,16,26,0.97)', border: '1px solid rgba(245,158,11,0.2)', backdropFilter: 'blur(40px)' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><SceneHiveIcon className="w-5 h-5 shrink-0" /> 새 영화 클럽 만들기</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>클럽 이름</Label>
                  <Input id="name" value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="예: 봉준호 감독 팬클럽" style={inputStyle} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>설명 (선택)</Label>
                  <Input id="description" value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="클럽 소개를 입력하세요" style={inputStyle} />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1"
                    style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'transparent', color: 'rgba(245,158,11,0.8)' }}>
                    취소
                  </Button>
                  <Button type="submit" disabled={isCreating} className="flex-1 font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}>
                    {isCreating ? '생성 중...' : '만들기'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <Card className="w-full max-w-md border-0"
            style={{ background: 'rgba(18,16,26,0.97)', border: '1px solid rgba(245,158,11,0.2)', backdropFilter: 'blur(40px)' }}>
            <CardHeader>
              <CardTitle className="text-white">영화 클럽 참여</CardTitle>
              <CardDescription style={{ color: 'rgba(255,255,255,0.45)' }}>초대 코드를 입력하여 클럽에 참여하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinWorkspace} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>초대 코드</Label>
                  <Input id="inviteCode" value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="초대 코드 입력" style={inputStyle} required />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowJoinModal(false)} className="flex-1"
                    style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'transparent', color: 'rgba(245,158,11,0.8)' }}>
                    취소
                  </Button>
                  <Button type="submit" disabled={isJoining} className="flex-1 font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}>
                    {isJoining ? '참여 중...' : '참여하기'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
