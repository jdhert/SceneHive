'use client';

import { useState, useEffect, useCallback } from 'react';
import { memoService, userService } from '@/services/api';
import type { Memo, CreateMemoRequest, UpdateMemoRequest } from '@/types';
import MemoList from '@/components/memo/memo-list';
import MemoEditor from '@/components/memo/memo-editor';
import MemoViewer from '@/components/memo/memo-viewer';

interface MemoContainerProps {
  workspaceId: string;
}

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export function MemoContainer({ workspaceId }: MemoContainerProps) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  const wid = parseInt(workspaceId);

  const fetchMemos = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await memoService.getAll(wid);
      setMemos(response.data);
    } catch (err) {
      console.error('Failed to fetch memos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [wid]);

  const handleSearch = useCallback(
    async (keyword: string) => {
      if (!keyword.trim()) {
        fetchMemos();
        return;
      }
      try {
        setIsLoading(true);
        const response = await memoService.search(wid, keyword);
        setMemos(response.data);
      } catch (err) {
        console.error('Failed to search memos:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [wid, fetchMemos]
  );

  useEffect(() => {
    fetchMemos();
    userService.getMe().then((res) => {
      setCurrentUserId(res.data.id);
    });
  }, [fetchMemos]);

  const handleView = async (memo: Memo) => {
    try {
      const response = await memoService.getById(wid, memo.id);
      setSelectedMemo(response.data);
      setViewMode('view');
    } catch (err) {
      console.error('Failed to fetch memo:', err);
    }
  };

  const handleEdit = (memo: Memo) => {
    setSelectedMemo(memo);
    setViewMode('edit');
  };

  const handleDelete = async (memo: Memo) => {
    if (!confirm('메모를 삭제하시겠습니까?')) return;
    try {
      await memoService.delete(wid, memo.id);
      setMemos((prev) => prev.filter((m) => m.id !== memo.id));
      if (viewMode === 'view' || viewMode === 'edit') {
        setViewMode('list');
        setSelectedMemo(null);
      }
    } catch (err) {
      console.error('Failed to delete memo:', err);
    }
  };

  const handleSave = async (data: CreateMemoRequest | UpdateMemoRequest) => {
    try {
      if (viewMode === 'edit' && selectedMemo) {
        const response = await memoService.update(wid, selectedMemo.id, data as UpdateMemoRequest);
        setMemos((prev) =>
          prev.map((m) => (m.id === selectedMemo.id ? response.data : m))
        );
        setSelectedMemo(response.data);
      } else {
        const response = await memoService.create(wid, data as CreateMemoRequest);
        setMemos((prev) => [response.data, ...prev]);
      }
      setViewMode('list');
      setSelectedMemo(null);
    } catch (err) {
      console.error('Failed to save memo:', err);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedMemo(null);
  };

  if (isLoading && viewMode === 'list') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-2 text-white/60">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {viewMode === 'list' && (
        <div className="flex flex-col h-full min-h-0 bg-white/95 rounded-2xl p-5 text-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              메모
            </h2>
            <button
              onClick={() => {
                setSelectedMemo(null);
                setViewMode('create');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              새 메모
            </button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="메모 검색..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <MemoList
              memos={memos}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="flex-1 overflow-y-auto min-h-0 bg-white/95 rounded-2xl p-5 text-gray-900 shadow-sm">
          <MemoEditor
            memo={viewMode === 'edit' ? selectedMemo || undefined : undefined}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}

      {viewMode === 'view' && selectedMemo && (
        <div className="flex-1 overflow-y-auto min-h-0 bg-white/95 rounded-2xl p-5 text-gray-900 shadow-sm">
          <MemoViewer
            memo={selectedMemo}
            onEdit={() => handleEdit(selectedMemo)}
            onDelete={() => handleDelete(selectedMemo)}
            onBack={() => {
              setViewMode('list');
              setSelectedMemo(null);
            }}
            isAuthor={selectedMemo.author.id === currentUserId}
          />
        </div>
      )}
    </div>
  );
}
