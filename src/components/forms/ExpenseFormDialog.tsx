import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, FileText, Eye, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  useCreateExpense, useUpdateExpense, useDeleteExpense,
  useMotorcycles, useRiders, useUserRoles,
} from '@/hooks/api';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

const RECEIPT_BUCKET = 'expense-receipts';
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;
const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const schema = z.object({
  category: z.enum(['maintenance', 'mechanic', 'fuel', 'insurance', 'pos', 'capital', 'other']),
  amount: z.coerce.number().min(1, 'Amount is required'),
  description: z.string().trim().min(3, 'Description is required').max(200),
  expense_date: z.string().min(1, 'Date is required'),
  motorcycle_id: z.string().optional().or(z.literal('')),
  rider_id: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;
type Expense = Tables<'expenses'> & { receipt_url?: string | null };

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
  const isAdmin = roles.includes('admin') || roles.includes('operations_manager');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setExistingReceiptUrl((expense as any).receipt_url || null);
    } else if (open) {
      form.reset();
      setExistingReceiptUrl(null);
    }
    setReceiptFile(null);
    setShowDeleteConfirm(false);
  }, [expense, open]);

  const handleFilePick = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_RECEIPT_SIZE) {
      toast({ title: 'File too large', description: 'Receipt must be 5MB or less.', variant: 'destructive' });
      return;
    }
    if (!RECEIPT_TYPES.includes(file.type)) {
      toast({ title: 'Unsupported type', description: 'Use JPG, PNG or PDF.', variant: 'destructive' });
      return;
    }
    setReceiptFile(file);
  };

  const previewReceipt = async () => {
    if (!existingReceiptUrl) return;
    setPreviewing(true);
    try {
      const { data, error } = await supabase.storage
        .from(RECEIPT_BUCKET)
        .createSignedUrl(existingReceiptUrl, 600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      toast({ title: 'Preview failed', description: e.message, variant: 'destructive' });
    } finally {
      setPreviewing(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    // Receipt is REQUIRED for new submissions and edits per spec
    if (!receiptFile && !existingReceiptUrl) {
      toast({ title: 'Receipt required', description: 'Please attach a receipt (JPG, PNG, or PDF).', variant: 'destructive' });
      return;
    }

    let receiptPath = existingReceiptUrl;
    if (receiptFile) {
      setUploadingReceipt(true);
      try {
        const ext = receiptFile.name.split('.').pop() || 'bin';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from(RECEIPT_BUCKET)
          .upload(path, receiptFile, { upsert: false, contentType: receiptFile.type });
        if (error) throw error;
        receiptPath = path;
      } catch (e: any) {
        setUploadingReceipt(false);
        toast({ title: 'Receipt upload failed', description: e.message, variant: 'destructive' });
        return;
      }
      setUploadingReceipt(false);
    }

    try {
      const payload: any = {
        category: values.category,
        amount: values.amount,
        description: values.description,
        expense_date: values.expense_date,
        motorcycle_id: values.motorcycle_id || null,
        rider_id: values.rider_id || null,
        receipt_url: receiptPath,
      };
      if (isEdit) {
        await update.mutateAsync({ id: expense!.id, data: payload });
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

  const isPending = create.isPending || update.isPending || remove.isPending || uploadingReceipt;
  // Non-admin can ADD only. Admin can edit/delete.
  const canEdit = !isEdit || isAdmin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? (canEdit ? 'Edit Expense' : 'Expense Details') : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        {isEdit && !canEdit && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
            Only admins can edit or delete expenses. You're viewing in read-only mode.
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <fieldset disabled={!canEdit} className="space-y-4 disabled:opacity-90">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit}>
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
                    <Select onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} value={field.value || '__none__'} disabled={!canEdit}>
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
                    <Select onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} value={field.value || '__none__'} disabled={!canEdit}>
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
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Upload Receipt <span className="text-destructive">*</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">Required. JPG, PNG, or PDF — max 5MB.</p>
                  </div>
                  {existingReceiptUrl && (
                    <Button type="button" size="sm" variant="outline" className="gap-1" onClick={previewReceipt} disabled={previewing}>
                      <Eye className="h-3.5 w-3.5" /> {previewing ? 'Opening…' : 'View receipt'}
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFilePick(e.target.files?.[0] || null)}
                  />
                  <Button type="button" variant="outline" className="gap-2" onClick={() => fileRef.current?.click()} disabled={!canEdit || uploadingReceipt}>
                    {uploadingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {receiptFile ? 'Change file' : existingReceiptUrl ? 'Replace receipt' : 'Choose receipt'}
                  </Button>
                  <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {receiptFile ? receiptFile.name : existingReceiptUrl ? 'Existing receipt attached' : 'No file selected'}
                    </span>
                  </div>
                </div>
              </div>
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
                {canEdit && (
                  <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : isEdit ? 'Update' : 'Add Expense'}</Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseFormDialog;
