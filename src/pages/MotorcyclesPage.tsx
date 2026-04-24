import { useState } from 'react';
import { Search, Plus, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/StatusBadge';
import ExportDialog from '@/components/ExportDialog';
import { useMotorcycles } from '@/hooks/api';
import { useDebounce } from '@/hooks/useDebounce';
import { formatNaira } from '@/lib/mockData';
import MotorcycleFormDialog from '@/components/forms/MotorcycleFormDialog';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Motorcycle = Tables<'motorcycles'> & { rider?: { full_name: string } | null };

const MotorcyclesPage = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<Tables<'motorcycles'> | null>(null);

  const { data, isLoading, error } = useMotorcycles(page, 12, filterStatus, search);
  const motorcycles = (data?.data || []) as Motorcycle[];
  const totalPages = data?.pagination.pages || 0;

  const openAdd = () => { setEditingBike(null); setFormOpen(true); };
  const openEdit = (bike: Tables<'motorcycles'>) => { setEditingBike(bike); setFormOpen(true); };

  const exportColumns = [
    { header: 'Plate Number', accessor: (b: Motorcycle) => b.plate_number },
    { header: 'Make', accessor: (b: Motorcycle) => b.make },
    { header: 'Model', accessor: (b: Motorcycle) => b.model },
    { header: 'Year', accessor: (b: Motorcycle) => b.year },
    { header: 'Color', accessor: (b: Motorcycle) => b.color },
    { header: 'Status', accessor: (b: Motorcycle) => b.status },
    { header: 'Assigned Rider', accessor: (b: Motorcycle) => b.rider?.full_name || '' },
    { header: 'Total Revenue (₦)', accessor: (b: Motorcycle) => Number(b.total_revenue) },
    { header: 'Maintenance Cost (₦)', accessor: (b: Motorcycle) => Number(b.maintenance_cost) },
    { header: 'Last Maintenance', accessor: (b: Motorcycle) => b.last_maintenance || '' },
    { header: 'Insurance Expiry', accessor: (b: Motorcycle) => b.insurance_expiry_date },
    { header: 'Registration Expiry', accessor: (b: Motorcycle) => b.registration_expiry_date || '' },
  ];

  const fetchAll = async (): Promise<Motorcycle[]> => {
    const { data, error } = await supabase
      .from('motorcycles')
      .select('*, rider:riders!motorcycles_assigned_rider_id_fkey(full_name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as any;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Motorcycle Fleet</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${data?.pagination.total || 0} registered motorcycles`}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportDialog
            filteredRows={motorcycles}
            fetchAll={fetchAll}
            columns={exportColumns}
            fileBase="motorcycles"
            title="Motorcycles"
          />
          <Button className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> Register Bike</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by plate, make or model..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'maintenance', 'suspended'].map((s) => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }} disabled={isLoading}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50'}`}
            >{s}</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load motorcycles. Please try again.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
          : motorcycles.length > 0
          ? motorcycles.map((bike) => (
              <div key={bike.id} className="group rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">{bike.plate_number}</h3>
                    <p className="text-sm text-muted-foreground">{bike.make} {bike.model} • {bike.year}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(bike)} className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <StatusBadge status={bike.status} />
                  </div>
                </div>

                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned Rider</span>
                    <span className={`font-medium ${bike.rider_id ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {bike.rider?.full_name || (bike.rider_id ? 'Unknown rider' : 'Unassigned')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insurance Expiry</span>
                    <span className={`font-medium ${new Date(bike.insurance_expiry_date) < new Date() ? 'text-destructive' : 'text-foreground'}`}>
                      {bike.insurance_expiry_date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Maintenance</span>
                    <span className="font-medium text-foreground">{bike.last_maintenance || 'Never'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-success/10 px-3 py-2 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-success">Revenue</p>
                    <p className="font-display text-sm font-bold text-success">{formatNaira(Number(bike.total_revenue))}</p>
                  </div>
                  <div className="rounded-lg bg-destructive/10 px-3 py-2 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-destructive">Maintenance</p>
                    <p className="font-display text-sm font-bold text-destructive">{formatNaira(Number(bike.maintenance_cost))}</p>
                  </div>
                </div>
              </div>
            ))
          : (
            <div className="col-span-full rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">No motorcycles found</p>
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

      <MotorcycleFormDialog open={formOpen} onOpenChange={setFormOpen} motorcycle={editingBike} />
    </div>
  );
};

export default MotorcyclesPage;
