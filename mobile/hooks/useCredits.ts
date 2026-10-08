import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { apiFetch, API_BASE_URL } from '../lib/api';
import { supabase } from '../lib/supabase';
import { cacheUserCreditsOffline, getCachedUserCreditsOffline, syncOfflineDeductionsToServer } from '../lib/offlineStorage';

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
      try {
        const res = await apiFetch(`/api/credits/${user!.id}/available`);
        if (res.ok) {
          const data = await res.json();
          const avail = Number(data.availableCredits ?? Math.max(0, (data.totalCredits || 0) - (data.usedCredits || 0)));
          
          // Cache available credits locally for offline fallback
          cacheUserCreditsOffline(user!.id, avail).catch(() => {});
          
          // Flush any pending deductions that accumulated while offline
          supabase.auth.getSession().then(({ data: sess }) => {
            if (sess?.session?.access_token) {
              syncOfflineDeductionsToServer(API_BASE_URL, sess.session.access_token, user!.id).catch(() => {});
            }
          }).catch(() => {});

          return {
            totalCredits: Number(data.totalCredits ?? 0),
            usedCredits: Number(data.usedCredits ?? 0),
            availableCredits: avail,
            planCredits: data.planCredits !== undefined ? Number(data.planCredits) : undefined,
            renewalDate: data.renewalDate || null,
            planId: data.planId || 'free',
            planName: data.planName || 'Citizen Free',
          };
        }
      } catch (networkErr) {
        // In offline mode, retrieve last cached credits
        const cached = await getCachedUserCreditsOffline(user!.id);
        if (cached !== null) {
          return {
            totalCredits: cached,
            usedCredits: 0,
            availableCredits: cached,
            planId: 'free',
            planName: 'Cached Balance',
          };
        }
      }
      throw new Error('Failed to fetch available credits');
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
