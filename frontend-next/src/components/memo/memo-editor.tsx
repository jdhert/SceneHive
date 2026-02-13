'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Memo, CreateMemoRequest, UpdateMemoRequest } from '@/types';
import MarkdownPreview from '@/components/memo/markdown-preview';

interface MemoEditorProps {
  memo?: Memo;
  onSave: (data: CreateMemoRequest | UpdateMemoRequest) => void;
  onCancel: () => void;
  autoSave?: boolean;
}

export default function MemoEditor({ memo, onSave, onCancel, autoSave = false }: MemoEditorProps) {
  const [title, setTitle] = useState(memo?.title || '');
  const [content, setContent] = useState(memo?.content || '');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutoSave = useCallback(() => {
    if (!autoSave || !title.trim() || !content.trim()) return;

    setIsSaving(true);
    onSave({
      title: title.trim(),
      content: content.trim(),
    });

    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 500);
  }, [autoSave, title, content, onSave]);

  useEffect(() => {
    if (!autoSave) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      triggerAutoSave();
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content, autoSave, triggerAutoSave]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onSave({
      title: title.trim(),
      content: content.trim(),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {memo ? '메모 수정' : '새 메모'}
        </h2>
        {autoSave && (
          <div className="text-xs text-gray-400">
            {isSaving && 'Saving...'}
            {!isSaving && lastSaved && (
              <span>
                마지막 저장:{' '}
                {lastSaved.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="메모 제목"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <div className="flex items-center gap-1 mb-2">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                activeTab === 'edit'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              편집
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                activeTab === 'preview'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              미리보기
            </button>
          </div>

          {activeTab === 'edit' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="마크다운으로 작성하세요..."
              rows={16}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
            />
          ) : (
            <div className="min-h-[384px] px-4 py-3 rounded-lg border border-gray-300 bg-white">
              {content ? (
                <MarkdownPreview content={content} />
              ) : (
                <p className="text-sm text-gray-400">
                  미리보기할 내용이 없습니다
                </p>
              )}
            </div>
          )}
        </div>

        {!autoSave && (
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {memo ? '수정' : '생성'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          </div>
        )}
      </form>
    </div>
  );
}
