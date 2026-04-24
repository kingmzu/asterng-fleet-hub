import { useState } from 'react';
import { Search, Plus, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/StatusBadge';
import ExportDialog from '@/components/ExportDialog';
import { useRiders, useUserRoles } from '@/hooks/api';
import { useDebounce } from '@/hooks/useDebounce';
import { formatNaira } from '@/lib/mockData';
import RiderFormDialog from '@/components/forms/RiderFormDialog';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Rider = Tables<'riders'>;

const RidersPage = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);

  const { data: roles = [] } = useUserRoles();
  const isAdmin = roles.includes('admin');

  const { data, isLoading, error } = useRiders(page, 12, filterStatus, search);
  const riders = data?.data || [];
  const totalPages = data?.pagination.pages || 0;

  const openAdd = () => { setEditingRider(null); setFormOpen(true); };
  const openEdit = (rider: Rider) => { setEditingRider(rider); setFormOpen(true); };

  const exportColumns = [
    { header: 'Full Name', accessor: (r: Rider) => r.full_name },
    { header: 'Phone', accessor: (r: Rider) => r.phone_number },
    { header: 'Email', accessor: (r: Rider) => r.email || '' },
    { header: 'Status', accessor: (r: Rider) => r.status },
    { header: 'KYC Status', accessor: (r: Rider) => r.kyc_status },
    { header: 'Compliance %', accessor: (r: Rider) => r.compliance_score },
    { header: 'Total Paid (₦)', accessor: (r: Rider) => Number(r.total_remittance) },
    { header: 'Outstanding (₦)', accessor: (r: Rider) => Number(r.outstanding_balance) },
    { header: 'Join Date', accessor: (r: Rider) => r.join_date },
  ];

  const fetchAllRiders = async (): Promise<Rider[]> => {
    const { data, error } = await supabase.from('riders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Rider Management</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${data?.pagination.total || 0} registered riders`}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportDialog
            filteredRows={riders}
            fetchAll={fetchAllRiders}
            columns={exportColumns}
            fileBase="riders"
            title="Riders"
          />
          <Button className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> Add Rider</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'suspended', 'pending'].map((s) => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }} disabled={isLoading}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50'}`}
            >{s}</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load riders. Please try again.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
          : riders.length > 0
          ? riders.map((rider) => (
              <div key={rider.id} className="group rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                     {rider.full_name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{rider.full_name}</h3>
                      <p className="text-xs text-muted-foreground">{rider.phone_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(rider)} className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <StatusBadge status={rider.status} />
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Compliance</p>
                    <p className={`font-display text-lg font-bold ${rider.compliance_score >= 80 ? 'text-success' : rider.compliance_score >= 50 ? 'text-warning' : 'text-destructive'}`}>
                      {rider.compliance_score}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-success/10 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-success">Total Amount Paid</p>
                    <p className="font-display text-lg font-bold text-success">{formatNaira(Number(rider.total_remittance))}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className={`rounded-full border px-2 py-0.5 ${rider.kyc_status === 'verified' ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning'}`}>
                    KYC: {rider.kyc_status}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 ${rider.is_with_police ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-success/30 bg-success/10 text-success'}`}>
                    Police: {rider.is_with_police ? 'With Police' : 'Clear'}
                  </span>
                  {rider.assigned_bike_id && (
                    <span className="rounded-full border border-info/30 bg-info/10 px-2 py-0.5 text-info">Bike Assigned</span>
                  )}
                </div>

                {Number(rider.outstanding_balance) > 0 && (
                  <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
                    <p className="text-xs font-medium text-destructive">Outstanding: {formatNaira(Number(rider.outstanding_balance))}</p>
                  </div>
                )}
              </div>
            ))
          : (
            <div className="col-span-full rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">No riders found</p>
            </div>
          )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} disabled={isLoading}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${page === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50'}`}
            >{p}</button>
          ))}
        </div>
      )}

      <RiderFormDialog open={formOpen} onOpenChange={setFormOpen} rider={editingRider} canDelete={isAdmin} />
    </div>
  );
};

export default RidersPage;
