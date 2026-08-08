import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ContactStatus = 'unread' | 'read' | 'replied';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  created_at: string;
}

export const useContactMessages = () =>
  useQuery({
    queryKey: ['contact-messages'],
    queryFn: async (): Promise<ContactMessage[]> => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContactMessage[];
    },
  });

export const useUpdateContactStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactStatus }) => {
      const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact-messages'] }),
  });
};
