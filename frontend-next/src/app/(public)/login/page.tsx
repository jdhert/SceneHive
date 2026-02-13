'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/api';
import { hashPassword } from '@/lib/crypto';
import { setAccessToken } from '@/lib/access-token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function setSessionCookie() {
  document.cookie = 'has_session=true; path=/; max-age=604800; SameSite=Lax';
}

function resolveOAuthBaseUrl(): string {
  return process.env.NEXT_PUBLIC_OAUTH_BASE_URL || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8081';
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedEmail, setLockedEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setIsLocked(false);

    try {
      const hashedPassword = await hashPassword(form.password);
      const response = await authService.login({ email: form.email, password: hashedPassword });
      const token = response.data?.accessToken;
      if (token) {
        setAccessToken(token);
        setSessionCookie();
        window.location.href = '/home';
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 423) {
        setIsLocked(true);
        setLockedEmail(form.email);
        setError('계정이 잠겼습니다. 이메일에서 잠금 해제 링크를 확인하세요.');
      } else {
        setError(axiosErr.response?.data?.message || '로그인에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendUnlock = async () => {
    try {
      await authService.resendUnlockEmail(lockedEmail);
      setResendSuccess(true);
    } catch {
      setError('잠금 해제 이메일 재발송에 실패했습니다.');
    }
  };

  const oauthBase = resolveOAuthBaseUrl();

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full opacity-50 animate-pulse"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)' }} />
        <div className="absolute bottom-1/4 right-1/3 w-24 h-24 rounded-full opacity-40 animate-pulse"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full opacity-30 animate-pulse"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', animationDelay: '2s' }} />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0"
        style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-white">Welcome Back</CardTitle>
          <CardDescription className="text-white/70">Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-red-500/20 text-red-100 text-sm">
              {error}
              {isLocked && !resendSuccess && (
                <button onClick={handleResendUnlock} className="ml-2 underline text-yellow-300">
                  잠금 해제 이메일 재발송
                </button>
              )}
              {resendSuccess && <span className="ml-2 text-green-300">이메일이 발송되었습니다!</span>}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange}
                className="border-white/40 bg-white/10 placeholder:text-white/50 text-white focus:ring-2 focus:ring-white/50" required />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-white">Password</Label>
                <Link href="/forgot-password" className="text-xs text-white/60 hover:text-white">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                  value={form.password} onChange={handleChange}
                  className="border-white/40 bg-white/10 placeholder:text-white/50 text-white focus:ring-2 focus:ring-white/50 pr-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-sm">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full font-bold py-5 bg-indigo-900 hover:bg-indigo-800 text-white" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/20" /></div>
            <div className="relative flex justify-center text-xs"><span className="px-2 text-white/50" style={{ background: 'rgba(255,255,255,0.25)' }}>or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href={`${oauthBase}/oauth2/authorization/google`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-white/30 text-white hover:bg-white/10 transition-colors text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </a>
            <button
              disabled
              className="relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-white/20 text-white/40 cursor-not-allowed text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
              <span className="absolute -top-2 -right-2 text-[10px] bg-white/20 text-white/60 px-1.5 py-0.5 rounded-full">Soon</span>
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-white/70">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-white hover:underline font-medium">Sign up</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
