'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card className="w-full max-w-md relative z-10 border-0"
        style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-white">
            {success ? 'Email Sent!' : 'Forgot Password'}
          </CardTitle>
          <CardDescription className="text-white/70">
            {success ? '이메일을 확인하여 비밀번호를 재설정하세요.' : '비밀번호 재설정 링크를 보내드립니다.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <div className="p-3 rounded-md bg-red-500/20 text-red-100 text-sm">{error}</div>}

          {success ? (
            <div className="text-center space-y-4">
              <div className="p-3 rounded-md bg-green-500/20 text-green-100 text-sm">
                비밀번호 재설정 링크가 이메일로 전송되었습니다.
              </div>
              <Link href="/login" className="inline-block text-white hover:underline text-sm">
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white">Email Address</Label>
                <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="border-white/40 bg-white/10 placeholder:text-white/50 text-white focus:ring-2 focus:ring-white/50" required />
              </div>
              <Button type="submit" className="w-full font-bold py-5 bg-indigo-900 hover:bg-indigo-800 text-white" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-white/70 hover:text-white">로그인으로 돌아가기</Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
