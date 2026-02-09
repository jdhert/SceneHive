import React from 'react'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8081'

const STATUS_COLORS = {
  ONLINE: 'bg-green-500',
  AWAY: 'bg-yellow-500',
  BUSY: 'bg-red-500',
  OFFLINE: 'bg-gray-500',
}

function Avatar({ user, size = 'md', showStatus = false, className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  }

  const statusSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  }

  const name = user?.name || '?'
  const initial = name.charAt(0).toUpperCase()
  const profilePic = user?.profilePictureUrl
  const status = user?.status

  const imgSrc = profilePic
    ? (profilePic.startsWith('http') ? profilePic : `${API_BASE}${profilePic}`)
    : null

  return (
    <div className={`relative inline-flex ${className}`}>
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-medium`}
        >
          {initial}
        </div>
      )}
      {showStatus && status && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizes[size]} ${STATUS_COLORS[status] || STATUS_COLORS.OFFLINE} rounded-full border-2 border-white dark:border-gray-800`}
        />
      )}
    </div>
  )
}

export default Avatar
