
-- 1. Riders can view their own expenses
CREATE POLICY "Riders can view own expenses" ON public.expenses
FOR SELECT TO authenticated
USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

-- 2. Accountants (all staff) can view riders
DROP POLICY IF EXISTS "Admins and managers view all riders" ON public.riders;
CREATE POLICY "Staff and owner view riders" ON public.riders
FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()) OR auth.uid() = user_id);

-- 3. Rider storage folder must match a rider owned by the user
DROP POLICY IF EXISTS "Users upload own rider docs" ON storage.objects;
CREATE POLICY "Users upload own rider docs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'rider-documents'
  AND EXISTS (
    SELECT 1 FROM public.riders r
    WHERE r.user_id = auth.uid()
      AND r.id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "View own or admin rider docs" ON storage.objects;
CREATE POLICY "View own or admin rider docs" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'rider-documents'
  AND (
    public.is_admin_or_manager(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.riders r
      WHERE r.user_id = auth.uid()
        AND r.id::text = (storage.foldername(name))[1]
    )
  )
);

-- 4. Revoke EXECUTE on internal trigger/helper functions from client roles.
-- These are called by triggers or explicitly via SECURITY DEFINER RPCs only.
REVOKE EXECUTE ON FUNCTION public.recalc_bike_revenue(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_bike_maintenance(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_rider_compliance_score(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calc_rider_compliance_score(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_recorded_by() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_uploaded_by() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_conversation_on_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.remittances_recalc_bike_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.kyc_docs_recalc_compliance_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expenses_recalc_bike_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.riders_recalc_compliance_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_kyc_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_approval_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
