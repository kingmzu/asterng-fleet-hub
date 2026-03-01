import { useState } from 'react';
import { Search, Plus, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/StatusBadge';
import { useRemittances, useRemittanceStats } from '@/hooks/api';
import { formatNaira } from '@/lib/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const RemittancesPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch remittances from API
  const { data, isLoading, error } = useRemittances(page, 20, filterStatus, search);

  // Fetch statistics from API
  const { data: stats, isLoading: statsLoading } = useRemittanceStats();

  const remittances = data?.data || [];
  const totalPages = data?.pagination.pages || 0;

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setFilterStatus(status);
    setPage(1);
  };

  const handleExport = () => {
    // TODO: Implement CSV export using useExportRemittances hook
    console.log('Export functionality coming soon');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Remittance Tracking</h1>
          <p className="text-sm text-muted-foreground">Track daily and weekly rider payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={isLoading}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Log Payment
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Collected
          </p>
          {statsLoading ? (
            <Skeleton className="mt-1 h-7 w-32" />
          ) : (
            <p className="font-display text-xl font-bold text-success">
              {formatNaira(stats?.totalCollected || 0)}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Overdue
          </p>
          {statsLoading ? (
            <Skeleton className="mt-1 h-7 w-32" />
          ) : (
            <p className="font-display text-xl font-bold text-destructive">
              {formatNaira(stats?.totalOverdue || 0)}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pending
          </p>
          {statsLoading ? (
            <Skeleton className="mt-1 h-7 w-32" />
          ) : (
            <p className="font-display text-xl font-bold text-warning">
              {stats?.pendingCount || 0}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Collection Rate
          </p>
          {statsLoading ? (
            <Skeleton className="mt-1 h-7 w-32" />
          ) : (
            <p className="font-display text-xl font-bold text-primary">
              {stats?.collectionRate || 0}%
            </p>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load remittances. Please try again.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by rider name..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'paid', 'partial', 'overdue'].map((s) => (
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

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rider</TableHead>
              <TableHead className="hidden sm:table-cell">Bike</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                  </TableRow>
                ))
              : remittances.length > 0
              ? remittances.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.riderName}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {r.bikeId}
                    </TableCell>
                    <TableCell className="font-semibold">{formatNaira(r.amount)}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize text-muted-foreground">
                      {r.type}
                    </TableCell>
                    <TableCell className="hidden md:table-cell capitalize text-muted-foreground">
                      {r.method}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.date}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                  </TableRow>
                ))
              : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No remittances found
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
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

export default RemittancesPage;
