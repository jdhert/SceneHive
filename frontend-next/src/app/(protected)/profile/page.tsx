'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Avatar from '@/components/user/avatar';
import StatusBadge from '@/components/user/status-badge';
import UserMenu from '@/components/layout/user-menu';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <header className="border-b border-white/10 px-6 py-4" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2 hover:opacity-80">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><span className="text-lg">💻</span></div>
              <span className="text-lg font-bold text-white hidden md:inline">DevCollab</span>
            </Link>
            <span className="text-white/30">|</span>
            <h1 className="text-xl font-bold text-white">프로필</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <Card className="border-0" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)' }}>
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <Avatar user={user} size="xl" showStatus />
              <h2 className="text-2xl font-bold text-white mt-4">{user.name}</h2>
              <StatusBadge status={user.status} size="lg" showLabel />
              <p className="text-white/50 text-sm mt-1">{user.email}</p>
            </div>

            <div className="space-y-4 text-white/70 text-sm">
              {user.jobTitle && (
                <div className="flex justify-between">
                  <span className="text-white/50">직책</span>
                  <span>{user.jobTitle}{user.company ? ` @ ${user.company}` : ''}</span>
                </div>
              )}
              {user.bio && (
                <div>
                  <span className="text-white/50 block mb-1">소개</span>
                  <p className="text-white/80">{user.bio}</p>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/50">가입일</span>
                <span>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              {user.lastSeenAt && (
                <div className="flex justify-between">
                  <span className="text-white/50">마지막 접속</span>
                  <span>{new Date(user.lastSeenAt).toLocaleString('ko-KR')}</span>
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <Button onClick={() => router.push('/profile/edit')} className="bg-indigo-900 hover:bg-indigo-800 text-white">
                프로필 편집
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
