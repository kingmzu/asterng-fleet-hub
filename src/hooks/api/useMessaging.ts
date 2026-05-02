/**
 * Messaging Hooks
 * Conversations, messages, realtime updates, unread tracking
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Conversation {
  id: string;
  type: 'general' | 'direct';
  title: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationListItem extends Conversation {
  other_user_id?: string;
  other_user_name?: string;
  other_user_role?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name?: string;
  sender_role?: string;
}

export interface StaffUser {
  user_id: string;
  full_name: string;
  email: string | null;
  role: string;
}

/** List approved users (excluding self) the current staff member can DM */
export const useStaffUsers = () => {
  return useQuery({
    queryKey: ['messaging', 'approved-users'],
    queryFn: async (): Promise<StaffUser[]> => {
      const { data, error } = await supabase.rpc('get_approved_chat_users');
      if (error) throw error;
      return ((data || []) as any[]).map((u) => ({
        user_id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
      }));
    },
    staleTime: 60_000,
  });
};

/** Conversations the user can see, plus unread + last message */
export const useConversations = () => {
  return useQuery({
    queryKey: ['messaging', 'conversations'],
    queryFn: async (): Promise<ConversationListItem[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: convs, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      if (!convs || convs.length === 0) return [];

      const convIds = convs.map((c) => c.id);

      // Participants for direct conversations
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', convIds);

      // Last message per conversation (simple: fetch newest 1 per conv via separate calls limited)
      const { data: lastMsgs } = await supabase
        .from('messages')
        .select('conversation_id, body, created_at, sender_id')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
        .limit(200);
      const lastByConv: Record<string, { body: string; created_at: string }> = {};
      (lastMsgs ?? []).forEach((m) => {
        if (!lastByConv[m.conversation_id]) {
          lastByConv[m.conversation_id] = { body: m.body, created_at: m.created_at };
        }
      });

      // Read receipts
      const { data: reads } = await supabase
        .from('message_reads')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);
      const lastReadByConv: Record<string, string> = {};
      (reads ?? []).forEach((r) => { lastReadByConv[r.conversation_id] = r.last_read_at; });

      // Unread counts (simple count per conv)
      const unreadByConv: Record<string, number> = {};
      for (const c of convs) {
        const lastRead = lastReadByConv[c.id];
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', c.id)
          .neq('sender_id', user.id)
          .gt('created_at', lastRead ?? '1970-01-01');
        unreadByConv[c.id] = count ?? 0;
      }

      // Other user lookup for direct chats
      const otherUserIds: string[] = [];
      const otherByConv: Record<string, string> = {};
      for (const c of convs) {
        if (c.type !== 'direct') continue;
        const others = (participants ?? []).filter(
          (p) => p.conversation_id === c.id && p.user_id !== user.id
        );
        if (others[0]) {
          otherByConv[c.id] = others[0].user_id;
          otherUserIds.push(others[0].user_id);
        }
      }

      let profilesById: Record<string, { full_name: string }> = {};
      let rolesById: Record<string, string> = {};
      if (otherUserIds.length) {
        const [{ data: pr }, { data: ur }] = await Promise.all([
          supabase.from('profiles').select('user_id, full_name').in('user_id', otherUserIds),
          supabase.from('user_roles').select('user_id, role').in('user_id', otherUserIds),
        ]);
        (pr ?? []).forEach((p) => { profilesById[p.user_id] = { full_name: p.full_name }; });
        const priority: Record<string, number> = { admin: 3, operations_manager: 2, accountant: 1 };
        (ur ?? []).forEach((r) => {
          if (!rolesById[r.user_id] || priority[r.role] > priority[rolesById[r.user_id]]) {
            rolesById[r.user_id] = r.role;
          }
        });
      }

      return convs.map((c) => {
        const otherId = otherByConv[c.id];
        return {
          ...c,
          type: c.type as 'general' | 'direct',
          other_user_id: otherId,
          other_user_name: otherId ? profilesById[otherId]?.full_name : undefined,
          other_user_role: otherId ? rolesById[otherId] : undefined,
          last_message: lastByConv[c.id]?.body,
          last_message_at: lastByConv[c.id]?.created_at,
          unread_count: unreadByConv[c.id],
        };
      });
    },
  });
};

/** Messages for a single conversation, ordered oldest -> newest */
export const useMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['messaging', 'messages', conversationId],
    enabled: !!conversationId,
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, body, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(500);
      if (error) throw error;
      const senderIds = Array.from(new Set((data ?? []).map((m) => m.sender_id)));
      let nameById: Record<string, string> = {};
      let roleById: Record<string, string> = {};
      if (senderIds.length) {
        const [{ data: pr }, { data: ur }] = await Promise.all([
          supabase.from('profiles').select('user_id, full_name').in('user_id', senderIds),
          supabase.from('user_roles').select('user_id, role').in('user_id', senderIds),
        ]);
        (pr ?? []).forEach((p) => { nameById[p.user_id] = p.full_name; });
        const priority: Record<string, number> = { admin: 3, operations_manager: 2, accountant: 1 };
        (ur ?? []).forEach((r) => {
          if (!roleById[r.user_id] || priority[r.role] > priority[roleById[r.user_id]]) {
            roleById[r.user_id] = r.role;
          }
        });
      }
      return (data ?? []).map((m) => ({
        ...m,
        sender_name: nameById[m.sender_id] ?? 'Unknown',
        sender_role: roleById[m.sender_id],
      }));
    },
  });
};

/** Send a message */
export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user.id, body })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messaging', 'messages', vars.conversationId] });
      qc.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
    },
  });
};

/** Mark conversation as read (now) */
export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('message_reads').upsert(
        { user_id: user.id, conversation_id: conversationId, last_read_at: new Date().toISOString() },
        { onConflict: 'user_id,conversation_id' }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
    },
  });
};

/** Find or create a direct conversation with another user */
export const useOpenDirectConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (otherUserId: string): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find existing direct chat where both users are participants
      const { data: mine } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);
      const myConvIds = (mine ?? []).map((r) => r.conversation_id);

      if (myConvIds.length) {
        const { data: theirs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .in('conversation_id', myConvIds);
        const sharedIds = (theirs ?? []).map((r) => r.conversation_id);
        if (sharedIds.length) {
          const { data: directs } = await supabase
            .from('conversations')
            .select('id')
            .eq('type', 'direct')
            .in('id', sharedIds)
            .limit(1);
          if (directs && directs[0]) return directs[0].id;
        }
      }

      // Create new
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({ type: 'direct', created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      const { error: pErr } = await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUserId },
      ]);
      if (pErr) throw pErr;
      return newConv.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
    },
  });
};

/** Subscribe to realtime new messages globally; refresh queries when received */
export const useRealtimeMessages = () => {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('messages-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          const convId = payload.new?.conversation_id;
          if (convId) {
            qc.invalidateQueries({ queryKey: ['messaging', 'messages', convId] });
          }
          qc.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
};
