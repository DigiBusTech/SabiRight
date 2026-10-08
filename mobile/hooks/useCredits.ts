import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

export interface CreditBalanceData {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  planCredits?: number;
  renewalDate?: string | null;
  planId?: string;
  planName?: string;
}

export function useCredits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<CreditBalanceData>({
    queryKey: ['credits', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiFetch(`/api/credits/${user!.id}/available`);
      if (!res.ok) throw new Error('Failed to fetch available credits');
      const data = await res.json();
      return {
        totalCredits: Number(data.totalCredits ?? 0),
        usedCredits: Number(data.usedCredits ?? 0),
        availableCredits: Number(data.availableCredits ?? Math.max(0, (data.totalCredits || 0) - (data.usedCredits || 0))),
        planCredits: data.planCredits !== undefined ? Number(data.planCredits) : undefined,
        renewalDate: data.renewalDate || null,
        planId: data.planId || 'free',
        planName: data.planName || 'Citizen Free',
      };
    },
    staleTime: 10000,
  });

  return {
    available: query.data?.availableCredits ?? (query.data ? Math.max(0, query.data.totalCredits - query.data.usedCredits) : null),
    total: query.data?.totalCredits ?? null,
    used: query.data?.usedCredits ?? null,
    planCredits: query.data?.planCredits ?? null,
    planId: query.data?.planId || 'free',
    planName: query.data?.planName || 'Citizen Free',
    renewalDate: query.data?.renewalDate,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['credits', user?.id] }),
    refetch: query.refetch,
  };
}
