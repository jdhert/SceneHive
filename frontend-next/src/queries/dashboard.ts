import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/api';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  data: (limit: number) => [...dashboardKeys.all, limit] as const,
};

export function useDashboard(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.data(limit),
    queryFn: async () => {
      const res = await dashboardService.get(limit);
      return res.data;
    },
  });
}
