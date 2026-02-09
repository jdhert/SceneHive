import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { userService } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AvatarUpload from '../components/user/AvatarUpload'
import UserMenu from '../components/layout/UserMenu'

function ProfileEditPage() {
  const { user, updateUser } = useUser()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [status, setStatus] = useState('ONLINE')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setBio(user.bio || '')
      setJobTitle(user.jobTitle || '')
      setCompany(user.company || '')
      setStatus(user.status || 'ONLINE')
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('이름을 입력하세요')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      // Update profile
      const profileRes = await userService.updateMe({ name, bio, jobTitle, company })
      updateUser(profileRes.data)

      // Update status
      const statusRes = await userService.updateStatus(status)
      updateUser(statusRes.data)

      if (pendingAvatarFile) {
        const avatarRes = await userService.uploadAvatar(pendingAvatarFile)
        updateUser(avatarRes.data)
        setPendingAvatarFile(null)
      }

      setSuccess('프로필이 업데이트되었습니다!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || '업데이트에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarSuccess = (updatedProfile) => {
    updateUser(updatedProfile)
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      {/* Header */}
      <header
        className="border-b border-white/20 px-6 py-4 relative z-40"
        style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-lg">💻</span>
              </div>
              <span className="text-lg font-bold text-white hidden md:inline">DevCollab</span>
            </button>
            <span className="text-white/30">|</span>
            <Button
              variant="ghost"
              onClick={() => navigate('/profile')}
              className="text-white hover:bg-white/20"
            >
              ← 프로필
            </Button>
            <h1 className="text-xl font-bold text-white">프로필 수정</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-6 relative z-50">
        <Card
          className="border-0"
          style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)' }}
        >
          <CardHeader>
            <CardTitle className="text-white text-center">프로필 수정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <AvatarUpload user={user} onUploadSuccess={handleAvatarSuccess} onFileSelected={setPendingAvatarFile} selectedFile={pendingAvatarFile} />

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/80">이름</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white/80">자기소개</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="나를 소개해보세요..."
                  className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm resize-none"
                />
                <p className="text-white/30 text-xs text-right">{bio.length}/500</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-white/80">직책</Label>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="예: Backend Developer"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-white/80">회사</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="예: Tech Corp"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-white/80">상태</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
                >
                  <option value="ONLINE" className="bg-gray-800">온라인</option>
                  <option value="AWAY" className="bg-gray-800">자리비움</option>
                  <option value="BUSY" className="bg-gray-800">바쁨</option>
                  <option value="OFFLINE" className="bg-gray-800">오프라인</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200 text-sm">
                  {success}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white"
                >
                  {isSaving ? '저장 중...' : '저장'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/profile')}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default ProfileEditPage
