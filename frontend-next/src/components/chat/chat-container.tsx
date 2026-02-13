'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { chatService } from '@/services/api';
import { useWebSocket } from '@/hooks/use-web-socket';
import { useAccessToken } from '@/hooks/use-access-token';
import type { ChatMessage, WorkspaceMember } from '@/types';
import MessageList from '@/components/chat/message-list';
import ChatInput from '@/components/chat/chat-input';

interface ChatContainerProps {
  workspaceId: string;
  members: WorkspaceMember[];
}

export default function ChatContainer({ workspaceId, members }: ChatContainerProps) {
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const token = useAccessToken();

  const {
    connected,
    connectionState,
    connectionError,
    messages: wsMessages,
    sendMessage,
    addMessages: _addMessages,
  } = useWebSocket(workspaceId);
  void _addMessages;

  const memberMap = useMemo(() => {
    const map = new Map<number, WorkspaceMember>();
    members.forEach((m) => {
      if (m?.user?.id) {
        map.set(m.user.id, m);
      }
    });
    return map;
  }, [members]);

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError('');
      const response = await chatService.getMessages(parseInt(workspaceId));
      const fetched = Array.isArray(response.data) ? response.data : (response.data as unknown as { content?: ChatMessage[] })?.content || [];
      setInitialMessages(fetched);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('메시지를 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, token]);

  useEffect(() => {
    if (!token) return;
    fetchMessages();
  }, [fetchMessages, token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [initialMessages, wsMessages]);

  const allMessages = [...initialMessages, ...wsMessages];

  const handleSend = (content: string, type: string) => {
    sendMessage(content, type);
  };

  const connectionStatusColor: Record<string, string> = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-400',
    reconnecting: 'bg-yellow-400',
    disconnected: 'bg-red-500',
    error: 'bg-red-500',
    idle: 'bg-gray-500',
    disabled: 'bg-gray-500',
  };

  const connectionStatusLabel: Record<string, string> = {
    connected: '실시간 연결됨',
    connecting: '연결 중...',
    reconnecting: '재연결 중...',
    disconnected: '연결 끊김',
    error: `연결 실패${connectionError ? `: ${connectionError}` : ''}`,
    idle: '대기 중',
    disabled: '연결 비활성',
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="px-4 py-2 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${connectionStatusColor[connectionState]}`}
          />
          <span className="text-white/70">{connectionStatusLabel[connectionState]}</span>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/20 text-red-200 text-sm">
          {error}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-white/60">메시지 로딩 중...</div>
          </div>
        ) : (
          <MessageList messages={allMessages} memberMap={memberMap} />
        )}
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={!connected}
        members={members}
      />
    </div>
  );
}
