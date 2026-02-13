import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memoService } from '@/services/api';
import type { CreateMemoRequest, UpdateMemoRequest } from '@/types';

export const memoKeys = {
  all: (workspaceId: number) => ['memos', workspaceId] as const,
  detail: (workspaceId: number, id: number) => ['memos', workspaceId, id] as const,
};

export function useMemos(workspaceId: number) {
  return useQuery({
    queryKey: memoKeys.all(workspaceId),
    queryFn: async () => {
      const res = await memoService.getAll(workspaceId);
      return res.data;
    },
    enabled: !!workspaceId,
  });
}

export function useMemo(workspaceId: number, memoId: number) {
  return useQuery({
    queryKey: memoKeys.detail(workspaceId, memoId),
    queryFn: async () => {
      const res = await memoService.getById(workspaceId, memoId);
      return res.data;
    },
    enabled: !!workspaceId && !!memoId,
  });
}

export function useCreateMemo(workspaceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemoRequest) => memoService.create(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoKeys.all(workspaceId) });
    },
  });
}

export function useUpdateMemo(workspaceId: number, memoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMemoRequest) => memoService.update(workspaceId, memoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoKeys.all(workspaceId) });
      queryClient.invalidateQueries({ queryKey: memoKeys.detail(workspaceId, memoId) });
    },
  });
}

export function useDeleteMemo(workspaceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memoId: number) => memoService.delete(workspaceId, memoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoKeys.all(workspaceId) });
    },
  });
}
