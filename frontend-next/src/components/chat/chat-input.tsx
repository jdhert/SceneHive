'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { WorkspaceMember } from '@/types';

interface ChatInputProps {
  onSend: (content: string, type: string) => void;
  disabled?: boolean;
  members: WorkspaceMember[];
}

export default function ChatInput({ onSend, disabled = false, members }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredMembers = mentionQuery !== null
    ? members.filter((m) =>
        m.user.name.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : [];

  const resetMention = useCallback(() => {
    setMentionQuery(null);
    setMentionIndex(0);
    setMentionStartPos(0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);

    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex !== -1) {
      const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n' || atIndex === 0) {
        const query = textBeforeCursor.slice(atIndex + 1);
        if (!query.includes(' ') && !query.includes('\n')) {
          setMentionQuery(query);
          setMentionStartPos(atIndex);
          setMentionIndex(0);
          return;
        }
      }
    }

    resetMention();
  };

  const insertMention = useCallback(
    (member: WorkspaceMember) => {
      const before = content.slice(0, mentionStartPos);
      const after = content.slice(
        textareaRef.current?.selectionStart || mentionStartPos + (mentionQuery?.length || 0) + 1
      );
      const newContent = `${before}@${member.user.name} ${after}`;
      setContent(newContent);
      resetMention();

      setTimeout(() => {
        if (textareaRef.current) {
          const pos = mentionStartPos + member.user.name.length + 2;
          textareaRef.current.selectionStart = pos;
          textareaRef.current.selectionEnd = pos;
          textareaRef.current.focus();
        }
      }, 0);
    },
    [content, mentionStartPos, mentionQuery, resetMention]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(filteredMembers[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        resetMention();
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, 'TEXT');
    setContent('');
    resetMention();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  return (
    <div className="relative border-t border-white/10 bg-white/5 px-4 py-3">
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-1 bg-[#2b2759]/95 border border-white/10 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
          {filteredMembers.map((member, idx) => (
            <button
              key={member.id}
              onClick={() => insertMention(member)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                idx === mentionIndex
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/10'
              }`}
            >
              {member.user.profilePictureUrl ? (
                <img
                  src={member.user.profilePictureUrl}
                  alt={member.user.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-medium">
                  {member.user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span>{member.user.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? '연결 중...' : '메시지를 입력하세요...'}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !content.trim()}
          className="shrink-0 p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
