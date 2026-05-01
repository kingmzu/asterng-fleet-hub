import { useState } from 'react';
import { Search, Plus, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/StatusBadge';
import { useRemittances, useRemittanceStats, useUserRoles } from '@/hooks/api';
import { formatNaira } from '@/lib/mockData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RemittanceFormDialog from '@/components/forms/RemittanceFormDialog';
import ExportDialog from '@/components/ExportDialog';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

const remittanceColumns = [
  { header: 'Date', accessor: (r: any) => r.remittance_date },
  { header: 'Rider', accessor: (r: any) => r.rider_name },
  { header: 'Amount (₦)', accessor: (r: any) => Number(r.amount) },
  { header: 'Type', accessor: (r: any) => r.type },
  { header: 'Method', accessor: (r: any) => r.payment_method },
  { header: 'Status', accessor: (r: any) => r.status },
  { header: 'Reference', accessor: (r: any) => r.reference_note || '' },
];

const RemittancesPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editRemittance, setEditRemittance] = useState<Tables<'remittances'> | null>(null);

  const { data: roles } = useUserRoles();
  const isAdmin = roles?.includes('admin');

  const { data, isLoading, error } = useRemittances(page, 20, filterStatus, search);
  const { data: stats, isLoading: statsLoading } = useRemittanceStats();

  const remittances = data?.data || [];
  const totalPages = data?.pagination.pages || 0;

  const openEdit = (r: Tables<'remittances'>) => {
    if (!isAdmin) return;
    setEditRemittance(r);
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditRemittance(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Remittance Tracking</h1>
          <p className="text-sm text-muted-foreground">Track daily and weekly rider payments</p>
        </div>
        <div className="flex gap-2">
          <ExportDialog
            filteredRows={remittances as any[]}
            fetchAll={async () => {
              const { data, error } = await supabase
                .from('remittances')
                .select('*, riders!inner(full_name)')
                .order('remittance_date', { ascending: false });
              if (error) throw error;
              return (data || []).map((r: any) => ({ ...r, rider_name: r.riders?.full_name || 'Unknown' }));
            }}
            columns={remittanceColumns}
            fileBase="remittances"
            title="Remittance Report"
            disabled={isLoading}
          />
          <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Log Payment</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Collected</p>
          {statsLoading ? <Skeleton className="mt-1 h-7 w-32" /> : <p className="font-display text-xl font-bold text-success">{formatNaira(stats?.totalCollected || 0)}</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Overdue</p>
          {statsLoading ? <Skeleton className="mt-1 h-7 w-32" /> : <p className="font-display text-xl font-bold text-destructive">{formatNaira(stats?.totalOverdue || 0)}</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending</p>
          {statsLoading ? <Skeleton className="mt-1 h-7 w-32" /> : <p className="font-display text-xl font-bold text-warning">{stats?.pendingCount || 0}</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Collection Rate</p>
          {statsLoading ? <Skeleton className="mt-1 h-7 w-32" /> : <p className="font-display text-xl font-bold text-primary">{stats?.collectionRate || 0}%</p>}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load remittances. Please try again.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by rider name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" disabled={isLoading} />
        </div>
        <div className="flex gap-2">
          {['all', 'paid', 'partial', 'overdue'].map((s) => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }} disabled={isLoading}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50'}`}
            >{s}</button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rider</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  </TableRow>
                ))
              : remittances.length > 0
              ? remittances.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.rider_name}</TableCell>
                    <TableCell className="font-semibold">{formatNaira(Number(r.amount))}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize text-muted-foreground">{r.type}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize text-muted-foreground">{r.payment_method}</TableCell>
                    <TableCell className="text-muted-foreground">{r.remittance_date}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground py-8">No remittances found</TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
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

      <RemittanceFormDialog open={formOpen} onOpenChange={setFormOpen} remittance={editRemittance} />
    </div>
  );
};

export default RemittancesPage;
