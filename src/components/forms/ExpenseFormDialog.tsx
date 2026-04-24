import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, FileText, Eye, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useMotorcycles,
  useRiders,
  useUserRoles,
} from '@/hooks/api';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

const RECEIPT_BUCKET = 'expense-receipts';
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;
const ACCEPTED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const schema = z.object({
  category: z.enum(['maintenance', 'mechanic', 'fuel', 'insurance', 'pos', 'capital', 'other']),
  amount: z.coerce.number().min(1, 'Amount is required'),
  description: z.string().trim().min(3, 'Description is required').max(200),
  expense_date: z.string().min(1, 'Date is required'),
  motorcycle_id: z.string().optional().or(z.literal('')),
  rider_id: z.string().optional().or(z.literal('')),
  receipt_url: z.string().min(1, 'Receipt is required'),
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
  const { data: roles = [] } = useUserRoles();
  const isAdmin = roles.includes('admin');
  const canMutateThis = !isEdit || isAdmin;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptName, setReceiptName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: bikesData } = useMotorcycles(1, 100, 'all', '');
  const { data: ridersData } = useRiders(1, 100, 'all', '');

  const bikes = bikesData?.data || [];
  const riders = ridersData?.data || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'maintenance',
      amount: 0,
      description: '',
      expense_date: new Date().toISOString().split('T')[0],
      motorcycle_id: '',
      rider_id: '',
      receipt_url: '',
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
        receipt_url: expense.receipt_url || '',
      });
      setReceiptName(expense.receipt_url ? expense.receipt_url.split('/').pop() || 'receipt' : '');
    } else if (open) {
      form.reset();
      setReceiptName('');
    }
    setShowDeleteConfirm(false);
  }, [expense, open]);

  const handleReceiptUpload = async (file: File) => {
    if (!ACCEPTED_RECEIPT_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Receipt must be JPG, PNG, or PDF.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > MAX_RECEIPT_SIZE) {
      toast({ title: 'File too large', description: 'Max receipt size is 5MB.', variant: 'destructive' });
      return;
    }
    setUploadingReceipt(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from(RECEIPT_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      form.setValue('receipt_url', path, { shouldValidate: true });
      setReceiptName(file.name);
      toast({ title: 'Receipt uploaded' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const previewReceipt = async () => {
    const path = form.getValues('receipt_url');
    if (!path) return;
    try {
      const { data, error } = await supabase.storage
        .from(RECEIPT_BUCKET)
        .createSignedUrl(path, 600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      toast({ title: 'Preview failed', description: e.message, variant: 'destructive' });
    }
  };

  const clearReceipt = () => {
    form.setValue('receipt_url', '', { shouldValidate: true });
    setReceiptName('');
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        category: values.category,
        amount: values.amount,
        description: values.description,
        expense_date: values.expense_date,
        motorcycle_id: values.motorcycle_id || null,
        rider_id: values.rider_id || null,
        receipt_url: values.receipt_url,
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
  const receiptUrl = form.watch('receipt_url');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        {isEdit && !isAdmin && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
            Only admins can edit or delete existing expenses.
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <fieldset disabled={!canMutateThis} className="space-y-4 disabled:opacity-70">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canMutateThis}>
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
                    <Select onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} value={field.value || '__none__'} disabled={!canMutateThis}>
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
                    <Select onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} value={field.value || '__none__'} disabled={!canMutateThis}>
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

              {/* Receipt upload */}
              <FormField
                control={form.control}
                name="receipt_url"
                render={() => (
                  <FormItem>
                    <FormLabel>Upload Receipt *</FormLabel>
                    <div className="space-y-2">
                      {receiptUrl ? (
                        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2">
                          <FileText className="h-4 w-4 text-success shrink-0" />
                          <span className="flex-1 truncate text-sm text-foreground">{receiptName || 'Receipt attached'}</span>
                          <Button type="button" size="sm" variant="outline" onClick={previewReceipt} className="h-8 gap-1">
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                          {canMutateThis && (
                            <>
                              <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingReceipt} className="h-8 gap-1">
                                {uploadingReceipt ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                Replace
                              </Button>
                              <Button type="button" size="sm" variant="ghost" onClick={clearReceipt} className="h-8 px-2 text-destructive">
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingReceipt || !canMutateThis}
                          className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/20 py-5 text-xs text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                        >
                          {uploadingReceipt ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              <span>Uploading receipt…</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-5 w-5" />
                              <span>Click to upload receipt (JPG, PNG, PDF — max 5MB)</span>
                            </>
                          )}
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleReceiptUpload(f);
                          e.target.value = '';
                        }}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <div className="flex gap-2 pt-2">
              {isEdit && isAdmin && !showDeleteConfirm && (
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
                <Button type="submit" disabled={isPending || uploadingReceipt || !canMutateThis}>
                  {isPending ? 'Saving...' : isEdit ? 'Update' : 'Add Expense'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseFormDialog;
