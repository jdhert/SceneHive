import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import { hashPassword } from '../lib/crypto'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      const hashedPassword = await hashPassword(password)
      await authService.resetPassword(token, hashedPassword)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may be expired.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
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
          <CardContent className="pt-6 text-center space-y-4">
            <div className="p-4 rounded-md bg-red-500/20 text-red-100">
              <p className="font-medium">Invalid Reset Link</p>
              <p className="text-sm mt-2">
                This password reset link is invalid or has expired.
              </p>
            </div>
            <Link to="/forgot-password">
              <Button className="w-full font-bold py-5 bg-indigo-900 hover:bg-indigo-800 text-white">
                Request New Link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <CardTitle className="text-3xl font-bold text-white">Set New Password</CardTitle>
          <CardDescription className="text-white/70">
            Enter your new password below
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {success ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-md bg-green-500/20 text-green-100">
                <p className="font-medium">Password Reset Successful!</p>
                <p className="text-sm mt-2">
                  Your password has been changed. Redirecting to login...
                </p>
              </div>
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
                  <Label htmlFor="password" className="text-sm font-medium text-white">
                    New Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-white/40 bg-white/10 placeholder:text-white/50 text-white focus:ring-2 focus:ring-white/50"
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-white">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-white/40 bg-white/10 placeholder:text-white/50 text-white focus:ring-2 focus:ring-white/50"
                    required
                    minLength={8}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold py-5 bg-indigo-900 hover:bg-indigo-800 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>

              <div className="text-center">
                <Link to="/login" className="text-sm text-white/70 hover:text-white">
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetPassword
