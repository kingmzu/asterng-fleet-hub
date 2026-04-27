import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePendingProfiles = () => {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['profiles', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel('profiles_pending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        qc.invalidateQueries({ queryKey: ['profiles', 'pending'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return q;
};

export const useApproveProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, requestedRole }: { userId: string; requestedRole: string | null }) => {
      const { data: me } = await supabase.auth.getUser();
      const role = (requestedRole || 'rider') as 'admin' | 'operations_manager' | 'rider';

      const { error: pErr } = await supabase
        .from('profiles')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: me.user?.id,
        })
        .eq('user_id', userId);
      if (pErr) throw pErr;

      const { error: rErr } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
      if (rErr) throw rErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles', 'pending'] });
      qc.invalidateQueries({ queryKey: ['riders'] });
    },
  });
};

export const useRejectProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: me } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: me.user?.id,
        })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles', 'pending'] }),
  });
};
