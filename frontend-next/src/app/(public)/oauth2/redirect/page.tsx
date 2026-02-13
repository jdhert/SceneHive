'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAccessToken } from '@/lib/access-token';
import { authService } from '@/services/api';

function setSessionCookie() {
  document.cookie = 'has_session=true; path=/; max-age=604800; SameSite=Lax';
}

function OAuth2RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const error = searchParams.get('error');

    if (accessToken) {
      setAccessToken(accessToken);
      setSessionCookie();
      router.replace('/home');
    } else if (!error) {
      authService.refresh()
        .then((response) => {
          const token = response.data?.accessToken;
          if (token) {
            setAccessToken(token);
            setSessionCookie();
            router.replace('/home');
          } else {
            router.replace('/login');
          }
        })
        .catch(() => {
          router.replace('/login');
        });
    } else {
      console.error('OAuth2 Login Failed:', error);
      router.replace('/login');
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white" />
    </div>
  );
}

export default function OAuth2RedirectPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white" /></div>}>
      <OAuth2RedirectContent />
    </Suspense>
  );
}
