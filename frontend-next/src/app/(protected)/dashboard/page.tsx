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

const BG = '#0B0B14';
const AMBER = '#F59E0B';

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
  const { user, isLoading: userLoading } = useUser();
  const { data: dashboard, isLoading: dashLoading } = useDashboard(10);

  const isLoading = userLoading || dashLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: AMBER }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <header className="border-b flex-shrink-0"
        style={{ borderColor: 'rgba(245,158,11,0.15)', background: 'rgba(11,11,20,0.9)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/workspaces" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xl">🎬</span>
            <span className="text-lg font-bold hidden md:inline" style={{ color: AMBER }}>SceneHive</span>
          </Link>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold text-white">
            안녕하세요, {user?.name}님 👋
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>오늘의 영화 클럽 현황입니다.</p>
        </div>

        {/* Club Cards */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">참여 중인 영화 클럽</h2>
            <Link href="/workspaces">
              <Button variant="ghost" className="text-sm" style={{ color: 'rgba(245,158,11,0.7)' }}>
                전체 보기 →
              </Button>
            </Link>
          </div>
          {!dashboard?.workspaces.length ? (
            <Card className="border-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <CardContent className="py-8 text-center">
                <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>아직 참여 중인 영화 클럽이 없습니다.</p>
                <Link href="/workspaces">
                  <Button className="text-white font-medium"
                    style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    영화 클럽 만들기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard.workspaces.map((ws) => (
                <Link key={ws.id} href={`/workspaces/${ws.id}`}>
                  <Card className="border-0 cursor-pointer hover:scale-[1.02] transition-transform"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-base">{ws.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {ws.description && (
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{ws.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
          <h2 className="text-lg font-semibold text-white mb-4">최근 활동</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Messages */}
            <Card className="border-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <span>💬</span> 최근 토론
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!dashboard?.recentMessages.length ? (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>아직 토론 내역이 없습니다.</p>
                ) : (
                  dashboard.recentMessages.slice(0, 5).map((msg: ChatMessage) => (
                    <div key={msg.id} className="border-b pb-2 last:border-0" style={{ borderColor: 'rgba(245,158,11,0.08)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{msg.sender.name}</span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{timeAgo(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{msg.content}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Snippets */}
            <Card className="border-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <span>🎞️</span> 최근 명대사
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!dashboard?.recentSnippets.length ? (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>아직 명대사가 없습니다.</p>
                ) : (
                  dashboard.recentSnippets.slice(0, 5).map((snippet: CodeSnippet) => (
                    <div key={snippet.id} className="border-b pb-2 last:border-0" style={{ borderColor: 'rgba(245,158,11,0.08)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>{snippet.title}</span>
                        <span className="text-xs ml-2 shrink-0" style={{ color: AMBER }}>{snippet.language}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{snippet.author.name}</span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{timeAgo(snippet.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Memos */}
            <Card className="border-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <span>📝</span> 최근 리뷰
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!dashboard?.recentMemos.length ? (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>아직 리뷰가 없습니다.</p>
                ) : (
                  dashboard.recentMemos.slice(0, 5).map((memo: Memo) => (
                    <div key={memo.id} className="border-b pb-2 last:border-0" style={{ borderColor: 'rgba(245,158,11,0.08)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>{memo.title}</span>
                        <span className="text-xs ml-2 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{timeAgo(memo.updatedAt)}</span>
                      </div>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{memo.author.name}</span>
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
