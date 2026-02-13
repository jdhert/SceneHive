'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        className="w-full max-w-md relative z-10 border-0"
        style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(40px)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.3)',
        }}
      >
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-white">Reset Password</CardTitle>
          <CardDescription className="text-white/70">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {success ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-md bg-green-500/20 text-green-100">
                <p className="font-medium">Email Sent!</p>
                <p className="text-sm mt-2">
                  If an account exists with that email, you will receive a password reset link
                  shortly.
                </p>
              </div>
              <Link href="/login">
                <Button className="w-full font-bold py-5 bg-indigo-900 hover:bg-indigo-800 text-white">
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-md bg-red-500/20 text-red-100 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <Button
                  type="submit"
                  className="w-full font-bold py-5 bg-indigo-900 hover:bg-indigo-800 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>

              <div className="text-center">
                <Link href="/login" className="text-sm text-white/70 hover:text-white">
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
