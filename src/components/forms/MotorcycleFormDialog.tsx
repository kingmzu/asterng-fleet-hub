import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useCreateMotorcycle, useUpdateMotorcycle, useDeleteMotorcycle, useRiders } from '@/hooks/api';
import type { Tables } from '@/integrations/supabase/types';

const schema = z.object({
  plate_number: z.string().trim().min(3, 'Plate number is required').max(20),
  make: z.string().trim().min(2, 'Make is required').max(50),
  model: z.string().trim().min(1, 'Model is required').max(50),
  year: z.coerce.number().min(2000).max(2030),
  color: z.string().trim().min(2, 'Color is required').max(30),
  engine_number: z.string().max(50).optional().or(z.literal('')),
  chassis_number: z.string().max(50).optional().or(z.literal('')),
  insurance_expiry_date: z.string().min(1, 'Insurance expiry is required'),
  registration_expiry_date: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'maintenance', 'suspended']),
  rider_id: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;
type Motorcycle = Tables<'motorcycles'>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorcycle?: Motorcycle | null;
}

const MotorcycleFormDialog = ({ open, onOpenChange, motorcycle }: Props) => {
  const isEdit = !!motorcycle;
  const create = useCreateMotorcycle();
  const update = useUpdateMotorcycle();
  const remove = useDeleteMotorcycle();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: ridersData } = useRiders(1, 100, 'all', '');
  const riders = ridersData?.data || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      plate_number: '', make: '', model: '', year: new Date().getFullYear(), color: '',
      engine_number: '', chassis_number: '', insurance_expiry_date: '',
      registration_expiry_date: '', status: 'active', rider_id: '',
    },
  });

  useEffect(() => {
    if (motorcycle) {
      form.reset({
        plate_number: motorcycle.plate_number, make: motorcycle.make, model: motorcycle.model,
        year: motorcycle.year, color: motorcycle.color,
        engine_number: motorcycle.engine_number || '', chassis_number: motorcycle.chassis_number || '',
        insurance_expiry_date: motorcycle.insurance_expiry_date,
        registration_expiry_date: motorcycle.registration_expiry_date || '',
        status: motorcycle.status as 'active' | 'maintenance' | 'suspended',
        rider_id: motorcycle.rider_id || '',
      });
    } else {
      form.reset();
    }
    setShowDeleteConfirm(false);
  }, [motorcycle, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        plate_number: values.plate_number,
        make: values.make,
        model: values.model,
        year: values.year,
        color: values.color,
        insurance_expiry_date: values.insurance_expiry_date,
        status: values.status,
        engine_number: values.engine_number || null,
        chassis_number: values.chassis_number || null,
        registration_expiry_date: values.registration_expiry_date || null,
        rider_id: values.rider_id || null,
      };
      if (isEdit) {
        await update.mutateAsync({ id: motorcycle.id, data: payload });
        toast({ title: 'Motorcycle updated' });
      } else {
        await create.mutateAsync(payload);
        toast({ title: 'Motorcycle registered' });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!motorcycle) return;
    try {
      await remove.mutateAsync(motorcycle.id);
      toast({ title: 'Motorcycle deleted' });
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
          <DialogTitle>{isEdit ? 'Edit Motorcycle' : 'Register Motorcycle'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="plate_number" render={({ field }) => (
                <FormItem><FormLabel>Plate Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="make" render={({ field }) => (
                <FormItem><FormLabel>Make *</FormLabel><FormControl><Input placeholder="e.g. Bajaj" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem><FormLabel>Model *</FormLabel><FormControl><Input placeholder="e.g. Boxer 150" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem><FormLabel>Year *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem><FormLabel>Color *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="rider_id" render={({ field }) => (
                <FormItem><FormLabel>Assign Rider</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {riders.map((r) => <SelectItem key={r.id} value={r.id}>{r.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="engine_number" render={({ field }) => (
                <FormItem><FormLabel>Engine Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="chassis_number" render={({ field }) => (
                <FormItem><FormLabel>Chassis Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="insurance_expiry_date" render={({ field }) => (
                <FormItem><FormLabel>Insurance Expiry *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="registration_expiry_date" render={({ field }) => (
                <FormItem><FormLabel>Registration Expiry</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

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
                <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : isEdit ? 'Update' : 'Register'}</Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MotorcycleFormDialog;
