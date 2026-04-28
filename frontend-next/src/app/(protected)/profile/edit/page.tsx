'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/providers/user-provider';
import { userService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AvatarUpload from '@/components/user/avatar-upload';
import UserMenu from '@/components/layout/user-menu';
import { SceneHiveIcon } from '@/components/layout/scenehive-icon';
import NotificationBell from '@/components/notification/notification-bell';

const BG = '#0B0B14';
const AMBER = '#F59E0B';
const AMBER_DARK = '#D97706';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, updateUser } = useUser();

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    jobTitle: user?.jobTitle || '',
    company: user?.company || '',
    status: user?.status || 'ONLINE',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = { borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(255,255,255,0.06)', color: 'white' };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { status, ...profileData } = form;
      const [profileRes] = await Promise.all([
        userService.updateMe(profileData),
        status !== user?.status ? userService.updateStatus(status) : Promise.resolve(null),
      ]);
      updateUser({ ...profileRes.data, status });

      if (selectedFile) {
        const avatarRes = await userService.uploadAvatar(selectedFile);
        updateUser(avatarRes.data);
      }

      router.push('/profile');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || '프로필 업데이트에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <header className="border-b flex-shrink-0"
        style={{ borderColor: 'rgba(245,158,11,0.15)', background: 'rgba(11,11,20,0.9)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <SceneHiveIcon className="w-6 h-6 shrink-0" />
              <span className="text-lg font-bold hidden md:inline" style={{ color: AMBER }}>SceneHive</span>
            </Link>
            <span style={{ color: 'rgba(245,158,11,0.3)' }}>|</span>
            <h1 className="text-lg font-semibold text-white">프로필 편집</h1>
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
          <CardHeader>
            <CardTitle className="text-white">프로필 편집</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-3 rounded-md text-sm mb-4"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
                {error}
              </div>
            )}

            <div className="flex justify-center mb-6">
              <AvatarUpload user={user} onUploadSuccess={(data) => updateUser(data)} onFileSelected={setSelectedFile} selectedFile={selectedFile} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>이름</Label>
                <Input name="name" value={form.name} onChange={handleChange} style={inputStyle} required />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>소개</Label>
                <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                  className="w-full rounded-md p-3 text-sm resize-none focus:outline-none"
                  style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(245,158,11,0.25)' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>직책</Label>
                  <Input name="jobTitle" value={form.jobTitle} onChange={handleChange} style={inputStyle} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>회사</Label>
                  <Input name="company" value={form.company} onChange={handleChange} style={inputStyle} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>상태</Label>
                <select name="status" value={form.status} onChange={handleChange}
                  className="w-full h-10 rounded-md px-3 text-sm"
                  style={{ border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(255,255,255,0.06)', color: 'white' }}>
                  <option value="ONLINE" className="bg-gray-900">온라인</option>
                  <option value="AWAY" className="bg-gray-900">자리 비움</option>
                  <option value="BUSY" className="bg-gray-900">방해 금지</option>
                  <option value="OFFLINE" className="bg-gray-900">오프라인</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push('/profile')}
                  className="flex-1 text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)' }}>
                  취소
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}>
                  {isLoading ? '저장 중...' : '저장'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
