-- Riders: only admins can delete
DROP POLICY IF EXISTS "Staff can delete riders" ON public.riders;
CREATE POLICY "Admins can delete riders"
ON public.riders FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Expenses: only admins can update / delete
DROP POLICY IF EXISTS "Staff can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Staff can delete expenses" ON public.expenses;

CREATE POLICY "Admins can update expenses"
ON public.expenses FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete expenses"
ON public.expenses FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- KYC documents: lock approved docs (only admins can mutate verified ones)
DROP POLICY IF EXISTS "Staff update kyc docs" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins delete kyc docs" ON public.kyc_documents;

CREATE POLICY "Staff update non-verified kyc docs"
ON public.kyc_documents FOR UPDATE TO authenticated
USING (
  public.is_staff(auth.uid())
  AND (status <> 'verified' OR public.has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  public.is_staff(auth.uid())
);

CREATE POLICY "Delete kyc docs (admin always, staff if not verified)"
ON public.kyc_documents FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (public.is_staff(auth.uid()) AND status <> 'verified')
);