'use client';

import { useRef } from 'react';
import { userService } from '@/services/api';
import type { User } from '@/types';

interface AvatarUploadProps {
  user: User;
  onUploadSuccess: (user: User) => void;
  onFileSelected: (file: File | null) => void;
  selectedFile: File | null;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function AvatarUpload({
  user,
  onUploadSuccess,
  onFileSelected,
  selectedFile,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const firstLetter = user.name?.charAt(0).toUpperCase() || '?';
  const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : null;
  const displayUrl = previewUrl || user.profilePictureUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('지원되는 형식: JPEG, PNG, GIF, WebP');
      return;
    }

    if (file.size > MAX_SIZE) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    onFileSelected(file);
  };

  const handleDelete = async () => {
    try {
      await userService.deleteAvatar();
      onUploadSuccess({ ...user, profilePictureUrl: undefined });
      onFileSelected(null);
    } catch (err) {
      console.error('Failed to delete avatar:', err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={user.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-medium border-2 border-gray-200 dark:border-gray-700">
            {firstLetter}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
        >
          사진 변경
        </button>
        {(user.profilePictureUrl || selectedFile) && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
