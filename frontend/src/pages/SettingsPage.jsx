import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { settingsService } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ThemeToggle from '../components/settings/ThemeToggle'
import UserMenu from '../components/layout/UserMenu'

function SettingsPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await settingsService.getSettings()
      setSettings(response.data)
      // Sync theme from server
      if (response.data.theme) {
        setTheme(response.data.theme.toLowerCase())
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme)
    try {
      await settingsService.updateSettings({ theme: newTheme.toUpperCase() })
    } catch (err) {
      console.error('Failed to save theme:', err)
    }
  }

  const handleToggle = async (field) => {
    const newValue = !settings[field]
    setSettings((prev) => ({ ...prev, [field]: newValue }))
    try {
      await settingsService.updateSettings({ [field]: newValue })
    } catch (err) {
      console.error('Failed to update setting:', err)
      setSettings((prev) => ({ ...prev, [field]: !newValue }))
    }
  }

  const handleLanguageChange = async (lang) => {
    setSettings((prev) => ({ ...prev, language: lang }))
    try {
      await settingsService.updateSettings({ language: lang })
    } catch (err) {
      console.error('Failed to save language:', err)
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
        className="border-b border-white/20 px-6 py-4"
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
            <h1 className="text-xl font-bold text-white">설정</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Appearance */}
        <Card
          className="border-0"
          style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)' }}
        >
          <CardHeader>
            <CardTitle className="text-white text-lg">외관</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white/80 text-sm block mb-2">테마</label>
              <ThemeToggle theme={theme} onChange={handleThemeChange} />
            </div>
            <div>
              <label className="text-white/80 text-sm block mb-2">언어</label>
              <select
                value={settings?.language || 'ko'}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
              >
                <option value="ko" className="bg-gray-800">한국어</option>
                <option value="en" className="bg-gray-800">English</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card
          className="border-0"
          style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)' }}
        >
          <CardHeader>
            <CardTitle className="text-white text-lg">알림</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleItem
              label="이메일 알림"
              description="중요 업데이트를 이메일로 받습니다"
              checked={settings?.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
            />
            <ToggleItem
              label="푸시 알림"
              description="브라우저 푸시 알림을 받습니다"
              checked={settings?.pushNotifications}
              onChange={() => handleToggle('pushNotifications')}
            />
            <ToggleItem
              label="멘션 알림"
              description="@멘션 시 알림을 받습니다"
              checked={settings?.mentionNotifications}
              onChange={() => handleToggle('mentionNotifications')}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function ToggleItem({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white text-sm">{label}</p>
        <p className="text-white/40 text-xs">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors relative ${
          checked ? 'bg-purple-500' : 'bg-white/20'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

export default SettingsPage
