'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function UnlockAccountContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('유효하지 않은 링크입니다.');
      return;
    }

    api.post(`/auth/unlock-account?token=${encodeURIComponent(token)}`)
      .then(() => {
        setStatus('success');
        setMessage('계정 잠금이 해제되었습니다.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || '잠금 해제에 실패했습니다.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card className="w-full max-w-md border-0"
        style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
        <CardContent className="py-12 text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p className="text-white">계정 잠금 해제 중...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="p-4 rounded-lg bg-green-500/20 text-green-100 mb-6">{message}</div>
              <Link href="/login">
                <Button className="bg-indigo-900 hover:bg-indigo-800 text-white">로그인으로 이동</Button>
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="p-4 rounded-lg bg-red-500/20 text-red-100 mb-6">{message}</div>
              <Link href="/login">
                <Button className="bg-white/20 hover:bg-white/30 text-white">로그인으로 이동</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnlockAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" /></div>}>
      <UnlockAccountContent />
    </Suspense>
  );
}
