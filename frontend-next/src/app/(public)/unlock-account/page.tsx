'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const BG = '#04060C';
const AMBER = '#55A8FF';
const AMBER_DARK = '#2A6FD2';

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
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: BG }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #55A8FF, transparent)' }} />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(85,168,255,0.15)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <CardContent className="py-12 text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: AMBER }} />
              <p style={{ color: 'rgba(255,255,255,0.65)' }}>계정 잠금 해제 중...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="text-4xl mb-4">🔓</div>
              <div className="p-4 rounded-lg text-sm mb-6"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#86EFAC' }}>
                {message}
              </div>
              <Link href="/login">
                <Button className="font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}>
                  로그인으로 이동
                </Button>
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="text-4xl mb-4">⚠️</div>
              <div className="p-4 rounded-lg text-sm mb-6"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
                {message}
              </div>
              <Link href="/login">
                <Button className="font-medium text-white"
                  style={{ background: 'rgba(85,168,255,0.15)', border: '1px solid rgba(85,168,255,0.3)' }}>
                  로그인으로 이동
                </Button>
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: AMBER }} />
      </div>
    }>
      <UnlockAccountContent />
    </Suspense>
  );
}

