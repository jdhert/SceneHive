import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/api'
import { hashPassword } from '../lib/crypto'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')
  const [isResending, setIsResending] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      console.log('Attempting login...')
      const hashedPassword = await hashPassword(password)
      const response = await authService.login({ email, password: hashedPassword })
      console.log('Login response:', response)
      console.log('Response data:', response.data)

      localStorage.setItem('accessToken', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      console.log('Tokens saved, navigating to /home...')

      window.location.href = '/home'
    } catch (err) {
      console.error('Login error:', err)
      const status = err.response?.status
      const message = err.response?.data?.message || '로그인에 실패했습니다.'
      setError(message)
      setIsLocked(status === 423)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendUnlock = async () => {
    if (!email) {
      setError('이메일을 입력해주세요.')
      return
    }
    setIsResending(true)
    setResendSuccess('')
    try {
      await authService.resendUnlockEmail(email)
      setResendSuccess('잠금 해제 이메일이 재발송되었습니다. 메일함을 확인해주세요.')
    } catch (err) {
      setError(err.response?.data?.message || '이메일 재발송에 실패했습니다.')
    } finally {
      setIsResending(false)
    }
  }

  const handleSocialLogin = (provider) => {
    const API_BASE_URL = 'http://localhost:8081' // Should ideally come from env
    if (provider === 'Google') {
      window.location.href = `${API_BASE_URL}/oauth2/authorization/google`
    } else if (provider === 'Apple') {
      window.location.href = `${API_BASE_URL}/oauth2/authorization/apple`
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Floating glass orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full opacity-50 animate-pulse"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
          }}
        />
        <div
          className="absolute top-3/4 right-1/4 w-24 h-24 rounded-full opacity-40 animate-pulse"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            animationDelay: '1s',
          }}
        />
      </div>

      <Card
        className="w-full max-w-md relative z-10 border-0"
        style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(40px)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.3)',
        }}
      >
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-white">Welcome Back</CardTitle>
          <CardDescription className="text-white/70">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className={`p-3 rounded-md text-sm ${
              isLocked
                ? 'bg-orange-500/20 border border-orange-500/30 text-orange-100'
                : 'bg-red-500/20 text-red-100'
            }`}>
              {isLocked && (
                <p className="font-bold mb-1">Account Locked</p>
              )}
              {error}
              {isLocked && (
                <button
                  type="button"
                  onClick={handleResendUnlock}
                  disabled={isResending}
                  className="mt-2 block w-full text-center py-1.5 rounded bg-white/10 hover:bg-white/20 text-orange-100 text-xs transition-colors"
                >
                  {isResending ? '발송 중...' : '잠금 해제 이메일 재발송'}
                </button>
              )}
            </div>
          )}
          {resendSuccess && (
            <div className="p-3 rounded-md bg-green-500/20 text-green-100 text-sm">
              {resendSuccess}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-white/40 bg-white/10 placeholder:text-white/50 text-white focus:ring-2 focus:ring-white/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-white/40 bg-white/10 placeholder:text-white/50 text-white focus:ring-2 focus:ring-white/50 pr-16"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                >
                  {showPassword ? (
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                      <path d="M9.88 5.09A9.77 9.77 0 0 1 12 5c5 0 8.27 3.11 9.5 5.5a10.94 10.94 0 0 1-4.09 4.44" />
                      <path d="M6.61 6.61A10.6 10.6 0 0 0 2.5 10.5c1.23 2.39 4.5 5.5 9.5 5.5 1.52 0 2.93-.27 4.2-.77" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2.5 12c1.23-2.39 4.5-5.5 9.5-5.5s8.27 3.11 9.5 5.5c-1.23 2.39-4.5 5.5-9.5 5.5s-8.27-3.11-9.5-5.5z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full font-bold py-5 bg-indigo-900 hover:bg-indigo-800 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 text-white/60">Or continue with</span>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => handleSocialLogin('Google')}
              className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 2.43-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSocialLogin('Apple')}
              className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 384 512" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              Continue with Apple
            </Button>
          </div>

          <div className="text-center space-y-2">
            <Link to="/forgot-password" className="text-sm text-white/70 hover:text-white">
              Forgot your password?
            </Link>
            <p className="text-sm text-white/70">
              Don't have an account?{' '}
              <Link to="/register" className="text-white hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
