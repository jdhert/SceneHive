import React from 'react'
import Avatar from '../user/Avatar'

function MessageItem({ message, showAvatar }) {
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      {showAvatar ? (
        <Avatar user={message.sender} size="sm" showStatus />
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {showAvatar && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-medium text-white">
              {message.sender?.name || '알 수 없음'}
            </span>
            <span className="text-xs text-white/40">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}
        <div
          className={`text-white/90 break-words ${
            message.type === 'CODE'
              ? 'font-mono bg-black/30 p-2 rounded text-sm'
              : ''
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}

export default MessageItem
