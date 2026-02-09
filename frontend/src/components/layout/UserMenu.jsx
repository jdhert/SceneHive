import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import Avatar from '../user/Avatar'
import StatusBadge from '../user/StatusBadge'

function UserMenu() {
  const { user, logout } = useUser()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) {
        return
      }
      if (buttonRef.current && buttonRef.current.contains(e.target)) {
        return
      }
      if (isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return
    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = 256
      const padding = 8
      const left = Math.min(
        window.innerWidth - menuWidth - padding,
        Math.max(padding, rect.right - menuWidth)
      )
      const top = rect.bottom + 8
      setMenuPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  if (!user) return null

  return (
    <div className="relative z-[9999]">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Avatar user={user} size="sm" showStatus />
        <span className="text-white text-sm hidden md:inline">{user.name}</span>
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed w-64 rounded-xl overflow-hidden z-[9999]"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            background: 'rgba(30, 30, 50, 0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Profile Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Avatar user={user} size="md" showStatus />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user.name}</p>
                <p className="text-white/50 text-xs truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-2">
              <StatusBadge status={user.status} />
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => { navigate('/profile'); setIsOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-white/80 hover:bg-white/10 transition-colors text-sm"
            >
              내 프로필
            </button>
            <button
              onClick={() => { navigate('/settings'); setIsOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-white/80 hover:bg-white/10 transition-colors text-sm"
            >
              설정
            </button>
          </div>

          <div className="border-t border-white/10 py-1">
            <button
              onClick={() => { logout(); setIsOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-400/10 transition-colors text-sm"
            >
              로그아웃
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default UserMenu
