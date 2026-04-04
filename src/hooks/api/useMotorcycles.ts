/**
 * Motorcycles Hooks - Supabase implementation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Motorcycle = Tables<'motorcycles'>;

export const useMotorcycles = (
  page = 1,
  limit = 20,
  status = 'all',
  search = ''
) => {
  return useQuery({
    queryKey: ['motorcycles', page, limit, status, search],
    queryFn: async () => {
      let query = supabase.from('motorcycles').select('*, rider:riders!motorcycles_assigned_rider_id_fkey(full_name)', { count: 'exact' });

      if (status !== 'all') {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.or(`plate_number.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`);
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

export const useCreateMotorcycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bike: TablesInsert<'motorcycles'>) => {
      const { data, error } = await supabase.from('motorcycles').insert(bike).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['motorcycles'] }),
  });
};

export const useUpdateMotorcycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: update }: { id: string; data: TablesUpdate<'motorcycles'> }) => {
      const { data, error } = await supabase.from('motorcycles').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['motorcycles'] }),
  });
};

export const useDeleteMotorcycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('motorcycles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['motorcycles'] }),
  });
};
