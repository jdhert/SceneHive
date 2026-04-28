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
import { SceneHiveIcon } from '@/components/layout/scenehive-icon';
import NotificationBell from '@/components/notification/notification-bell';

const BG = '#0B0B14';
const AMBER = '#F59E0B';
const AMBER_DARK = '#D97706';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: AMBER }} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <header className="border-b flex-shrink-0"
        style={{ borderColor: 'rgba(245,158,11,0.15)', background: 'rgba(11,11,20,0.9)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <SceneHiveIcon className="w-6 h-6 shrink-0" />
              <span className="text-base sm:text-lg font-bold tracking-tight" style={{ color: AMBER }}>SceneHive</span>
            </Link>
            <span style={{ color: 'rgba(245,158,11,0.3)' }}>|</span>
            <h1 className="text-lg font-semibold text-white">프로필</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <Card className="border-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.15)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <Avatar user={user} size="xl" showStatus />
              <h2 className="text-2xl font-bold text-white mt-4">{user.name}</h2>
              <div className="mt-2">
                <StatusBadge status={user.status} size="lg" showLabel />
              </div>
              <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{user.email}</p>
            </div>

            <div className="space-y-3 text-sm border-t pt-6" style={{ borderColor: 'rgba(245,158,11,0.1)' }}>
              {user.jobTitle && (
                <div className="flex justify-between">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>직책</span>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>{user.jobTitle}{user.company ? ` @ ${user.company}` : ''}</span>
                </div>
              )}
              {user.bio && (
                <div>
                  <span className="block mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>소개</span>
                  <p style={{ color: 'rgba(255,255,255,0.75)' }}>{user.bio}</p>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>가입일</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              {user.lastSeenAt && (
                <div className="flex justify-between">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>마지막 접속</span>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>{new Date(user.lastSeenAt).toLocaleString('ko-KR')}</span>
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <Button onClick={() => router.push('/profile/edit')} className="font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`, boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>
                프로필 편집
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
