/**
 * Profile Management Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Generate a signed URL for an avatar path (1-hour expiry) */
export const useAvatarUrl = (avatarPath: string | null | undefined) => {
  return useQuery({
    queryKey: ['avatar-url', avatarPath],
    queryFn: async () => {
      if (!avatarPath) return null;
      const { data, error } = await supabase.storage
        .from('profile-avatars')
        .createSignedUrl(avatarPath, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!avatarPath,
    staleTime: 30 * 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (update: {
      full_name?: string;
      phone_number?: string;
      home_address?: string;
      avatar_url?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(update)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['avatar-url'] });
    },
  });
};

export const useUploadAvatar = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      // Bucket is private — return the path for signed URL generation
      return filePath;
    },
  });
};
