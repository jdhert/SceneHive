import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { snippetService } from '@/services/api';
import type { CreateSnippetRequest, UpdateSnippetRequest } from '@/types';

export const snippetKeys = {
  all: (workspaceId: number) => ['snippets', workspaceId] as const,
  detail: (workspaceId: number, id: number) => ['snippets', workspaceId, id] as const,
};

export function useSnippets(workspaceId: number) {
  return useQuery({
    queryKey: snippetKeys.all(workspaceId),
    queryFn: async () => {
      const res = await snippetService.getAll(workspaceId);
      return res.data;
    },
    enabled: !!workspaceId,
  });
}

export function useSnippet(workspaceId: number, snippetId: number) {
  return useQuery({
    queryKey: snippetKeys.detail(workspaceId, snippetId),
    queryFn: async () => {
      const res = await snippetService.getById(workspaceId, snippetId);
      return res.data;
    },
    enabled: !!workspaceId && !!snippetId,
  });
}

export function useCreateSnippet(workspaceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSnippetRequest) => snippetService.create(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: snippetKeys.all(workspaceId) });
    },
  });
}

export function useUpdateSnippet(workspaceId: number, snippetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSnippetRequest) => snippetService.update(workspaceId, snippetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: snippetKeys.all(workspaceId) });
      queryClient.invalidateQueries({ queryKey: snippetKeys.detail(workspaceId, snippetId) });
    },
  });
}

export function useDeleteSnippet(workspaceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (snippetId: number) => snippetService.delete(workspaceId, snippetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: snippetKeys.all(workspaceId) });
    },
  });
}
