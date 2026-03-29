import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useCreateRider, useUpdateRider, useDeleteRider } from '@/hooks/api';
import type { Tables } from '@/integrations/supabase/types';

const riderSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone_number: z.string().trim().min(10, 'Enter a valid phone number').max(15),
  national_id: z.string().trim().min(5, 'National ID is required').max(30),
  rider_license_number: z.string().trim().min(3, 'License number is required').max(30),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  home_address: z.string().max(200).optional().or(z.literal('')),
  license_expiry_date: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'suspended', 'pending']),
  is_with_police: z.boolean(),
  police_station_name: z.string().max(100).optional().or(z.literal('')),
  police_case_reference: z.string().max(100).optional().or(z.literal('')),
});

type RiderFormValues = z.infer<typeof riderSchema>;
type Rider = Tables<'riders'>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rider?: Rider | null;
}

const RiderFormDialog = ({ open, onOpenChange, rider }: Props) => {
  const isEdit = !!rider;
  const createRider = useCreateRider();
  const updateRider = useUpdateRider();
  const deleteRider = useDeleteRider();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<RiderFormValues>({
    resolver: zodResolver(riderSchema),
    defaultValues: {
      full_name: '', phone_number: '', national_id: '', rider_license_number: '',
      email: '', home_address: '', license_expiry_date: '', status: 'pending',
      is_with_police: false, police_station_name: '', police_case_reference: '',
    },
  });

  useEffect(() => {
    if (rider) {
      form.reset({
        full_name: rider.full_name, phone_number: rider.phone_number,
        national_id: rider.national_id, rider_license_number: rider.rider_license_number,
        email: rider.email || '', home_address: rider.home_address || '',
        license_expiry_date: rider.license_expiry_date || '',
        status: rider.status as 'active' | 'suspended' | 'pending',
        is_with_police: rider.is_with_police,
        police_station_name: rider.police_station_name || '',
        police_case_reference: rider.police_case_reference || '',
      });
    } else {
      form.reset();
    }
  }, [rider, open]);

  const onSubmit = async (values: RiderFormValues) => {
    try {
      const payload = {
        full_name: values.full_name,
        phone_number: values.phone_number,
        national_id: values.national_id,
        rider_license_number: values.rider_license_number,
        status: values.status,
        is_with_police: values.is_with_police,
        email: values.email || null,
        home_address: values.home_address || null,
        license_expiry_date: values.license_expiry_date || null,
        police_station_name: values.police_station_name || null,
        police_case_reference: values.police_case_reference || null,
      };
      if (isEdit) {
        await updateRider.mutateAsync({ id: rider.id, data: payload });
        toast({ title: 'Rider updated successfully' });
      } else {
        await createRider.mutateAsync(payload);
        toast({ title: 'Rider added successfully' });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!rider) return;
    try {
      await deleteRider.mutateAsync(rider.id);
      toast({ title: 'Rider deleted' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const isPending = createRider.isPending || updateRider.isPending || deleteRider.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Rider' : 'Add New Rider'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone_number" render={({ field }) => (
                <FormItem><FormLabel>Phone Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="national_id" render={({ field }) => (
                <FormItem><FormLabel>National ID *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="rider_license_number" render={({ field }) => (
                <FormItem><FormLabel>License Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="license_expiry_date" render={({ field }) => (
                <FormItem><FormLabel>License Expiry</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="home_address" render={({ field }) => (
              <FormItem><FormLabel>Home Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="is_with_police" render={({ field }) => (
                <FormItem className="flex items-center gap-3 pt-6">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!mt-0">With Police</FormLabel>
                </FormItem>
              )} />
            </div>
            {form.watch('is_with_police') && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="police_station_name" render={({ field }) => (
                  <FormItem><FormLabel>Police Station</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="police_case_reference" render={({ field }) => (
                  <FormItem><FormLabel>Case Reference</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            )}

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
                <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : isEdit ? 'Update' : 'Add Rider'}</Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RiderFormDialog;
