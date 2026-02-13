import type { Notification } from '@/types';
import NotificationItem from '@/components/notification/notification-item';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
  onClose?: () => void;
}

export default function NotificationPanel({
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onDelete,
  onClose: _onClose,
}: NotificationPanelProps) {
  void _onClose;
  return (
    <div className="w-80 sm:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          알림
        </h3>
        <button
          onClick={onMarkAllAsRead}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
        >
          모두 읽음
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              알림이 없습니다
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
