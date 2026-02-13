'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { userService } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import Avatar from '@/components/user/avatar';
import StatusBadge from '@/components/user/status-badge';
import UserMenu from '@/components/layout/user-menu';
import type { User } from '@/types';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.userId as string);

  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    userService.getUserById(userId)
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <p className="text-white/70">사용자를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <header className="border-b border-white/10 px-6 py-4" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-white hover:bg-white/20 px-3 py-1 rounded text-sm">← 뒤로</button>
            <h1 className="text-xl font-bold text-white">프로필</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <Card className="border-0" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)' }}>
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <Avatar user={profile} size="xl" showStatus />
              <h2 className="text-2xl font-bold text-white mt-4">{profile.name}</h2>
              <StatusBadge status={profile.status} size="lg" showLabel />
            </div>
            <div className="space-y-4 text-white/70 text-sm">
              {profile.jobTitle && (
                <div className="flex justify-between">
                  <span className="text-white/50">직책</span>
                  <span>{profile.jobTitle}{profile.company ? ` @ ${profile.company}` : ''}</span>
                </div>
              )}
              {profile.bio && (
                <div>
                  <span className="text-white/50 block mb-1">소개</span>
                  <p className="text-white/80">{profile.bio}</p>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/50">가입일</span>
                <span>{new Date(profile.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              {profile.lastSeenAt && (
                <div className="flex justify-between">
                  <span className="text-white/50">마지막 접속</span>
                  <span>{new Date(profile.lastSeenAt).toLocaleString('ko-KR')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
