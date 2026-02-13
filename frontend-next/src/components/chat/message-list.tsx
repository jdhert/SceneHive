import type { ChatMessage, WorkspaceMember } from '@/types';
import MessageItem from '@/components/chat/message-item';

interface MessageListProps {
  messages: ChatMessage[];
  memberMap: Map<number, WorkspaceMember>;
}

export default function MessageList({ messages, memberMap }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 text-white/40 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-sm text-white/70">아직 메시지가 없습니다</p>
        <p className="text-xs text-white/50 mt-1">첫 번째 메시지를 보내보세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showAvatar =
          index === 0 || prevMessage?.sender.id !== message.sender.id;

        return (
          <MessageItem
            key={message.id}
            message={message}
            showAvatar={showAvatar}
            member={memberMap.get(message.sender.id)}
          />
        );
      })}
    </div>
  );
}
