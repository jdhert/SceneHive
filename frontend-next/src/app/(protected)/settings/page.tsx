'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/providers/theme-provider';
import { useUser } from '@/providers/user-provider';
import { settingsService, userService } from '@/services/api';
import { hashPassword } from '@/lib/crypto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ThemeToggle from '@/components/settings/theme-toggle';
import UserMenu from '@/components/layout/user-menu';
import NotificationBell from '@/components/notification/notification-bell';
import type { UserSettings } from '@/types';

const BG = '#0B0B14';
const AMBER = '#F59E0B';
const AMBER_DARK = '#D97706';

function ToggleItem({ label, description, checked, onChange }: {
  label: string; description: string; checked?: boolean; onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{description}</p>
      </div>
      <button onClick={onChange}
        className="w-12 h-6 rounded-full transition-colors relative"
        style={{ background: checked ? AMBER : 'rgba(255,255,255,0.15)' }}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout } = useUser();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  const inputStyle = { borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(255,255,255,0.06)', color: 'white' };

  useEffect(() => {
    settingsService.getSettings()
      .then((res) => {
        setSettings(res.data);
        if (res.data.theme) setTheme(res.data.theme.toLowerCase());
      })
      .catch((err) => console.error('Failed to fetch settings:', err))
      .finally(() => setIsLoading(false));
  }, [setTheme]);

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    try { await settingsService.updateSettings({ theme: newTheme.toUpperCase() as import('@/types').Theme }); }
    catch (err) { console.error('Failed to save theme:', err); }
  };

  const handleToggle = async (field: keyof UserSettings) => {
    if (!settings) return;
    const newValue = !settings[field];
    setSettings((prev) => prev ? { ...prev, [field]: newValue } : null);
    try { await settingsService.updateSettings({ [field]: newValue }); }
    catch (err) {
      console.error('Failed to update setting:', err);
      setSettings((prev) => prev ? { ...prev, [field]: !newValue } : null);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    setSettings((prev) => prev ? { ...prev, language: lang } : null);
    try { await settingsService.updateSettings({ language: lang }); }
    catch (err) { console.error('Failed to save language:', err); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (pwForm.newPw.length < 8) {
      setPwError('새 비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    setPwLoading(true);
    try {
      const [hashedCurrent, hashedNew] = await Promise.all([
        hashPassword(pwForm.current),
        hashPassword(pwForm.newPw),
      ]);
      await userService.changePassword(hashedCurrent, hashedNew);
      setPwForm({ current: '', newPw: '', confirm: '' });
      logout();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setPwError(axiosErr.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setPwLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: AMBER }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <header className="border-b flex-shrink-0"
        style={{ borderColor: 'rgba(245,158,11,0.15)', background: 'rgba(11,11,20,0.9)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/workspaces" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-xl">🎬</span>
              <span className="text-lg font-bold hidden md:inline" style={{ color: AMBER }}>SceneHive</span>
            </Link>
            <span style={{ color: 'rgba(245,158,11,0.3)' }}>|</span>
            <Button variant="ghost" onClick={() => router.back()} className="text-sm"
              style={{ color: 'rgba(255,255,255,0.5)' }}>← 뒤로</Button>
            <h1 className="text-lg font-semibold text-white">설정</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* 외관 */}
        <Card className="border-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <CardHeader>
            <CardTitle className="text-white text-base">외관</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm block mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>테마</label>
              <ThemeToggle theme={theme} onChange={handleThemeChange} />
            </div>
            <div>
              <label className="text-sm block mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>언어</label>
              <select value={settings?.language || 'ko'} onChange={(e) => handleLanguageChange(e.target.value)}
                className="h-10 px-3 rounded-md text-sm"
                style={{ border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(255,255,255,0.06)', color: 'white' }}>
                <option value="ko" className="bg-gray-900">한국어</option>
                <option value="en" className="bg-gray-900">English</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 알림 */}
        <Card className="border-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <CardHeader>
            <CardTitle className="text-white text-base">알림</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleItem label="이메일 알림" description="중요 업데이트를 이메일로 받습니다" checked={settings?.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
            <ToggleItem label="푸시 알림" description="브라우저 푸시 알림을 받습니다" checked={settings?.pushNotifications} onChange={() => handleToggle('pushNotifications')} />
            <ToggleItem label="멘션 알림" description="@멘션 시 알림을 받습니다" checked={settings?.mentionNotifications} onChange={() => handleToggle('mentionNotifications')} />
          </CardContent>
        </Card>

        {/* 비밀번호 변경 */}
        <Card className="border-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <CardHeader>
            <CardTitle className="text-white text-base">비밀번호 변경</CardTitle>
          </CardHeader>
          <CardContent>
            {pwError && (
              <div className="p-3 rounded-md text-sm mb-4"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
                {pwError}
              </div>
            )}
<form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>현재 비밀번호</Label>
                <Input type="password" value={pwForm.current}
                  onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  style={inputStyle} required />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>새 비밀번호</Label>
                <Input type="password" placeholder="최소 8자 이상" value={pwForm.newPw}
                  onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                  style={inputStyle} required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>새 비밀번호 확인</Label>
                <Input type="password" placeholder="새 비밀번호를 다시 입력하세요" value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  style={inputStyle} required minLength={8} />
              </div>
              <Button type="submit" disabled={pwLoading} className="font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`, boxShadow: pwLoading ? 'none' : '0 4px 15px rgba(245,158,11,0.3)' }}>
                {pwLoading ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
