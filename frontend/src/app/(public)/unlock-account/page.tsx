'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UnlockAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('유효하지 않은 링크입니다.');
      return;
    }

    unlockAccount(token);
  }, [searchParams]);

  const unlockAccount = async (token: string) => {
    try {
      await api.post(`/auth/unlock-account?token=${encodeURIComponent(token)}`);
      setStatus('success');
      setMessage('계정 잠금이 해제되었습니다. 다시 로그인해주세요.');
    } catch (err: any) {
      setStatus('error');
      setMessage(
        err.response?.data?.message || '잠금 해제에 실패했습니다. 링크가 만료되었을 수 있습니다.'
      );
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <Card
        className="w-full max-w-md border-0"
        style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(40px)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.3)',
        }}
      >
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">계정 잠금 해제</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto" />
              <p className="text-white/70 mt-4">잠금 해제 처리 중...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30 text-green-100 text-center">
                {message}
              </div>
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-indigo-900 hover:bg-indigo-800 text-white"
              >
                로그인 페이지로 이동
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-100 text-center">
                {message}
              </div>
              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/20"
              >
                로그인 페이지로 이동
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
