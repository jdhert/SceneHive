'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/api';
import { hashPassword } from '@/lib/crypto';
import { setAccessToken } from '@/lib/access-token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const BG = '#04060C';
const AMBER = '#55A8FF';
const AMBER_DARK = '#2A6FD2';

function setSessionCookie() {
  document.cookie = 'has_session=true; path=/; max-age=604800; SameSite=Lax';
}

function resolveOAuthBaseUrl(): string {
  const explicitBaseUrl = process.env.NEXT_PUBLIC_OAUTH_BASE_URL;
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl && /^https?:\/\//.test(apiUrl)) {
    return apiUrl.replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:8081';
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedEmail, setLockedEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [oauthErrorMessage, setOauthErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    if (oauthError === 'oauth2_email_required') {
      setOauthErrorMessage('소셜 로그인에 필요한 이메일 동의가 누락되었습니다. 동의 후 다시 시도해주세요.');
      return;
    }
    if (oauthError === 'oauth2__failed') {
      setOauthErrorMessage('소셜 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }, []);

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
  const displayError = error || oauthErrorMessage;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: BG }}>
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #55A8FF, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full blur-3xl opacity-8"
          style={{ background: 'radial-gradient(circle, #3A7ED6, transparent)', animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-6"
          style={{ background: 'radial-gradient(circle, #1E4E9A, transparent)', animationDelay: '2s' }} />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(85,168,255,0.15)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="flex justify-center mb-2">
            <span className="text-3xl">🎬</span>
          </div>
          <CardTitle className="text-3xl font-bold text-white">다시 만나요</CardTitle>
          <CardDescription style={{ color: 'rgba(255,255,255,0.5)' }}>SceneHive에 로그인하세요</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {displayError && (
            <div className="p-3 rounded-md text-sm" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
              {displayError}
              {isLocked && !resendSuccess && (
                <button onClick={handleResendUnlock} className="ml-2 underline" style={{ color: '#BFDBFE' }}>
                  잠금 해제 이메일 재발송
                </button>
              )}
              {resendSuccess && <span className="ml-2" style={{ color: '#86EFAC' }}>이메일이 발송되었습니다!</span>}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>이메일 주소</Label>
              <Input id="email" name="email" type="email" placeholder="이메일을 입력하세요" value={form.email} onChange={handleChange}
                className="focus:ring-2"
                style={{ borderColor: 'rgba(85,168,255,0.25)', background: 'rgba(255,255,255,0.06)', color: 'white' }}
                required />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>비밀번호</Label>
                <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: AMBER }}>비밀번호 찾기</Link>
              </div>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="비밀번호를 입력하세요"
                  value={form.password} onChange={handleChange}
                  className="focus:ring-2 pr-12"
                  style={{ borderColor: 'rgba(85,168,255,0.25)', background: 'rgba(255,255,255,0.06)', color: 'white' }}
                  required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {showPassword ? '숨기기' : '보기'}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full font-bold py-5 text-white" disabled={isLoading}
              style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`, boxShadow: isLoading ? 'none' : `0 4px 15px rgba(85,168,255,0.3)` }}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" style={{ borderColor: 'rgba(85,168,255,0.15)' }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2" style={{ background: 'rgba(15,13,25,0.9)', color: 'rgba(255,255,255,0.35)' }}>소셜 로그인</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <a href={`${oauthBase}/oauth2/authorization/google`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-white hover:opacity-80 transition-opacity text-sm"
              style={{ border: '1px solid rgba(85,168,255,0.2)', background: 'rgba(255,255,255,0.04)' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </a>
            <a href={`${oauthBase}/oauth2/authorization/kakao`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm text-black hover:opacity-90 transition-opacity"
              style={{ border: '1px solid rgba(0,0,0,0.08)', background: '#FEE500' }}>
              <span className="font-black text-base leading-none">K</span>
              Kakao
            </a>
            <a href={`${oauthBase}/oauth2/authorization/naver`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm text-white hover:opacity-90 transition-opacity"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#03C75A' }}>
              <span className="font-bold text-base leading-none">N</span>
              Naver
            </a>
            <button
              disabled
              className="relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm cursor-not-allowed"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.3)' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
              <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(85,168,255,0.2)', color: AMBER }}>Soon</span>
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              계정이 없으신가요?{' '}
              <Link href="/register" className="font-medium hover:underline" style={{ color: AMBER }}>회원가입</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

