import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockExpenses, formatNaira } from '@/lib/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const categoryColors: Record<string, string> = {
  maintenance: 'bg-info/15 text-info',
  mechanic: 'bg-warning/15 text-warning',
  pos: 'bg-accent/20 text-accent-foreground',
  fuel: 'bg-primary/15 text-primary',
  insurance: 'bg-success/15 text-success',
  capital: 'bg-destructive/15 text-destructive',
  other: 'bg-muted text-muted-foreground',
};

const ExpensesPage = () => {
  const [filterCat, setFilterCat] = useState<string>('all');

  const categories = ['all', 'maintenance', 'mechanic', 'fuel', 'insurance', 'pos', 'capital', 'other'];

  const filtered = filterCat === 'all' ? mockExpenses : mockExpenses.filter(e => e.category === filterCat);
  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);

  const categoryTotals = mockExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Expense Tracking</h1>
          <p className="text-sm text-muted-foreground">Monitor all fleet-related expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(categoryTotals).map(([cat, total]) => (
          <div key={cat} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${categoryColors[cat]}`}>{cat}</span>
            </div>
            <p className="font-display text-lg font-bold text-foreground">{formatNaira(total)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${filterCat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Total */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Filtered Total</p>
        <p className="font-display text-2xl font-bold text-foreground">{formatNaira(totalExpenses)}</p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden sm:table-cell">Bike</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-muted-foreground">{e.date}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${categoryColors[e.category]}`}>{e.category}</span>
                </TableCell>
                <TableCell className="font-medium">{e.description}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{e.bikeId || '—'}</TableCell>
                <TableCell className="text-right font-semibold">{formatNaira(e.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ExpensesPage;
