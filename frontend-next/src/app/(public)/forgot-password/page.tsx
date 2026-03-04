'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const BG = '#04060C';
const AMBER = '#55A8FF';
const AMBER_DARK = '#2A6FD2';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || '요청에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: BG }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #55A8FF, transparent)' }} />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(85,168,255,0.15)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="flex justify-center mb-2"><span className="text-3xl">🎬</span></div>
          <CardTitle className="text-3xl font-bold text-white">
            {success ? '이메일 발송 완료' : '비밀번호 찾기'}
          </CardTitle>
          <CardDescription style={{ color: 'rgba(255,255,255,0.5)' }}>
            {success ? '이메일을 확인하여 비밀번호를 재설정하세요.' : '가입한 이메일로 재설정 링크를 보내드립니다.'}
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
            <div className="text-center space-y-4">
              <div className="p-3 rounded-md text-sm"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#86EFAC' }}>
                비밀번호 재설정 링크가 이메일로 전송되었습니다.
              </div>
              <Link href="/login" className="inline-block text-sm hover:underline" style={{ color: AMBER }}>
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>이메일 주소</Label>
                <Input id="email" type="email" placeholder="이메일을 입력하세요" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ borderColor: 'rgba(85,168,255,0.25)', background: 'rgba(255,255,255,0.06)', color: 'white' }}
                  required />
              </div>
              <Button type="submit" className="w-full font-bold py-5 text-white" disabled={isLoading}
                style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`, boxShadow: isLoading ? 'none' : '0 4px 15px rgba(85,168,255,0.3)' }}>
                {isLoading ? '발송 중...' : '재설정 링크 보내기'}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm hover:underline" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  로그인으로 돌아가기
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

