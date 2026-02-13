'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@/providers/user-provider';
import { useDashboard } from '@/queries/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/layout/user-menu';
import NotificationBell from '@/components/notification/notification-bell';
import type { ChatMessage, CodeSnippet, Memo } from '@/types';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function DashboardPage() {
  const { user, isLoading: userLoading, logout } = useUser();
  const { data: dashboard, isLoading: dashLoading } = useDashboard(10);

  const isLoading = userLoading || dashLoading;

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      {/* Header */}
      <header
        className="border-b border-white/10"
        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            href="/workspaces"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-lg">💻</span>
            </div>
            <span className="text-lg font-bold text-white">DevCollab</span>
          </Link>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              안녕하세요, {user?.name}님
            </h1>
            <p className="text-white/60 mt-1">오늘의 워크스페이스 현황입니다.</p>
          </div>
          <Button onClick={logout} variant="outline" className="border-white/30 text-white hover:bg-white/10">
            로그아웃
          </Button>
        </div>

        {/* Workspace Cards */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">참여 중인 워크스페이스</h2>
            <Link href="/workspaces">
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                전체 보기
              </Button>
            </Link>
          </div>
          {!dashboard?.workspaces.length ? (
            <Card className="border-0" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
              <CardContent className="py-8 text-center">
                <p className="text-white/70">아직 참여 중인 워크스페이스가 없습니다.</p>
                <Link href="/workspaces">
                  <Button className="mt-4 bg-white/20 hover:bg-white/30 text-white">
                    워크스페이스 만들기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard.workspaces.map((ws) => (
                <Link key={ws.id} href={`/workspaces/${ws.id}`}>
                  <Card
                    className="border-0 cursor-pointer hover:scale-[1.02] transition-transform"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)' }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-lg">{ws.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {ws.description && (
                        <p className="text-white/60 text-sm mb-3 line-clamp-2">{ws.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-white/50">
                        <span>멤버 {ws.memberCount}명</span>
                        <span>{timeAgo(ws.updatedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">최근 활동</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Messages */}
            <Card className="border-0" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <span>💬</span> 최근 채팅
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!dashboard?.recentMessages.length ? (
                  <p className="text-white/50 text-sm">아직 채팅 메시지가 없습니다.</p>
                ) : (
                  dashboard.recentMessages.slice(0, 5).map((msg: ChatMessage) => (
                    <div key={msg.id} className="border-b border-white/10 pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm font-medium">{msg.sender.name}</span>
                        <span className="text-white/40 text-xs">{timeAgo(msg.createdAt)}</span>
                      </div>
                      <p className="text-white/60 text-sm truncate">{msg.content}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Snippets */}
            <Card className="border-0" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <span>🧩</span> 최근 스니펫
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!dashboard?.recentSnippets.length ? (
                  <p className="text-white/50 text-sm">아직 코드 스니펫이 없습니다.</p>
                ) : (
                  dashboard.recentSnippets.slice(0, 5).map((snippet: CodeSnippet) => (
                    <div key={snippet.id} className="border-b border-white/10 pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm font-medium">{snippet.title}</span>
                        <span className="text-white/40 text-xs">{snippet.language}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-xs">{snippet.author.name}</span>
                        <span className="text-white/40 text-xs">{timeAgo(snippet.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Memos */}
            <Card className="border-0" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <span>📝</span> 최근 메모
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!dashboard?.recentMemos.length ? (
                  <p className="text-white/50 text-sm">아직 메모가 없습니다.</p>
                ) : (
                  dashboard.recentMemos.slice(0, 5).map((memo: Memo) => (
                    <div key={memo.id} className="border-b border-white/10 pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm font-medium">{memo.title}</span>
                        <span className="text-white/40 text-xs">{timeAgo(memo.updatedAt)}</span>
                      </div>
                      <span className="text-white/50 text-xs">{memo.author.name}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
