
-- Drop permissive policies on riders
DROP POLICY IF EXISTS "Authenticated full access" ON public.riders;

-- Riders: staff can see all, riders see own
CREATE POLICY "Staff can view all riders" ON public.riders
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Staff can insert riders" ON public.riders
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update riders" ON public.riders
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete riders" ON public.riders
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- Drop permissive policies on motorcycles
DROP POLICY IF EXISTS "Authenticated full access" ON public.motorcycles;

CREATE POLICY "Staff can view all motorcycles" ON public.motorcycles
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.riders WHERE riders.assigned_bike_id = motorcycles.id AND riders.user_id = auth.uid()
  ));

CREATE POLICY "Staff can insert motorcycles" ON public.motorcycles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update motorcycles" ON public.motorcycles
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete motorcycles" ON public.motorcycles
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- Drop permissive policies on expenses
DROP POLICY IF EXISTS "Authenticated full access" ON public.expenses;

CREATE POLICY "Staff can view expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert expenses" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update expenses" ON public.expenses
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete expenses" ON public.expenses
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- Drop permissive policies on compliance_records
DROP POLICY IF EXISTS "Authenticated full access" ON public.compliance_records;

CREATE POLICY "Staff can view compliance records" ON public.compliance_records
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.riders WHERE riders.id = compliance_records.rider_id AND riders.user_id = auth.uid()
  ));

CREATE POLICY "Admin can insert compliance records" ON public.compliance_records
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin can update compliance records" ON public.compliance_records
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin can delete compliance records" ON public.compliance_records
  FOR DELETE TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));
