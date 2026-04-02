-- Fix remittances SELECT policy: replace USING(true) with role-scoped access
DROP POLICY IF EXISTS "Staff can view remittances" ON public.remittances;

CREATE POLICY "Staff can view remittances" ON public.remittances
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Riders view own remittances" ON public.remittances
  FOR SELECT TO authenticated
  USING (rider_id IN (
    SELECT id FROM public.riders WHERE user_id = auth.uid()
  ));

-- Add UPDATE and DELETE policies for rider-documents storage
CREATE POLICY "Staff can update rider documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'rider-documents' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'rider-documents' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete rider documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'rider-documents' AND public.is_staff(auth.uid()));