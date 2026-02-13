import { useQuery } from '@tanstack/react-query';
import { chatService } from '@/services/api';

export const chatKeys = {
  messages: (workspaceId: number) => ['chat', workspaceId, 'messages'] as const,
};

export function useChatMessages(workspaceId: number, page = 0, size = 50) {
  return useQuery({
    queryKey: [...chatKeys.messages(workspaceId), page, size],
    queryFn: async () => {
      const res = await chatService.getMessages(workspaceId, page, size);
      return res.data;
    },
    enabled: !!workspaceId,
  });
}
