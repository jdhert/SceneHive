'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card className="w-full max-w-md relative z-10 border-0"
        style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-white">Email Verification</CardTitle>
          <CardDescription className="text-white/70">
            Enter the verification code sent to your email
            <br />
            <span className="text-yellow-300 text-xs mt-1 inline-block">* 인증코드는 5분 후 만료됩니다</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <div className="p-3 rounded-md bg-red-500/20 text-red-100 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="border-white/40 bg-white/10 placeholder:text-white/50 text-white focus:ring-2 focus:ring-white/50" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium text-white">Verification Code</Label>
              <Input id="code" type="text" placeholder="Enter 6-digit code" value={code} onChange={(e) => setCode(e.target.value)}
                className="border-white/40 bg-white/10 placeholder:text-white/50 text-white focus:ring-2 focus:ring-white/50" required />
            </div>
            <Button type="submit" className="w-full font-bold py-5 bg-indigo-900 hover:bg-indigo-800 text-white" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}><div className="text-white">Loading...</div></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
