import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Avatar from '../user/Avatar'

function ChatInput({ onSend, disabled, members = [] }) {
  const [message, setMessage] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState(-1)
  const textareaRef = useRef(null)

  const filteredMembers = members.filter((m) =>
    m.user?.name?.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  const handleChange = (e) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    setMessage(value)

    const textBeforeCursor = value.substring(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex !== -1) {
      const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' '
      const textAfterAt = textBeforeCursor.substring(atIndex + 1)

      if ((charBeforeAt === ' ' || charBeforeAt === '\n' || atIndex === 0) && !textAfterAt.includes(' ')) {
        setShowMentions(true)
        setMentionQuery(textAfterAt)
        setMentionStart(atIndex)
        setMentionIndex(0)
        return
      }
    }

    setShowMentions(false)
  }

  const insertMention = (member) => {
    const name = member.user?.name
    if (!name || mentionStart === -1) return

    const before = message.substring(0, mentionStart)
    const cursorPos = textareaRef.current?.selectionStart || (mentionStart + mentionQuery.length + 1)
    const after = message.substring(cursorPos)
    const newMessage = `${before}@${name} ${after}`
    setMessage(newMessage)
    setShowMentions(false)
    setMentionStart(-1)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex((prev) => (prev + 1) % filteredMembers.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(filteredMembers[mentionIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowMentions(false)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message)
      setMessage('')
      setShowMentions(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-white/10 relative"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      {showMentions && filteredMembers.length > 0 && (
        <div
          className="absolute bottom-full left-4 right-4 mb-1 max-h-48 overflow-y-auto rounded-lg border border-white/10"
          style={{ background: 'rgba(30, 30, 50, 0.95)', backdropFilter: 'blur(20px)' }}
        >
          {filteredMembers.map((member, idx) => (
            <button
              key={member.user?.id || idx}
              type="button"
              onClick={() => insertMention(member)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                idx === mentionIndex ? 'bg-indigo-500/30' : 'hover:bg-white/10'
              }`}
            >
              <Avatar user={member.user} size="xs" />
              <span className="text-sm text-white">{member.user?.name}</span>
              <span className="text-xs text-white/40 ml-auto">{member.role}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? '연결 중...' : '메시지를 입력하세요... (@로 멘션)'}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        />
        <Button
          type="submit"
          disabled={disabled || !message.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
        >
          전송
        </Button>
      </div>
      <div className="mt-2 text-xs text-white/40">
        Enter로 전송, Shift+Enter로 줄바꿈
      </div>
    </form>
  )
}

export default ChatInput
