import React from 'react'
import NotificationItem from './NotificationItem'

const NotificationPanel = React.forwardRef(function NotificationPanel(
  { notifications, isLoading, onMarkAsRead, onMarkAllAsRead, onDelete, onClose, style },
  ref
) {
  return (
    <div
      ref={ref}
      className="w-96 max-h-[480px] rounded-xl overflow-hidden flex flex-col z-[9999]"
      style={{
        ...style,
        background: 'rgba(30, 30, 50, 0.95)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-white font-medium text-sm">알림</h3>
        <button
          onClick={onMarkAllAsRead}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          모두 읽음
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-white/50 text-sm">로딩 중...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-white/40 text-sm">알림이 없습니다</div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
              onClose={onClose}
            />
          ))
        )}
      </div>
    </div>
  )
})

export default NotificationPanel
