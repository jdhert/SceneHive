'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const BG = '#0B0B14';
const AMBER = '#F59E0B';
const AMBER_DARK = '#D97706';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authService.verifyEmail({ email, code });
      alert('이메일 인증이 완료되었습니다. 로그인해주세요.');
      router.push('/login');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || '인증에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = { borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(255,255,255,0.06)', color: 'white' };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: BG }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }} />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.15)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="flex justify-center mb-2"><span className="text-3xl">📧</span></div>
          <CardTitle className="text-3xl font-bold text-white">이메일 인증</CardTitle>
          <CardDescription style={{ color: 'rgba(255,255,255,0.5)' }}>
            이메일로 발송된 인증 코드를 입력하세요
            <br />
            <span className="text-xs mt-1 inline-block" style={{ color: AMBER }}>* 인증코드는 5분 후 만료됩니다</span>
          </CardDescription>
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
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>이메일 주소</Label>
              <Input id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>인증 코드</Label>
              <Input id="code" type="text" placeholder="6자리 코드 입력" value={code}
                onChange={(e) => setCode(e.target.value)}
                style={inputStyle} required />
            </div>
            <Button type="submit" className="w-full font-bold py-5 text-white" disabled={isLoading}
              style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`, boxShadow: isLoading ? 'none' : '0 4px 15px rgba(245,158,11,0.3)' }}>
              {isLoading ? '인증 중...' : '이메일 인증하기'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: AMBER }} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
