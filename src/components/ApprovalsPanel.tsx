import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, ShieldCheck, Loader2, Users } from 'lucide-react';
import {
  usePendingProfiles,
  useApprovedProfiles,
  useApproveProfile,
  useRejectProfile,
} from '@/hooks/api/useApprovals';
import { toast } from 'sonner';

const roleLabel = (r: string | null) => {
  if (!r) return 'Rider';
  if (r === 'operations_manager') return 'Operational Manager';
  return r.charAt(0).toUpperCase() + r.slice(1);
};

const initials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const ApprovalsPanel = () => {
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');
  const { data: pending = [], isLoading: pendingLoading } = usePendingProfiles();
  const { data: approved = [], isLoading: approvedLoading } = useApprovedProfiles();
  const approve = useApproveProfile();
  const reject = useRejectProfile();

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">Account Approvals</h3>
          <p className="text-xs text-muted-foreground">Review pending registrations and active members</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'pending' | 'approved')}>
        <div className="px-5 pt-3">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
            <TabsTrigger value="pending" className="gap-2">
              Pending
              <span className="rounded-full bg-warning/15 px-1.5 text-[10px] font-medium text-warning">
                {pending.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              Approved
              <span className="rounded-full bg-success/15 px-1.5 text-[10px] font-medium text-success">
                {approved.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="m-0">
          <div className="divide-y divide-border">
            {pendingLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="m-4 h-14" />)
            ) : pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
                <ShieldCheck className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No accounts awaiting approval.</p>
              </div>
            ) : (
              pending.map((p: any) => (
                <div key={p.user_id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {initials(p.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] capitalize text-primary">
                    {roleLabel(p.requested_role)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive"
                      disabled={reject.isPending}
                      onClick={() => reject.mutate(p.user_id, {
                        onSuccess: () => toast.success('Account rejected'),
                        onError: (e: any) => toast.error('Failed', { description: e.message }),
                      })}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1"
                      disabled={approve.isPending}
                      onClick={() => approve.mutate({ userId: p.user_id, requestedRole: p.requested_role }, {
                        onSuccess: () => toast.success(`Approved as ${roleLabel(p.requested_role)}`),
                        onError: (e: any) => toast.error('Failed', { description: e.message }),
                      })}
                    >
                      {approve.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="m-0">
          <div className="divide-y divide-border">
            {approvedLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="m-4 h-14" />)
            ) : approved.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
                <Users className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No approved accounts yet.</p>
              </div>
            ) : (
              approved.map((p: any) => (
                <div key={p.user_id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-xs font-bold text-success">
                    {initials(p.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] capitalize text-success">
                    {roleLabel(p.requested_role)}
                  </span>
                  {p.approved_at && (
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(p.approved_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApprovalsPanel;
