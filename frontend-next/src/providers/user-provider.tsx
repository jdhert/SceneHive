'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authService, userService } from '@/services/api';
import { getAccessToken, setAccessToken, clearAccessToken, subscribeAccessToken } from '@/lib/access-token';
import type { User } from '@/types';

function setSessionCookie() {
  document.cookie = 'has_session=true; path=/; max-age=604800; SameSite=Lax';
}

function clearSessionCookie() {
  document.cookie = 'has_session=; path=/; max-age=0; SameSite=Lax';
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  fetchUser: (options?: { suppressLoading?: boolean }) => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const autoOnlineRef = useRef(false);

  const fetchUser = useCallback(async ({ suppressLoading = false } = {}) => {
    try {
      if (!suppressLoading) setIsLoading(true);
      const response = await userService.getMe();
      setUser(response.data);
      setSessionCookie();
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (err: unknown) {
      console.error('Failed to fetch user:', err);
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        clearAccessToken();
        clearSessionCookie();
        setUser(null);
        localStorage.removeItem('user');
      }
    } finally {
      if (!suppressLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const refreshResponse = await authService.refresh();
        const token = refreshResponse.data?.accessToken;
        if (token) {
          setAccessToken(token);
          setSessionCookie();
          await fetchUser({ suppressLoading: true });
        } else {
          clearSessionCookie();
          setUser(null);
        }
      } catch {
        clearAccessToken();
        clearSessionCookie();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [fetchUser]);

  useEffect(() => {
    const unsubscribe = subscribeAccessToken((token) => {
      if (!token) {
        return;
      }
      fetchUser({ suppressLoading: true });
    });

    return unsubscribe;
  }, [fetchUser]);

  useEffect(() => {
    if (!user || autoOnlineRef.current) return;
    if (user.status !== 'OFFLINE') return;

    autoOnlineRef.current = true;
    userService
      .updateStatus('ONLINE')
      .then((response) => {
        updateUser(response.data);
      })
      .catch(() => {
        autoOnlineRef.current = false;
      });
  }, [user?.id, user?.status]);

  useEffect(() => {
    const handleUnload = () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        fetch('/api/users/me/status', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'OFFLINE' }),
          keepalive: true,
        });
      } catch {
        // ignore unload failures
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem('user', JSON.stringify({ ...parsed, ...updatedData }));
    }
  };

  const logout = async () => {
    try {
      await userService.updateStatus('OFFLINE');
      await authService.logout();
    } catch {
      // ignore logout status failures
    } finally {
      clearAccessToken();
      clearSessionCookie();
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoading, fetchUser, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
