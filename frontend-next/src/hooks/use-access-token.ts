'use client';

import { useEffect, useState } from 'react';
import { getAccessToken, subscribeAccessToken } from '@/lib/access-token';

export function useAccessToken(): string | null {
  const [token, setToken] = useState<string | null>(getAccessToken());

  useEffect(() => {
    const unsubscribe = subscribeAccessToken(setToken);
    return () => {
      unsubscribe();
    };
  }, []);

  return token;
}
