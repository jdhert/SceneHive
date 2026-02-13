'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useUser } from '@/providers/user-provider';
import Avatar from '@/components/user/avatar';
import StatusBadge from '@/components/user/status-badge';

export default function UserMenu() {
  const { user, logout } = useUser();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  if (!user) return null;

  const getDropdownPosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0 };
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 240;
    const padding = 8;
    const left = Math.min(
      window.innerWidth - menuWidth - padding,
      Math.max(padding, rect.right - menuWidth)
    );

    return {
      top: rect.bottom + 8,
      left,
    };
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  const position = getDropdownPosition();

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Avatar user={user} size="sm" showStatus />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">
          {user.name}
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-50 w-60 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
            style={{ top: position.top, left: position.left }}
          >
            <div className="px-4 py-3 flex items-center gap-3">
              <Avatar user={user} size="md" showStatus />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="px-4 pb-3">
              <StatusBadge status={user.status} showLabel />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700" />

            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                내 프로필
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                설정
              </Link>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700" />

            <div className="py-1">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
