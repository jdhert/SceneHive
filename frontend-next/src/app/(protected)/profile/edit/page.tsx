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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <header className="border-b border-white/10 px-6 py-4" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2 hover:opacity-80">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><span className="text-lg">💻</span></div>
              <span className="text-lg font-bold text-white hidden md:inline">DevCollab</span>
            </Link>
            <span className="text-white/30">|</span>
            <h1 className="text-xl font-bold text-white">프로필 편집</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <Card className="border-0" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)' }}>
          <CardHeader><CardTitle className="text-white">프로필 편집</CardTitle></CardHeader>
          <CardContent>
            {error && <div className="p-3 rounded-md bg-red-500/20 text-red-100 text-sm mb-4">{error}</div>}

            <div className="flex justify-center mb-6">
              <AvatarUpload user={user} onUploadSuccess={(data) => updateUser(data)} onFileSelected={setSelectedFile} selectedFile={selectedFile} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">이름</Label>
                <Input name="name" value={form.name} onChange={handleChange} className="border-white/40 bg-white/10 text-white" required />
              </div>
              <div className="space-y-2">
                <Label className="text-white">소개</Label>
                <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                  className="w-full rounded-md border border-white/40 bg-white/10 text-white p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">직책</Label>
                  <Input name="jobTitle" value={form.jobTitle} onChange={handleChange} className="border-white/40 bg-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">회사</Label>
                  <Input name="company" value={form.company} onChange={handleChange} className="border-white/40 bg-white/10 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">상태</Label>
                <select name="status" value={form.status} onChange={handleChange}
                  className="w-full h-10 rounded-md border border-white/40 bg-white/10 text-white px-3 text-sm">
                  <option value="ONLINE" className="bg-gray-800">온라인</option>
                  <option value="AWAY" className="bg-gray-800">자리 비움</option>
                  <option value="BUSY" className="bg-gray-800">방해 금지</option>
                  <option value="OFFLINE" className="bg-gray-800">오프라인</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push('/profile')} className="flex-1 border-white/30 bg-white/10 text-white hover:bg-white/20">취소</Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-indigo-900 hover:bg-indigo-800 text-white">
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
