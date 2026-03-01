import { useState } from 'react';
import { Search, Plus, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { mockRemittances, formatNaira } from '@/lib/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const RemittancesPage = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = mockRemittances.filter((r) => {
    const matchSearch = r.riderName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalCollected = filtered.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const totalOverdue = filtered.filter(r => r.status === 'overdue').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Remittance Tracking</h1>
          <p className="text-sm text-muted-foreground">Track daily and weekly rider payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
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
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Collected</p>
          <p className="font-display text-xl font-bold text-success">{formatNaira(totalCollected)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Overdue</p>
          <p className="font-display text-xl font-bold text-destructive">{formatNaira(totalOverdue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payments Today</p>
          <p className="font-display text-xl font-bold text-foreground">{filtered.filter(r => r.date === '2025-02-28').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Collection Rate</p>
          <p className="font-display text-xl font-bold text-primary">87%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by rider name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {['all', 'paid', 'partial', 'overdue'].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
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
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.riderName}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{r.bikeId}</TableCell>
                <TableCell className="font-semibold">{formatNaira(r.amount)}</TableCell>
                <TableCell className="hidden md:table-cell capitalize text-muted-foreground">{r.type}</TableCell>
                <TableCell className="hidden md:table-cell capitalize text-muted-foreground">{r.method}</TableCell>
                <TableCell className="text-muted-foreground">{r.date}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RemittancesPage;
