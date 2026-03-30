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
import { useCreateRemittance, useUpdateRemittance, useDeleteRemittance, useRiders, useMotorcycles, useUserRoles } from '@/hooks/api';
import type { Tables } from '@/integrations/supabase/types';

const schema = z.object({
  rider_id: z.string().min(1, 'Select a rider'),
  bike_id: z.string().min(1, 'Select a motorcycle'),
  amount: z.coerce.number().min(100, 'Minimum ₦100'),
  remittance_date: z.string().min(1, 'Date is required'),
  type: z.enum(['daily', 'weekly']),
  payment_method: z.enum(['cash', 'transfer', 'pos']),
  status: z.enum(['paid', 'partial', 'overdue']),
  reference_note: z.string().max(200).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;
type Remittance = Tables<'remittances'>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remittance?: Remittance | null;
}

const RemittanceFormDialog = ({ open, onOpenChange, remittance }: Props) => {
  const isEdit = !!remittance;
  const create = useCreateRemittance();
  const update = useUpdateRemittance();
  const remove = useDeleteRemittance();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: roles } = useUserRoles();
  const isAdmin = roles?.includes('admin');

  const { data: ridersData } = useRiders(1, 100, 'all', '');
  const { data: bikesData } = useMotorcycles(1, 100, 'all', '');

  const riders = ridersData?.data || [];
  const bikes = bikesData?.data || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      rider_id: '', bike_id: '', amount: 0,
      remittance_date: new Date().toISOString().split('T')[0],
      type: 'daily', payment_method: 'cash', status: 'paid', reference_note: '',
    },
  });

  useEffect(() => {
    if (remittance) {
      form.reset({
        rider_id: remittance.rider_id,
        bike_id: remittance.bike_id,
        amount: remittance.amount,
        remittance_date: remittance.remittance_date,
        type: remittance.type as 'daily' | 'weekly',
        payment_method: remittance.payment_method as 'cash' | 'transfer' | 'pos',
        status: remittance.status as 'paid' | 'partial' | 'overdue',
        reference_note: remittance.reference_note || '',
      });
    } else if (open) {
      form.reset();
    }
    setShowDeleteConfirm(false);
  }, [remittance, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        rider_id: values.rider_id,
        bike_id: values.bike_id,
        amount: values.amount,
        remittance_date: values.remittance_date,
        type: values.type,
        payment_method: values.payment_method,
        status: values.status,
        reference_note: values.reference_note || null,
      };
      if (isEdit) {
        if (!isAdmin) {
          toast({ title: 'Access Denied', description: 'Only admins can edit remittances', variant: 'destructive' });
          return;
        }
        await update.mutateAsync({ id: remittance.id, data: payload });
        toast({ title: 'Remittance updated' });
      } else {
        await create.mutateAsync(payload);
        toast({ title: 'Remittance logged successfully' });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!remittance || !isAdmin) return;
    try {
      await remove.mutateAsync(remittance.id);
      toast({ title: 'Remittance deleted' });
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
          <DialogTitle>{isEdit ? 'Edit Remittance' : 'Log Remittance Payment'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="rider_id" render={({ field }) => (
                <FormItem><FormLabel>Rider *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select rider" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {riders.map((r) => <SelectItem key={r.id} value={r.id}>{r.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bike_id" render={({ field }) => (
                <FormItem><FormLabel>Motorcycle *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select bike" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {bikes.map((b) => <SelectItem key={b.id} value={b.id}>{b.plate_number} - {b.make}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount (₦) *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="remittance_date" render={({ field }) => (
                <FormItem><FormLabel>Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="payment_method" render={({ field }) => (
                <FormItem><FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="pos">POS</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem><FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="reference_note" render={({ field }) => (
              <FormItem><FormLabel>Reference Note</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
            )} />

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
                <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : isEdit ? 'Update' : 'Log Payment'}</Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RemittanceFormDialog;
