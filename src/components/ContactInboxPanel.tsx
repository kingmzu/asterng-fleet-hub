import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Mail, Phone, Inbox, ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import {
  useContactMessages,
  useUpdateContactStatus,
  type ContactStatus,
} from '@/hooks/api/useContactMessages';

const statusVariant: Record<ContactStatus, string> = {
  unread: 'bg-primary text-primary-foreground',
  read: 'bg-muted text-muted-foreground',
  replied: 'bg-success text-success-foreground',
};

const ContactInboxPanel = () => {
  const { data: messages = [], isLoading } = useContactMessages();
  const updateStatus = useUpdateContactStatus();
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = useMemo(() => messages.find((m) => m.id === activeId) ?? null, [messages, activeId]);

  const open = (id: string, status: ContactStatus) => {
    setActiveId(id);
    if (status === 'unread') updateStatus.mutate({ id, status: 'read' });
  };

  return (
    <Card className="grid h-full overflow-hidden md:grid-cols-[320px_1fr]">
      <aside className={`flex flex-col border-r border-border bg-card ${activeId ? 'hidden md:flex' : 'flex'}`}>
        <div className="border-b border-border p-4">
          <h2 className="font-display text-base font-semibold">Website enquiries</h2>
          <p className="text-xs text-muted-foreground">Messages sent from the public contact form</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {isLoading && <p className="p-3 text-xs text-muted-foreground">Loading...</p>}
            {!isLoading && messages.length === 0 && (
              <p className="p-4 text-center text-xs text-muted-foreground">No enquiries yet.</p>
            )}
            {messages.map((m) => (
              <button
                key={m.id}
                onClick={() => open(m.id, m.status)}
                className={`w-full rounded-lg p-3 text-left transition-colors ${
                  m.id === activeId ? 'bg-primary/10' : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`truncate text-sm ${m.status === 'unread' ? 'font-bold' : 'font-medium'}`}>{m.name}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {format(new Date(m.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className="truncate text-xs text-foreground/80">{m.subject}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-muted-foreground">{m.message}</p>
                  <Badge className={`shrink-0 text-[10px] capitalize ${statusVariant[m.status]}`}>{m.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <section className={`flex flex-col bg-background ${activeId ? 'flex' : 'hidden md:flex'}`}>
        {!active ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Inbox className="mx-auto mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">Select an enquiry to read it</p>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-start gap-3 border-b border-border bg-card p-4">
              <button onClick={() => setActiveId(null)} className="mt-1 text-muted-foreground md:hidden">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold">{active.subject}</p>
                <p className="text-xs text-muted-foreground">
                  From {active.name} · {format(new Date(active.created_at), 'PPp')}
                </p>
              </div>
              <Badge className={`capitalize ${statusVariant[active.status]}`}>{active.status}</Badge>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="flex flex-wrap gap-3">
                <a
                  href={`mailto:${active.email}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:text-primary"
                >
                  <Mail className="h-4 w-4 text-primary" /> {active.email}
                </a>
                {active.phone && (
                  <a
                    href={`tel:${active.phone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:text-primary"
                  >
                    <Phone className="h-4 w-4 text-primary" /> {active.phone}
                  </a>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="whitespace-pre-wrap break-words text-sm text-foreground">{active.message}</p>
              </div>
            </div>

            <footer className="flex flex-wrap items-center gap-2 border-t border-border bg-card p-3">
              <span className="mr-1 text-xs text-muted-foreground">Mark as:</span>
              {(['unread', 'read', 'replied'] as ContactStatus[]).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={active.status === s ? 'default' : 'outline'}
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: active.id, status: s })}
                  className="capitalize"
                >
                  {updateStatus.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  {s}
                </Button>
              ))}
            </footer>
          </>
        )}
      </section>
    </Card>
  );
};

export default ContactInboxPanel;
