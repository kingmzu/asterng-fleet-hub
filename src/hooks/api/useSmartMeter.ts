import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      // deactivate all then activate target
      await supabase.from('pricing_settings').update({ is_active: false }).neq('id', id);
      const { error } = await supabase.from('pricing_settings').update({ is_active: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing'] }),
  });
};

export const useStartTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<'trips'>) => {
      const { data, error } = await supabase.from('trips').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  });
};

export const useTrips = (riderId?: string) => {
  return useQuery({
    queryKey: ['trips', riderId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('trips')
        .select('*, riders:rider_id(full_name), motorcycles:motorcycle_id(plate_number)')
        .order('started_at', { ascending: false })
        .limit(50);
      if (riderId) q = q.eq('rider_id', riderId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
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
