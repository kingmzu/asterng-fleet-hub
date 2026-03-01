import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/StatusBadge';
import { useRiders } from '@/hooks/api';
import { formatNaira } from '@/lib/mockData';

const RidersPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch riders from API
  const { data, isLoading, error } = useRiders(page, 12, filterStatus, search);

  const riders = data?.data || [];
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
          <h1 className="font-display text-2xl font-bold text-foreground">Rider Management</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${data?.pagination.total || 0} registered riders`}
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Rider
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'suspended', 'pending'].map((s) => (
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
          Failed to load riders. Please try again.
        </div>
      )}

      {/* Rider cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))
          : riders.length > 0
          ? riders.map((rider) => (
              <div
                key={rider.id}
                className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                      {rider.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{rider.name}</h3>
                      <p className="text-xs text-muted-foreground">{rider.phone}</p>
                    </div>
                  </div>
                  <StatusBadge status={rider.status} />
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Compliance
                    </p>
                    <p
                      className={`font-display text-lg font-bold ${
                        rider.complianceScore >= 80
                          ? 'text-success'
                          : rider.complianceScore >= 50
                          ? 'text-warning'
                          : 'text-destructive'
                      }`}
                    >
                      {rider.complianceScore}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Total Paid
                    </p>
                    <p className="font-display text-lg font-bold text-foreground">
                      {formatNaira(rider.totalRemittance)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span
                    className={`rounded-full border px-2 py-0.5 ${
                      rider.kycStatus === 'verified'
                        ? 'border-success/30 bg-success/10 text-success'
                        : 'border-warning/30 bg-warning/10 text-warning'
                    }`}
                  >
                    KYC: {rider.kycStatus}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 ${
                      rider.policeClearance
                        ? 'border-success/30 bg-success/10 text-success'
                        : 'border-destructive/30 bg-destructive/10 text-destructive'
                    }`}
                  >
                    Police: {rider.policeClearance ? 'Clear' : 'Pending'}
                  </span>
                  {rider.assignedBikeId && (
                    <span className="rounded-full border border-info/30 bg-info/10 px-2 py-0.5 text-info">
                      Bike: {rider.assignedBikeId}
                    </span>
                  )}
                </div>

                {rider.outstandingBalance > 0 && (
                  <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
                    <p className="text-xs font-medium text-destructive">
                      Outstanding: {formatNaira(rider.outstandingBalance)}
                    </p>
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

export default RidersPage;
