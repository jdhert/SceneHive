'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAccessToken } from '@/lib/access-token';
import { authService } from '@/services/api';

export default function OAuth2RedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');

    if (accessToken) {
      setAccessToken(accessToken);
      router.replace('/home');
    } else {
      authService
        .refresh()
        .then((response) => {
          const token = response.data?.accessToken;
          if (token) {
            setAccessToken(token);
            router.replace('/home');
          } else {
            router.replace('/login');
          }
        })
        .catch(() => {
          router.replace('/login');
        });
    }
  }, [searchParams, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto" />
        <p className="text-white/70 mt-6 text-lg">로그인 처리 중...</p>
      </div>
    </div>
  );
}
