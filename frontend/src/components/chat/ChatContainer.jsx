import React, { useState, useEffect, useRef, useMemo } from 'react'
import { chatService } from '../../services/api'
import { useWebSocket } from '../../hooks/useWebSocket'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

function ChatContainer({ workspaceId, members = [] }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  const { connected, connectionState, connectionError, messages, sendMessage, addMessages } =
    useWebSocket(workspaceId)

  const safeMembers = Array.isArray(members) ? members : []
  const memberMap = useMemo(() => {
    const map = new Map()
    safeMembers.forEach((member) => {
      if (member?.user?.id) {
        map.set(member.user.id, member.user)
      }
    })
    return map
  }, [safeMembers])

  useEffect(() => {
    loadMessages()
  }, [workspaceId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await chatService.getMessages(workspaceId)
      addMessages(response.data)
    } catch (err) {
      setError('메시지를 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (content) => {
    if (content.trim()) {
      sendMessage(content)
    }
  }

  const statusConfig = {
    connected: { color: 'bg-green-500', text: '실시간 연결됨' },
    connecting: { color: 'bg-yellow-400', text: '연결 중...' },
    reconnecting: { color: 'bg-yellow-400', text: '재연결 중...' },
    disconnected: { color: 'bg-red-500', text: '연결 끊김' },
    error: { color: 'bg-red-500', text: `연결 실패${connectionError ? `: ${connectionError}` : ''}` },
    disabled: { color: 'bg-gray-500', text: '연결 비활성' },
    idle: { color: 'bg-gray-500', text: '대기 중' },
  }

  const status = statusConfig[connectionState] || statusConfig.idle

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white/60">메시지 로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${status.color}`} />
          <span className="text-white/60">{status.text}</span>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/20 text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} memberMap={memberMap} />
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSendMessage} disabled={!connected} members={safeMembers} />
    </div>
  )
}

export default ChatContainer
