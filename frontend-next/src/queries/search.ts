import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/api';
import type { SearchType } from '@/types';

export const searchKeys = {
  query: (workspaceId: number, query: string, type: SearchType) =>
    ['search', workspaceId, query, type] as const,
};

export function useSearch(workspaceId: number, query: string, type: SearchType = 'ALL') {
  return useQuery({
    queryKey: searchKeys.query(workspaceId, query, type),
    queryFn: async () => {
      const res = await searchService.search(workspaceId, query, type);
      return res.data;
    },
    enabled: !!workspaceId && query.length >= 2,
  });
}
