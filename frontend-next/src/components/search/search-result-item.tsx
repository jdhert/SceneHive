'use client';

import React from 'react';
import Avatar from '@/components/user/avatar';

interface SearchResultItemProps {
  result: {
    type: string;
    id: string;
    title?: string;
    content: string;
    author?: string;
    language?: string;
    createdAt?: string;
  };
  keyword: string;
  onClick: () => void;
}

const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
  CHAT: { icon: '💬', label: '채팅', color: 'bg-blue-500/20 text-blue-300' },
  SNIPPET: { icon: '🧩', label: '스니펫', color: 'bg-green-500/20 text-green-300' },
  MEMO: { icon: '📝', label: '메모', color: 'bg-yellow-500/20 text-yellow-300' },
};

function highlightKeyword(text: string, keyword: string) {
  if (!keyword || keyword.length < 2) return text;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-400/40 text-yellow-100 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function SearchResultItem({ result, keyword, onClick }: SearchResultItemProps) {
  const config = typeConfig[result.type] || typeConfig.CHAT;
  const preview = result.content?.length > 150 ? result.content.slice(0, 150) + '...' : result.content;

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-lg cursor-pointer transition-colors hover:bg-white/10"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.color}`}>
            {config.icon} {config.label}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          {result.title && (
            <p className="text-white font-medium text-sm mb-1 truncate">
              {highlightKeyword(result.title, keyword)}
            </p>
          )}
          <p className="text-white/60 text-xs leading-relaxed">
            {highlightKeyword(preview, keyword)}
          </p>
          {result.language && (
            <span className="text-white/40 text-xs mt-1 inline-block">{result.language}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 ml-16">
        {result.author && (
          <>
            <Avatar user={{ name: result.author }} size="xs" />
            <span className="text-white/40 text-xs">{result.author}</span>
          </>
        )}
        {result.createdAt && (
          <span className="text-white/30 text-xs">
            {new Date(result.createdAt).toLocaleDateString('ko-KR')}
          </span>
        )}
      </div>
    </div>
  );
}
