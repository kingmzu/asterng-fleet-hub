/**
 * Remittances Hooks - Supabase implementation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

export const useRemittances = (
  page = 1,
  limit = 20,
  status = 'all',
  search = ''
) => {
  return useQuery({
    queryKey: ['remittances', page, limit, status, search],
    queryFn: async () => {
      let query = supabase
        .from('remittances')
        .select('*, riders!inner(name)', { count: 'exact' });

      if (status !== 'all') {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.ilike('riders.name', `%${search}%`);
      }

      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1).order('date', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: (data || []).map((r: any) => ({
          ...r,
          rider_name: r.riders?.name || 'Unknown',
        })),
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    },
    staleTime: 60 * 1000,
  });
};

export const useCreateRemittance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TablesInsert<'remittances'>) => {
      const { data: result, error } = await supabase.from('remittances').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remittances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useRemittanceStats = () => {
  return useQuery({
    queryKey: ['remittances', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('remittances').select('amount, status');
      if (error) throw error;

      const all = data || [];
      const paid = all.filter((r) => r.status === 'paid');
      const overdue = all.filter((r) => r.status === 'overdue');
      const partial = all.filter((r) => r.status === 'partial');

      const totalCollected = paid.reduce((s, r) => s + Number(r.amount), 0);
      const totalOverdue = overdue.reduce((s, r) => s + Number(r.amount), 0);
      const total = all.reduce((s, r) => s + Number(r.amount), 0);

      return {
        totalCollected,
        totalOverdue,
        pendingCount: partial.length,
        collectionRate: total > 0 ? Math.round((totalCollected / total) * 100) : 0,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};
