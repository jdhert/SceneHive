import { cn } from '@/lib/utils';
import type { UserStatus } from '@/types';

interface AvatarUser {
  name?: string;
  profilePictureUrl?: string;
  status?: UserStatus;
}

interface AvatarProps {
  user?: AvatarUser | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
}

const sizeClasses: Record<string, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const textSizeClasses: Record<string, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-xl',
  xl: 'text-3xl',
};

const statusSizeClasses: Record<string, string> = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
};

const statusColorMap: Record<string, string> = {
  ONLINE: 'bg-green-500',
  AWAY: 'bg-yellow-500',
  BUSY: 'bg-red-500',
  OFFLINE: 'bg-gray-400',
};

export default function Avatar({ user, size = 'md', showStatus = false }: AvatarProps) {
  const firstLetter = user?.name?.charAt(0).toUpperCase() || '?';
  const status = user?.status || 'OFFLINE';

  return (
    <div className={cn('relative inline-flex shrink-0', sizeClasses[size])}>
      {user?.profilePictureUrl ? (
        <img
          src={user.profilePictureUrl}
          alt={user.name || 'User'}
          className={cn('rounded-full object-cover', sizeClasses[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium',
            sizeClasses[size],
            textSizeClasses[size]
          )}
        >
          {firstLetter}
        </div>
      )}
      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-900',
            statusSizeClasses[size],
            statusColorMap[status]
          )}
        />
      )}
    </div>
  );
}
