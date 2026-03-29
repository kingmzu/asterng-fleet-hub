import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useExpenses, useExpenseBreakdown } from '@/hooks/api';
import { formatNaira } from '@/lib/mockData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ExpenseFormDialog from '@/components/forms/ExpenseFormDialog';

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
  const [page, setPage] = useState(1);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);

  const categories = ['all', 'maintenance', 'mechanic', 'fuel', 'insurance', 'pos', 'capital', 'other'];
  const { data, isLoading, error } = useExpenses(page, 20, filterCat, '');
  const { data: breakdown, isLoading: breakdownLoading } = useExpenseBreakdown();

  const expenses = data?.data || [];
  const totalPages = data?.pagination.pages || 0;
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Expense Tracking</h1>
          <p className="text-sm text-muted-foreground">Monitor all fleet-related expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" disabled={isLoading}><Download className="h-4 w-4" /> Export</Button>
          <Button className="gap-2" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add Expense</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load expenses. Please try again.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {breakdownLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          : breakdown?.breakdown.map((item) => (
              <div key={item.category} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${categoryColors[item.category] || categoryColors.other}`}>
                    {item.category}
                  </span>
                </div>
                <p className="font-display text-lg font-bold text-foreground">{formatNaira(item.total)}</p>
                <p className="text-xs text-muted-foreground">{item.percentage}%</p>
              </div>
            ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button key={c} onClick={() => { setFilterCat(c); setPage(1); }} disabled={isLoading}
            className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${filterCat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50'}`}
          >{c}</button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Filtered Total</p>
        {isLoading ? <Skeleton className="mt-1 h-8 w-40" /> : <p className="font-display text-2xl font-bold text-foreground">{formatNaira(totalExpenses)}</p>}
      </div>

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
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              : expenses.length > 0
              ? expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{e.expense_date}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${categoryColors[e.category] || categoryColors.other}`}>
                        {e.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{e.description}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{e.motorcycle_id || '—'}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNaira(Number(e.amount))}</TableCell>
                  </TableRow>
                ))
              : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No expenses found</TableCell>
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

      <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
};

export default ExpensesPage;
