import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/StatusBadge';
import { useMotorcycles } from '@/hooks/api';
import { formatNaira } from '@/lib/mockData';

const MotorcyclesPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch motorcycles from API
  const { data, isLoading, error } = useMotorcycles(page, 12, filterStatus, search);

  const motorcycles = data?.data || [];
  const totalPages = data?.pagination.pages || 0;

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setFilterStatus(status);
    setPage(1);
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Register Bike
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by registration or make..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'maintenance', 'suspended'].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusFilter(s)}
              disabled={isLoading}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${
                filterStatus === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load motorcycles. Please try again.
        </div>
      )}

      {/* Motorcycle cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))
          : motorcycles.length > 0
          ? motorcycles.map((bike) => (
              <div
                key={bike.id}
                className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">
                      {bike.registrationNumber}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {bike.make} {bike.model} • {bike.year}
                    </p>
                  </div>
                  <StatusBadge status={bike.status} />
                </div>

                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned Rider</span>
                    <span
                      className={`font-medium ${
                        bike.assignedRiderId ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {bike.assignedRiderId ? 'Assigned' : 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insurance Expiry</span>
                    <span
                      className={`font-medium ${
                        new Date(bike.insuranceExpiry) < new Date()
                          ? 'text-destructive'
                          : 'text-foreground'
                      }`}
                    >
                      {bike.insuranceExpiry}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Maintenance</span>
                    <span className="font-medium text-foreground">
                      {bike.lastMaintenance || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-success/10 px-3 py-2 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-success">
                      Revenue
                    </p>
                    <p className="font-display text-sm font-bold text-success">
                      {formatNaira(bike.totalRevenue)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-destructive/10 px-3 py-2 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-destructive">
                      Maintenance
                    </p>
                    <p className="font-display text-sm font-bold text-destructive">
                      {formatNaira(bike.maintenanceCost)}
                    </p>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              disabled={isLoading}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                page === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MotorcyclesPage;
