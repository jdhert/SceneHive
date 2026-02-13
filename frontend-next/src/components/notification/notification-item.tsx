import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const typeIconMap: Record<NotificationType, string> = {
  NEW_CHAT_MESSAGE: '\uD83D\uDCAC',
  MENTION: '\uD83D\uDCE2',
  WORKSPACE_INVITE: '\uD83D\uDCE9',
  WORKSPACE_JOIN: '\uD83D\uDC4B',
  WORKSPACE_LEAVE: '\uD83D\uDEAA',
  SNIPPET_CREATED: '\uD83D\uDCDD',
  MEMO_CREATED: '\uD83D\uDCD3',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return '방금 전';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}주 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  const years = Math.floor(days / 365);
  return `${years}년 전`;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const icon = typeIconMap[notification.type] || '\uD83D\uDD14';

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0',
        !notification.isRead && 'bg-indigo-50/50 dark:bg-indigo-900/10'
      )}
    >
      <span className="text-lg shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm truncate',
              notification.isRead
                ? 'text-gray-700 dark:text-gray-300'
                : 'text-gray-900 dark:text-gray-100 font-semibold'
            )}
          >
            {notification.title}
          </p>
          <button
            onClick={handleDelete}
            className="shrink-0 p-0.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            aria-label="Delete notification"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {notification.message && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
      )}
    </div>
  );
}
