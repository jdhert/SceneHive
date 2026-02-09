import React from 'react'

const STATUS_CONFIG = {
  ONLINE: { label: '온라인', color: 'bg-green-500', textColor: 'text-green-400' },
  AWAY: { label: '자리비움', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  BUSY: { label: '바쁨', color: 'bg-red-500', textColor: 'text-red-400' },
  OFFLINE: { label: '오프라인', color: 'bg-gray-500', textColor: 'text-gray-400' },
}

function StatusBadge({ status, showLabel = true, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.OFFLINE

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'

  return (
    <div className="flex items-center gap-1.5">
      <span className={`${dotSize} rounded-full ${config.color}`} />
      {showLabel && (
        <span className={`text-xs ${config.textColor}`}>
          {config.label}
        </span>
      )}
    </div>
  )
}

export default StatusBadge
