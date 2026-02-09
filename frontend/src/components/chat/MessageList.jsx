import React from 'react'
import MessageItem from './MessageItem'

function MessageList({ messages, memberMap }) {
  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-white/40">
          <p className="text-4xl mb-4">💬</p>
          <p>아직 메시지가 없습니다.</p>
          <p className="text-sm mt-1">첫 메시지를 보내보세요!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const senderId = message.sender?.id
        const liveSender = senderId ? memberMap?.get(senderId) : null
        const displayMessage = liveSender ? { ...message, sender: liveSender } : message

        return (
          <MessageItem
            key={message.id || index}
            message={displayMessage}
            showAvatar={
              index === 0 ||
              messages[index - 1]?.sender?.id !== message.sender?.id
            }
          />
        )
      })}
    </div>
  )
}

export default MessageList
