import React from 'react'
import { useNavigate } from 'react-router-dom'

const TYPE_ICONS = {
  NEW_CHAT_MESSAGE: '\uD83D\uDCAC',
  MENTION: '@',
  WORKSPACE_INVITE: '\uD83D\uDCE8',
  MEMBER_JOINED: '\uD83D\uDC4B',
  MEMO_UPDATED: '\uD83D\uDCDD',
  SNIPPET_SHARED: '\uD83D\uDCC4',
}

function getTimeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '방금'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`
  return date.toLocaleDateString()
}

function NotificationItem({ notification, onMarkAsRead, onDelete, onClose }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    if (notification.relatedUrl) {
      navigate(notification.relatedUrl)
      onClose()
    }
  }

  const timeAgo = getTimeAgo(notification.createdAt)

  return (
    <div
      onClick={handleClick}
      className={`px-4 py-3 border-b border-white/5 cursor-pointer
                  hover:bg-white/5 transition-colors flex items-start gap-3
                  ${!notification.isRead ? 'bg-indigo-500/10' : ''}`}
    >
      <span className="text-lg mt-0.5 shrink-0">
        {TYPE_ICONS[notification.type] || '\uD83D\uDD14'}
      </span>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${
          notification.isRead ? 'text-white/60' : 'text-white'
        }`}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-white/40 mt-0.5 truncate">
            {notification.message}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-white/30">{timeAgo}</span>
          {notification.workspaceName && (
            <span className="text-xs text-white/20">
              {notification.workspaceName}
            </span>
          )}
        </div>
      </div>

      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
      )}
    </div>
  )
}

export default NotificationItem
