import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-white/10"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? '연결 중...' : '메시지를 입력하세요...'}
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
