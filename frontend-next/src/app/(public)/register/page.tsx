'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/api';
import { hashPassword } from '@/lib/crypto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const BG = '#0B0B14';
const AMBER = '#F59E0B';
const AMBER_DARK = '#D97706';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const hashedPassword = await hashPassword(form.password);
      await authService.register({ ...form, password: hashedPassword });
      router.push('/verify-email?email=' + encodeURIComponent(form.email));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: BG }}>
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }} />
        <div className="absolute top-3/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-8"
          style={{ background: 'radial-gradient(circle, #B45309, transparent)', animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.15)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="flex justify-center mb-2">
            <span className="text-3xl">🎬</span>
          </div>
          <CardTitle className="text-3xl font-bold text-white">SceneHive 가입</CardTitle>
          <CardDescription style={{ color: 'rgba(255,255,255,0.5)' }}>영화 팬들과 함께하세요</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-md text-sm"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>이름</Label>
              <Input id="name" name="name" type="text" placeholder="이름을 입력하세요" value={form.name} onChange={handleChange}
                style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(255,255,255,0.06)', color: 'white' }}
                required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>이메일 주소</Label>
              <Input id="email" name="email" type="email" placeholder="이메일을 입력하세요" value={form.email} onChange={handleChange}
                style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(255,255,255,0.06)', color: 'white' }}
                required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>비밀번호</Label>
              <Input id="password" name="password" type="password" placeholder="비밀번호를 입력하세요 (6자 이상)" value={form.password} onChange={handleChange}
                style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(255,255,255,0.06)', color: 'white' }}
                minLength={6} required />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>최소 6자 이상 입력하세요</p>
            </div>
            <Button type="submit" className="w-full font-bold py-5 text-white" disabled={isLoading}
              style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`, boxShadow: isLoading ? 'none' : `0 4px 15px rgba(245,158,11,0.3)` }}>
              {isLoading ? '가입 중...' : '회원가입'}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="font-medium hover:underline" style={{ color: AMBER }}>로그인</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
