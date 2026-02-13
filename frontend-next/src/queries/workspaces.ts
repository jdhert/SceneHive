import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '@/services/api';
import type { CreateWorkspaceRequest, UpdateWorkspaceRequest } from '@/types';

export const workspaceKeys = {
  all: ['workspaces'] as const,
  detail: (id: number) => ['workspaces', id] as const,
  members: (id: number) => ['workspaces', id, 'members'] as const,
};

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: async () => {
      const res = await workspaceService.getAll();
      return res.data;
    },
  });
}

export function useWorkspace(id: number) {
  return useQuery({
    queryKey: workspaceKeys.detail(id),
    queryFn: async () => {
      const res = await workspaceService.getById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useWorkspaceMembers(workspaceId: number) {
  return useQuery({
    queryKey: workspaceKeys.members(workspaceId),
    queryFn: async () => {
      const res = await workspaceService.getMembers(workspaceId);
      return res.data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkspaceRequest) => workspaceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export function useUpdateWorkspace(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateWorkspaceRequest) => workspaceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => workspaceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export function useJoinWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => workspaceService.join(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export function useLeaveWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: number) => workspaceService.leave(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export function useRegenerateInvite(workspaceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => workspaceService.regenerateInvite(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId) });
    },
  });
}

export function useRemoveMember(workspaceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => workspaceService.removeMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
    },
  });
}
