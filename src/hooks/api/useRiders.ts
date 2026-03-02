/**
 * Riders Hooks - Supabase implementation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Rider = Tables<'riders'>;

export const useRiders = (
  page = 1,
  limit = 20,
  status = 'all',
  search = ''
) => {
  return useQuery({
    queryKey: ['riders', page, limit, status, search],
    queryFn: async () => {
      let query = supabase.from('riders').select('*', { count: 'exact' });

      if (status !== 'all') {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
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

export const useRider = (id: string) => {
  return useQuery({
    queryKey: ['rider', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateRider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rider: TablesInsert<'riders'>) => {
      const { data, error } = await supabase.from('riders').insert(rider).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['riders'] }),
  });
};

export const useUpdateRider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: update }: { id: string; data: TablesUpdate<'riders'> }) => {
      const { data, error } = await supabase.from('riders').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['riders'] }),
  });
};

export const useDeleteRider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('riders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['riders'] }),
  });
};

export const useOutstandingRiders = () => {
  return useQuery({
    queryKey: ['riders', 'outstanding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .gt('outstanding_balance', 0)
        .order('outstanding_balance', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
};
