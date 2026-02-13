'use client';

import { useState, useEffect, useCallback } from 'react';
import { snippetService, userService } from '@/services/api';
import type { CodeSnippet, CreateSnippetRequest, UpdateSnippetRequest } from '@/types';
import SnippetList from '@/components/snippet/snippet-list';
import SnippetEditor from '@/components/snippet/snippet-editor';
import SnippetViewer from '@/components/snippet/snippet-viewer';

interface SnippetContainerProps {
  workspaceId: string;
}

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export function SnippetContainer({ workspaceId }: SnippetContainerProps) {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const wid = parseInt(workspaceId);

  const fetchSnippets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await snippetService.getAll(wid);
      setSnippets(response.data);
    } catch (err) {
      console.error('Failed to fetch snippets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [wid]);

  useEffect(() => {
    fetchSnippets();
    userService.getMe().then((res) => {
      setCurrentUserId(res.data.id);
    });
  }, [fetchSnippets]);

  const handleView = async (snippet: CodeSnippet) => {
    try {
      const response = await snippetService.getById(wid, snippet.id);
      setSelectedSnippet(response.data);
      setViewMode('view');
    } catch (err) {
      console.error('Failed to fetch snippet:', err);
    }
  };

  const handleEdit = (snippet: CodeSnippet) => {
    setSelectedSnippet(snippet);
    setViewMode('edit');
  };

  const handleDelete = async (snippet: CodeSnippet) => {
    if (!confirm('스니펫을 삭제하시겠습니까?')) return;
    try {
      await snippetService.delete(wid, snippet.id);
      setSnippets((prev) => prev.filter((s) => s.id !== snippet.id));
      if (viewMode === 'view' || viewMode === 'edit') {
        setViewMode('list');
        setSelectedSnippet(null);
      }
    } catch (err) {
      console.error('Failed to delete snippet:', err);
    }
  };

  const handleSave = async (data: CreateSnippetRequest | UpdateSnippetRequest) => {
    try {
      if (viewMode === 'edit' && selectedSnippet) {
        const response = await snippetService.update(wid, selectedSnippet.id, data as UpdateSnippetRequest);
        setSnippets((prev) =>
          prev.map((s) => (s.id === selectedSnippet.id ? response.data : s))
        );
        setSelectedSnippet(response.data);
      } else {
        const response = await snippetService.create(wid, data as CreateSnippetRequest);
        setSnippets((prev) => [response.data, ...prev]);
      }
      setViewMode('list');
      setSelectedSnippet(null);
    } catch (err) {
      console.error('Failed to save snippet:', err);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedSnippet(null);
  };

  if (isLoading) {
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
              코드 스니펫
              {snippets.length > 0 && (
                <span className="ml-2 text-sm text-gray-500">({snippets.length})</span>
              )}
            </h2>
            <button
              onClick={() => {
                setSelectedSnippet(null);
                setViewMode('create');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + 새 스니펫
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <SnippetList
              snippets={snippets}
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
          <SnippetEditor
            snippet={viewMode === 'edit' ? selectedSnippet || undefined : undefined}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}

      {viewMode === 'view' && selectedSnippet && (
        <div className="flex-1 overflow-y-auto min-h-0 bg-white/95 rounded-2xl p-5 text-gray-900 shadow-sm">
          <SnippetViewer
            snippet={selectedSnippet}
            onEdit={() => handleEdit(selectedSnippet)}
            onDelete={() => handleDelete(selectedSnippet)}
            onBack={() => {
              setViewMode('list');
              setSelectedSnippet(null);
            }}
            isAuthor={selectedSnippet.author.id === currentUserId}
          />
        </div>
      )}
    </div>
  );
}
