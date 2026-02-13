import React from 'react'
import Avatar from '../user/Avatar'

const TYPE_CONFIG = {
  chat: { icon: '\uD83D\uDCAC', label: '\uCC44\uD305' },
  snippet: { icon: '\uD83D\uDCDD', label: '\uC2A4\uB2C8\uD3AB' },
  memo: { icon: '\uD83D\uDCC4', label: '\uBA54\uBAA8' },
}

function highlightKeyword(text, keyword) {
  if (!text || !keyword) return text
  const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

function formatTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDay = Math.floor(diffMs / 86400000)
  if (diffDay === 0) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDay < 7) return `${diffDay}\uC77C \uC804`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function SearchResultItem({ result, type, keyword, onClick }) {
  const config = TYPE_CONFIG[type]
  const user = type === 'chat' ? result.sender : result.author
  const title =
    type === 'chat'
      ? result.content
      : type === 'snippet'
        ? result.title
        : result.title
  const subtitle =
    type === 'snippet'
      ? result.language
      : type === 'memo'
        ? result.content?.substring(0, 80)
        : null
  const time = result.createdAt || result.updatedAt

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 flex items-start gap-3"
    >
      <span className="text-lg mt-0.5 shrink-0">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/50">
            {config.label}
          </span>
          {user && (
            <div className="flex items-center gap-1">
              <Avatar user={user} size="xs" />
              <span className="text-xs text-white/50">{user.name}</span>
            </div>
          )}
          {time && <span className="text-xs text-white/30 ml-auto shrink-0">{formatTime(time)}</span>}
        </div>
        <p className="text-sm text-white/90 truncate">
          {highlightKeyword(title, keyword)}
        </p>
        {subtitle && (
          <p className="text-xs text-white/40 truncate mt-0.5">
            {type === 'snippet' ? subtitle : highlightKeyword(subtitle, keyword)}
          </p>
        )}
      </div>
    </button>
  )
}

export default SearchResultItem
