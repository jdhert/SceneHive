'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { searchService } from '@/services/api';
import { cn } from '@/lib/utils';
import type { SearchResponse, SearchType, ChatMessage, CodeSnippet, Memo } from '@/types';
import SearchResultItem from '@/components/search/search-result-item';

interface SearchContainerProps {
  workspaceId: string;
  onNavigate: (tab: string) => void;
}

const TYPE_TABS: { label: string; value: SearchType }[] = [
  { label: '전체', value: 'ALL' },
  { label: '채팅', value: 'CHAT' },
  { label: '스니펫', value: 'SNIPPET' },
  { label: '메모', value: 'MEMO' },
];

interface NormalizedResult {
  id: string;
  type: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

function normalizeResults(data: SearchResponse): NormalizedResult[] {
  const results: NormalizedResult[] = [];

  data.messages.forEach((msg: ChatMessage) => {
    results.push({
      id: `chat-${msg.id}`,
      type: 'CHAT',
      title: `${msg.sender.name}의 메시지`,
      content: msg.content,
      author: msg.sender.name,
      createdAt: msg.createdAt,
    });
  });

  data.snippets.forEach((snippet: CodeSnippet) => {
    results.push({
      id: `snippet-${snippet.id}`,
      type: 'SNIPPET',
      title: snippet.title,
      content: snippet.description || snippet.code.slice(0, 200),
      author: snippet.author.name,
      createdAt: snippet.createdAt,
    });
  });

  data.memos.forEach((memo: Memo) => {
    results.push({
      id: `memo-${memo.id}`,
      type: 'MEMO',
      title: memo.title,
      content: memo.content.slice(0, 200),
      author: memo.author.name,
      createdAt: memo.createdAt,
    });
  });

  return results;
}

export default function SearchContainer({ workspaceId, onNavigate }: SearchContainerProps) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<SearchType>('ALL');
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(
    async (searchQuery: string, searchType: SearchType) => {
      if (searchQuery.length < 2) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasSearched(true);
        const response = await searchService.search(
          parseInt(workspaceId),
          searchQuery,
          searchType
        );
        setResults(normalizeResults(response.data));
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceId]
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      doSearch(query, type);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, type, doSearch]);

  const handleResultClick = (result: NormalizedResult) => {
    const tabMap: Record<string, string> = {
      CHAT: 'chat',
      SNIPPET: 'snippets',
      MEMO: 'memos',
    };
    onNavigate(tabMap[result.type] || 'chat');
  };

  const groupedResults: Record<string, NormalizedResult[]> = {};
  results.forEach((r) => {
    if (!groupedResults[r.type]) {
      groupedResults[r.type] = [];
    }
    groupedResults[r.type].push(r);
  });

  const typeLabels: Record<string, string> = {
    CHAT: '채팅',
    SNIPPET: '스니펫',
    MEMO: '메모',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색어를 입력하세요 (최소 2자)..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-1 mb-4">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setType(tab.value)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              type === tab.value
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-12">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              검색어를 입력하세요
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              검색 결과가 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedResults).map(([groupType, items]) => (
              <div key={groupType}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {typeLabels[groupType] || groupType} ({items.length})
                </h3>
                <div className="space-y-1">
                  {items.map((result) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      keyword={query}
                      onClick={() => handleResultClick(result)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
