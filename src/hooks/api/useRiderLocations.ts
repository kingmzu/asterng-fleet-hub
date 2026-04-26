import { useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RiderLocation {
  rider_id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  status: 'offline' | 'online' | 'on_trip';
  current_trip_id: string | null;
  last_seen_at: string;
  updated_at: string;
}

export const useRiderLocations = () => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['rider_locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rider_locations' as any)
        .select('*');
      if (error) throw error;
      return (data || []) as unknown as RiderLocation[];
    },
    refetchInterval: 15_000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('rider_locations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rider_locations' }, () => {
        qc.invalidateQueries({ queryKey: ['rider_locations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
};

export const usePushRiderLocation = () => {
  return useMutation({
    mutationFn: async (payload: {
      rider_id: string;
      lat: number;
      lng: number;
      accuracy?: number | null;
      heading?: number | null;
      speed?: number | null;
      status: 'offline' | 'online' | 'on_trip';
      current_trip_id?: string | null;
    }) => {
      const { error } = await supabase
        .from('rider_locations' as any)
        .upsert(
          { ...payload, last_seen_at: new Date().toISOString() } as any,
          { onConflict: 'rider_id' }
        );
      if (error) throw error;
    },
  });
};
