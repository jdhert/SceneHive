import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { userService } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Avatar from '../components/user/Avatar'
import StatusBadge from '../components/user/StatusBadge'
import UserMenu from '../components/layout/UserMenu'

function ProfilePage() {
  const { userId } = useParams()
  const { user: currentUser } = useUser()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const isOwnProfile = !userId || userId == currentUser?.id

  useEffect(() => {
    if (isOwnProfile) {
      setProfile(currentUser)
      setIsLoading(false)
    } else {
      fetchProfile()
    }
  }, [userId, currentUser])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await userService.getUserById(userId)
      setProfile(response.data)
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
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
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20"
            >
              ← 뒤로
            </Button>
            <h1 className="text-xl font-bold text-white">
              {isOwnProfile ? '내 프로필' : '프로필'}
            </h1>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6 relative z-50">
        <Card
          className="border-0"
          style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)' }}
        >
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <Avatar user={profile} size="xl" showStatus />
                <StatusBadge status={profile?.status} />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-white">{profile?.name}</h2>
                {isOwnProfile && (
                  <p className="text-white/50 text-sm mt-1">{profile?.email}</p>
                )}

                {(profile?.jobTitle || profile?.company) && (
                  <p className="text-white/70 mt-2">
                    {profile?.jobTitle}
                    {profile?.jobTitle && profile?.company && ' @ '}
                    {profile?.company}
                  </p>
                )}

                {profile?.bio && (
                  <p className="text-white/60 mt-4 leading-relaxed">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 mt-6 text-sm text-white/40">
                  <span>
                    가입일: {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                  {profile?.lastSeenAt && (
                    <span>
                      마지막 활동: {new Date(profile.lastSeenAt).toLocaleString('ko-KR')}
                    </span>
                  )}
                </div>

                {isOwnProfile && (
                  <Button
                    onClick={() => navigate('/profile/edit')}
                    className="mt-6 bg-white/20 hover:bg-white/30 text-white"
                  >
                    프로필 수정
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default ProfilePage
