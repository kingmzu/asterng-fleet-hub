import { useState, useMemo } from 'react';
import { Plus, Pencil, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import ExportDialog from '@/components/ExportDialog';
import { useExpenses, useExpenseBreakdown, useUserRoles } from '@/hooks/api';
import { useDebounce } from '@/hooks/useDebounce';
import { formatNaira } from '@/lib/mockData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ExpenseFormDialog from '@/components/forms/ExpenseFormDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

const categoryColors: Record<string, string> = {
  maintenance: 'bg-info/15 text-info',
  mechanic: 'bg-warning/15 text-warning',
  pos: 'bg-accent/20 text-accent-foreground',
  fuel: 'bg-primary/15 text-primary',
  insurance: 'bg-success/15 text-success',
  capital: 'bg-destructive/15 text-destructive',
  other: 'bg-muted text-muted-foreground',
};

type ExpenseRow = Tables<'expenses'> & { motorcycle?: { plate_number: string } | null; rider?: { full_name: string } | null };

const ExpensesPage = () => {
  const [page, setPage] = useState(1);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300).toLowerCase();
  const [formOpen, setFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Tables<'expenses'> | null>(null);

  const { data: roles = [] } = useUserRoles();
  const isAdmin = roles.includes('admin');

  const categories = ['all', 'maintenance', 'mechanic', 'fuel', 'insurance', 'pos', 'capital', 'other'];
  const { data, isLoading, error } = useExpenses(page, 20, filterCat, '');
  const { data: breakdown, isLoading: breakdownLoading } = useExpenseBreakdown();

  const allExpenses = (data?.data || []) as ExpenseRow[];
  // Client-side, case-insensitive partial search across description / plate / rider name / category
  const expenses = useMemo(() => {
    if (!search) return allExpenses;
    return allExpenses.filter((e) => {
      const haystack = [
        e.description,
        e.category,
        e.motorcycle?.plate_number,
        e.rider?.full_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [allExpenses, search]);

  const totalPages = data?.pagination.pages || 0;
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const openEdit = (expense: Tables<'expenses'>) => {
    setEditExpense(expense);
    setFormOpen(true);
  };
  const openCreate = () => {
    setEditExpense(null);
    setFormOpen(true);
  };

  const viewReceipt = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('expense-receipts')
        .createSignedUrl(path, 600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      toast({ title: 'Could not open receipt', description: e.message, variant: 'destructive' });
    }
  };

  const exportColumns = [
    { header: 'Date', accessor: (e: ExpenseRow) => e.expense_date },
    { header: 'Category', accessor: (e: ExpenseRow) => e.category },
    { header: 'Description', accessor: (e: ExpenseRow) => e.description },
    { header: 'Motorcycle', accessor: (e: ExpenseRow) => e.motorcycle?.plate_number || '' },
    { header: 'Rider', accessor: (e: ExpenseRow) => e.rider?.full_name || '' },
    { header: 'Amount (₦)', accessor: (e: ExpenseRow) => Number(e.amount) },
    { header: 'Has Receipt', accessor: (e: ExpenseRow) => (e.receipt_url ? 'Yes' : 'No') },
  ];

  const fetchAll = async (): Promise<ExpenseRow[]> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, motorcycle:motorcycles!expenses_bike_id_fkey(plate_number), rider:riders!expenses_rider_id_fkey(full_name)')
      .order('expense_date', { ascending: false });
    if (error) throw error;
    return (data || []) as any;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Expense Tracking</h1>
          <p className="text-sm text-muted-foreground">Monitor all fleet-related expenses</p>
        </div>
        <div className="flex gap-2">
          <ExportDialog
            filteredRows={expenses}
            fetchAll={fetchAll}
            columns={exportColumns}
            fileBase="expenses"
            title="Expenses"
            disabled={isLoading}
          />
          <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add Expense</Button>
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search description, rider, plate..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} onClick={() => { setFilterCat(c); setPage(1); }} disabled={isLoading}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${filterCat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50'}`}
            >{c}</button>
          ))}
        </div>
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
              <TableHead className="w-20 text-center">Receipt</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton className="h-5 w-full" /></TableCell>
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
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{e.motorcycle?.plate_number || '—'}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNaira(Number(e.amount))}</TableCell>
                    <TableCell className="text-center">
                      {e.receipt_url ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewReceipt(e.receipt_url!)} title="View receipt">
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(e)}
                        title={isAdmin ? 'Edit expense' : 'View expense (admins can edit)'}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No expenses found</TableCell>
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

      <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} expense={editExpense} />
    </div>
  );
};

export default ExpensesPage;
