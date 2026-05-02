import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const profilesByStatus = (status: 'pending' | 'approved' | 'rejected') => async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('approval_status', status)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

const useProfilesQuery = (status: 'pending' | 'approved' | 'rejected') => {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['profiles', status],
    queryFn: profilesByStatus(status),
  });
  useEffect(() => {
    const ch = supabase
      .channel(`profiles_${status}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        qc.invalidateQueries({ queryKey: ['profiles', status] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, status]);
  return q;
};

export const usePendingProfiles = () => useProfilesQuery('pending');
export const useApprovedProfiles = () => useProfilesQuery('approved');

/** Approved users not yet onboarded as riders — for the rider prefill dropdown */
export const useApprovedUsersForOnboarding = () => {
  return useQuery({
    queryKey: ['approved-users', 'for-onboarding'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_approved_users_for_onboarding');
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });
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
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['approved-users'] });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  });
};
