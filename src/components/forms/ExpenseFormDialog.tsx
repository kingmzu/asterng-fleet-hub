import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useCreateExpense, useUpdateExpense, useDeleteExpense, useMotorcycles, useRiders } from '@/hooks/api';
import type { Tables } from '@/integrations/supabase/types';

const schema = z.object({
  category: z.enum(['maintenance', 'mechanic', 'fuel', 'insurance', 'pos', 'capital', 'other']),
  amount: z.coerce.number().min(1, 'Amount is required'),
  description: z.string().trim().min(3, 'Description is required').max(200),
  expense_date: z.string().min(1, 'Date is required'),
  motorcycle_id: z.string().optional().or(z.literal('')),
  rider_id: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;
type Expense = Tables<'expenses'>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}

const ExpenseFormDialog = ({ open, onOpenChange, expense }: Props) => {
  const isEdit = !!expense;
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const remove = useDeleteExpense();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: bikesData } = useMotorcycles(1, 100, 'all', '');
  const { data: ridersData } = useRiders(1, 100, 'all', '');

  const bikes = bikesData?.data || [];
  const riders = ridersData?.data || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'maintenance', amount: 0, description: '',
      expense_date: new Date().toISOString().split('T')[0],
      motorcycle_id: '', rider_id: '',
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        category: expense.category as any,
        amount: expense.amount,
        description: expense.description,
        expense_date: expense.expense_date,
        motorcycle_id: expense.motorcycle_id || '',
        rider_id: expense.rider_id || '',
      });
    } else if (open) {
      form.reset();
    }
    setShowDeleteConfirm(false);
  }, [expense, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        category: values.category,
        amount: values.amount,
        description: values.description,
        expense_date: values.expense_date,
        motorcycle_id: values.motorcycle_id || null,
        rider_id: values.rider_id || null,
      };
      if (isEdit) {
        await update.mutateAsync({ id: expense.id, data: payload });
        toast({ title: 'Expense updated successfully' });
      } else {
        await create.mutateAsync(payload);
        toast({ title: 'Expense recorded successfully' });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!expense) return;
    try {
      await remove.mutateAsync(expense.id);
      toast({ title: 'Expense deleted' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const isPending = create.isPending || update.isPending || remove.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {['maintenance', 'mechanic', 'fuel', 'insurance', 'pos', 'capital', 'other'].map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount (₦) *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="expense_date" render={({ field }) => (
                <FormItem><FormLabel>Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="motorcycle_id" render={({ field }) => (
                <FormItem><FormLabel>Motorcycle</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} value={field.value || '__none__'}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {bikes.map((b) => <SelectItem key={b.id} value={b.id}>{b.plate_number}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="rider_id" render={({ field }) => (
                <FormItem><FormLabel>Rider</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} value={field.value || '__none__'}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {riders.map((r) => <SelectItem key={r.id} value={r.id}>{r.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description *</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="flex gap-2 pt-2">
              {isEdit && !showDeleteConfirm && (
                <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={isPending}>Delete</Button>
              )}
              {showDeleteConfirm && (
                <div className="flex gap-2">
                  <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>Confirm Delete</Button>
                  <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                </div>
              )}
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : isEdit ? 'Update' : 'Add Expense'}</Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseFormDialog;
