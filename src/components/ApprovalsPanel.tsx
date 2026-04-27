import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { usePendingProfiles, useApproveProfile, useRejectProfile } from '@/hooks/api/useApprovals';
import { toast } from 'sonner';

const roleLabel = (r: string | null) => {
  if (!r) return 'Rider';
  if (r === 'operations_manager') return 'Operational Manager';
  return r.charAt(0).toUpperCase() + r.slice(1);
};

const ApprovalsPanel = () => {
  const { data: pending = [], isLoading } = usePendingProfiles();
  const approve = useApproveProfile();
  const reject = useRejectProfile();

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">Pending Approvals</h3>
          <p className="text-xs text-muted-foreground">Approve or reject new account registrations</p>
        </div>
        <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
          {pending.length} waiting
        </span>
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="m-4 h-14" />)
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
            <ShieldCheck className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No accounts awaiting approval.</p>
          </div>
        ) : (
          pending.map((p) => (
            <div key={p.user_id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
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
    </div>
  );
};

export default ApprovalsPanel;
