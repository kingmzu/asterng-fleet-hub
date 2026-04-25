import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useStaffUsers,
  useOpenDirectConversation,
  useMarkRead,
  useRealtimeMessages,
} from '@/hooks/api/useMessaging';
import { useCurrentUser } from '@/hooks/api';
import { Send, Megaphone, MessageCircle, Plus, ArrowLeft } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

const roleLabel = (r?: string) => {
  switch (r) {
    case 'admin': return 'Admin';
    case 'operations_manager': return 'Ops Manager';
    case 'accountant': return 'Cashier';
    default: return r ?? '';
  }
};

const formatTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
};

const MessagesPage = () => {
  useRealtimeMessages();
  const { user } = useCurrentUser();
  const { data: conversations = [], isLoading: convLoading } = useConversations();
  const { data: staff = [] } = useStaffUsers();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [draft, setDraft] = useState('');
  const { data: messages = [] } = useMessages(activeId);
  const sendMsg = useSendMessage();
  const openDirect = useOpenDirectConversation();
  const markRead = useMarkRead();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-select first conversation
  useEffect(() => {
    if (!activeId && conversations.length) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, activeId]);

  // Mark read when opening
  useEffect(() => {
    if (activeId) markRead.mutate(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId]
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;
    sendMsg.mutate(
      { conversationId: activeId, body: draft.trim() },
      { onSuccess: () => setDraft('') }
    );
  };

  const handleStartChat = async (otherUserId: string) => {
    const id = await openDirect.mutateAsync(otherUserId);
    setActiveId(id);
    setShowNewChat(false);
  };

  return (
    <div className="h-[calc(100vh-7.5rem)]">
      <Card className="grid h-full overflow-hidden md:grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <aside className={`flex flex-col border-r border-border bg-card ${activeId ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="font-display text-base font-semibold">Conversations</h2>
            <Button size="sm" variant="outline" onClick={() => setShowNewChat((s) => !s)}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>

          {showNewChat && (
            <div className="border-b border-border p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Start a chat</p>
              <div className="space-y-1">
                {staff.length === 0 && (
                  <p className="text-xs text-muted-foreground">No other staff members yet.</p>
                )}
                {staff.map((u) => (
                  <button
                    key={u.user_id}
                    onClick={() => handleStartChat(u.user_id)}
                    className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-muted"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {u.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{u.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{roleLabel(u.role)}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Separator className="my-2" />
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {convLoading && <p className="p-3 text-xs text-muted-foreground">Loading...</p>}
              {conversations.map((c) => {
                const isGeneral = c.type === 'general';
                const title = isGeneral ? 'General' : (c.other_user_name ?? 'Direct chat');
                const subtitle = isGeneral
                  ? 'Announcements channel'
                  : roleLabel(c.other_user_role);
                const active = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors ${
                      active ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isGeneral ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {isGeneral ? <Megaphone className="h-5 w-5" /> : (
                        <span className="text-xs font-bold">
                          {(c.other_user_name ?? '??').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{title}</p>
                        <span className="text-[10px] text-muted-foreground">{formatTime(c.last_message_at ?? c.updated_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-muted-foreground">{c.last_message ?? subtitle}</p>
                        {(c.unread_count ?? 0) > 0 && (
                          <Badge className="h-5 min-w-5 px-1.5 text-[10px]">{c.unread_count}</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* Chat window */}
        <section className={`flex flex-col bg-background ${activeId ? 'flex' : 'hidden md:flex'}`}>
          {!activeConv ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-border bg-card p-4">
                <button onClick={() => setActiveId(null)} className="md:hidden text-muted-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  activeConv.type === 'general' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}>
                  {activeConv.type === 'general' ? (
                    <Megaphone className="h-5 w-5" />
                  ) : (
                    <span className="text-xs font-bold">
                      {(activeConv.other_user_name ?? '??').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-display font-semibold">
                    {activeConv.type === 'general' ? 'General' : activeConv.other_user_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeConv.type === 'general' ? 'Announcements channel — visible to all staff' : roleLabel(activeConv.other_user_role)}
                  </p>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-8">No messages yet. Say hello 👋</p>
                )}
                {messages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        mine
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}>
                        {!mine && (
                          <p className="mb-0.5 text-[11px] font-semibold opacity-80">
                            {m.sender_name}
                            {m.sender_role && <span className="ml-1 opacity-60">· {roleLabel(m.sender_role)}</span>}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                        <p className={`mt-1 text-[10px] ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {format(new Date(m.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border bg-card p-3">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  maxLength={4000}
                />
                <Button type="submit" disabled={!draft.trim() || sendMsg.isPending} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </section>
      </Card>
    </div>
  );
};

export default MessagesPage;
