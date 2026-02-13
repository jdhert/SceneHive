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
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Card className="w-full max-w-md border-0"
          style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h2>
            <p className="text-white/60 mb-6">유효하지 않거나 만료된 링크입니다.</p>
            <Link href="/forgot-password" className="text-white underline text-sm">비밀번호 재설정 다시 요청</Link>
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card className="w-full max-w-md border-0"
        style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-white">
            {success ? 'Password Reset!' : 'Reset Password'}
          </CardTitle>
          <CardDescription className="text-white/70">
            {success ? '3초 후 로그인 페이지로 이동합니다.' : '새 비밀번호를 입력하세요.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <div className="p-3 rounded-md bg-red-500/20 text-red-100 text-sm">{error}</div>}
          {success ? (
            <div className="text-center">
              <div className="p-3 rounded-md bg-green-500/20 text-green-100 text-sm mb-4">비밀번호가 성공적으로 변경되었습니다.</div>
              <Link href="/login" className="text-white underline text-sm">로그인으로 이동</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-white">New Password</Label>
                <Input id="password" type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="border-white/40 bg-white/10 placeholder:text-white/50 text-white" minLength={8} required />
                <p className="text-xs text-white/50">Must be at least 8 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-white">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-white/40 bg-white/10 placeholder:text-white/50 text-white" minLength={8} required />
              </div>
              <Button type="submit" className="w-full font-bold py-5 bg-indigo-900 hover:bg-indigo-800 text-white" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}><div className="text-white">Loading...</div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
