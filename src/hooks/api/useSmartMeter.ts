import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type PricingSettings = Tables<'pricing_settings'>;
export type Trip = Tables<'trips'>;
export type TripExtra = Tables<'trip_extras'>;

export const useActivePricing = () => {
  return useQuery({
    queryKey: ['pricing', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
  });
};

export const useAllPricing = () => {
  return useQuery({
    queryKey: ['pricing', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_settings')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useUpsertPricing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<'pricing_settings'> & { id?: string }) => {
      if (payload.id) {
        const { data, error } = await supabase
          .from('pricing_settings')
          .update(payload as TablesUpdate<'pricing_settings'>)
          .eq('id', payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from('pricing_settings').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing'] }),
  });
};

export const useActivateTier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('pricing_settings').update({ is_active: false }).neq('id', id);
      const { error } = await supabase.from('pricing_settings').update({ is_active: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing'] }),
  });
};

/** Find the rider's currently-active or paused trip (for resuming after refresh). */
export const useActiveTrip = (riderId?: string) => {
  return useQuery({
    queryKey: ['trips', 'active', riderId],
    queryFn: async () => {
      if (!riderId) return null;
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('rider_id', riderId)
        .in('status', ['active', 'paused'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!riderId,
    staleTime: 5_000,
  });
};

export const useUpdateTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TablesUpdate<'trips'> }) => {
      const { data: row, error } = await supabase.from('trips').update(data).eq('id', id).select().single();
      if (error) throw error;
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

/** Paginated trip list with realtime invalidation. 20 per page. */
export const useTripsPaginated = (
  page: number,
  pageSize: number,
  riderId?: string,
) => {
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel('trips_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        qc.invalidateQueries({ queryKey: ['trips'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return useQuery({
    queryKey: ['trips', 'paginated', page, pageSize, riderId ?? 'all'],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      let q = supabase
        .from('trips')
        .select('*, riders:rider_id(full_name), motorcycles:motorcycle_id(plate_number)', { count: 'exact' })
        .order('started_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (riderId) q = q.eq('rider_id', riderId);
      const { data, error, count } = await q;
      if (error) throw error;
      return {
        rows: data || [],
        total: count || 0,
        pages: Math.max(1, Math.ceil((count || 0) / pageSize)),
      };
    },
  });
};

export const useAddExtra = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<'trip_extras'>) => {
      const { data, error } = await supabase.from('trip_extras').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['trip_extras', vars.trip_id] }),
  });
};

export const useRemoveExtra = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; tripId: string }) => {
      const { error } = await supabase.from('trip_extras').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['trip_extras', vars.tripId] }),
  });
};

export const useTripExtras = (tripId?: string) => {
  return useQuery({
    queryKey: ['trip_extras', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase.from('trip_extras').select('*').eq('trip_id', tripId).order('created_at');
      if (error) throw error;
      return data || [];
    },
    enabled: !!tripId,
  });
};

export const useAddTripPoint = () => {
  return useMutation({
    mutationFn: async (payload: TablesInsert<'trip_points'>) => {
      const { error } = await supabase.from('trip_points').insert(payload);
      if (error) throw error;
    },
  });
};

export const useTripPoints = (tripId?: string) => {
  return useQuery({
    queryKey: ['trip_points', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase.from('trip_points').select('*').eq('trip_id', tripId).order('recorded_at');
      if (error) throw error;
      return data || [];
    },
    enabled: !!tripId,
  });
};
