import { useQuery } from '@tanstack/react-query';
import { favoriteService } from '@/services/api';
import type { FavoriteTargetType } from '@/types';

export const favoritesKeys = {
  all: ['favorites'] as const,
  list: (type?: FavoriteTargetType) => [...favoritesKeys.all, type ?? 'ALL'] as const,
};

export function useFavorites(type?: FavoriteTargetType) {
  return useQuery({
    queryKey: favoritesKeys.list(type),
    queryFn: async () => {
      const response = await favoriteService.getAll(type);
      return response.data;
    },
  });
}

