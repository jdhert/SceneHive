import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/api';
import type { UpdateProfileRequest } from '@/types';

export const userKeys = {
  me: ['user', 'me'] as const,
  detail: (id: number) => ['user', id] as const,
};

export function useMe() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: async () => {
      const res = await userService.getMe();
      return res.data;
    },
  });
}

export function useUserById(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const res = await userService.getUserById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => userService.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => userService.deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me });
    },
  });
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => userService.updateStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me });
    },
  });
}
