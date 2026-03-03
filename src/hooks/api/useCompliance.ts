/**
 * Compliance Records Hooks - Supabase implementation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useComplianceRecords = (riderId?: string) => {
  return useQuery({
    queryKey: ['compliance', riderId],
    queryFn: async () => {
      let query = supabase
        .from('compliance_records')
        .select('*, riders!inner(full_name)')
        .order('created_at', { ascending: false });

      if (riderId) {
        query = query.eq('rider_id', riderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        rider_name: r.riders?.full_name || 'Unknown',
      }));
    },
    staleTime: 60 * 1000,
  });
};

export const useCreateComplianceRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: {
      rider_id: string;
      compliance_type: string;
      document_url?: string;
      status?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('compliance_records')
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['compliance'] }),
  });
};

export const useVerifyCompliance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('compliance_records')
        .update({
          status,
          notes,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['compliance'] }),
  });
};
