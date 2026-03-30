import { cn } from '@/lib/utils';
import Avatar from '@/components/user/avatar';
import type { ChatMessage, WorkspaceMember } from '@/types';

interface MessageItemProps {
  message: ChatMessage;
  showAvatar: boolean;
  member?: WorkspaceMember;
}

function highlightMentions(content: string): React.ReactNode[] {
  const mentionRegex = /@(\S+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={match.index}
        className="text-indigo-100 font-medium bg-white/10 rounded px-0.5"
      >
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessageItem({ message, showAvatar, member }: MessageItemProps) {
  const senderUser = member?.user || message.sender;

  return (
    <div className={cn('flex gap-3', showAvatar ? 'mt-5 pt-1' : 'pl-[52px]')}>
      {showAvatar && (
        <div className="shrink-0 w-10">
          <Avatar
            user={{
              name: senderUser.name,
              profilePictureUrl: senderUser.profilePictureUrl,
              status: senderUser.status,
            }}
            size="md"
            showStatus
          />
        </div>
      )}

      <div className="flex-1 min-w-0 max-w-[900px]">
        {showAvatar && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-sm font-semibold text-white">
              {senderUser.name}
            </span>
            <span className="text-[10px] text-white/40">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}

        <div className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere]">
          {highlightMentions(message.content)}
          {!showAvatar && (
            <span className="ml-2 text-[10px] text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(message.createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
