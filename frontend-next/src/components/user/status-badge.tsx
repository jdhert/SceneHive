import { cn } from '@/lib/utils';
import type { UserStatus } from '@/types';

interface StatusBadgeProps {
  status?: UserStatus;
  size?: 'sm' | 'lg';
  showLabel?: boolean;
}

const dotSizeClasses: Record<string, string> = {
  sm: 'w-2 h-2',
  lg: 'w-3 h-3',
};

const statusColorMap: Record<string, string> = {
  ONLINE: 'bg-green-500',
  AWAY: 'bg-yellow-500',
  BUSY: 'bg-red-500',
  OFFLINE: 'bg-gray-400',
};

const statusLabelMap: Record<string, string> = {
  ONLINE: '온라인',
  AWAY: '자리 비움',
  BUSY: '방해 금지',
  OFFLINE: '오프라인',
};

export default function StatusBadge({ status = 'OFFLINE', size = 'sm', showLabel = false }: StatusBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'rounded-full shrink-0',
          dotSizeClasses[size],
          statusColorMap[status]
        )}
      />
      {showLabel && (
        <span
          className={cn(
            'text-gray-600 dark:text-gray-400',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
        >
          {statusLabelMap[status]}
        </span>
      )}
    </div>
  );
}
