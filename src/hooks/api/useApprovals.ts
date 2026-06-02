import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
