'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => router.push('/login'), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: BG }}>
        <Card className="w-full max-w-md border-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.15)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-3">유효하지 않은 링크</h2>
            <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>유효하지 않거나 만료된 링크입니다.</p>
            <Link href="/forgot-password" className="text-sm hover:underline" style={{ color: AMBER }}>
              비밀번호 재설정 다시 요청
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setIsLoading(true);
    try {
      const hashedPassword = await hashPassword(password);
      await authService.resetPassword(token, hashedPassword);
      setSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = { borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(255,255,255,0.06)', color: 'white' };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: BG }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }} />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.15)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="flex justify-center mb-2"><span className="text-3xl">🎬</span></div>
          <CardTitle className="text-3xl font-bold text-white">
            {success ? '비밀번호 변경 완료' : '새 비밀번호 설정'}
          </CardTitle>
          <CardDescription style={{ color: 'rgba(255,255,255,0.5)' }}>
            {success ? '3초 후 로그인 페이지로 이동합니다.' : '새 비밀번호를 입력하세요.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-md text-sm"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
              {error}
            </div>
          )}
          {success ? (
            <div className="text-center">
              <div className="p-3 rounded-md text-sm mb-4"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#86EFAC' }}>
                비밀번호가 성공적으로 변경되었습니다.
              </div>
              <Link href="/login" className="text-sm hover:underline" style={{ color: AMBER }}>
                로그인으로 이동
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>새 비밀번호</Label>
                <Input id="password" type="password" placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle} minLength={8} required />
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>최소 8자 이상 입력하세요</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>비밀번호 확인</Label>
                <Input id="confirmPassword" type="password" placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle} minLength={8} required />
              </div>
              <Button type="submit" className="w-full font-bold py-5 text-white" disabled={isLoading}
                style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`, boxShadow: isLoading ? 'none' : '0 4px 15px rgba(245,158,11,0.3)' }}>
                {isLoading ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: AMBER }} />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
