-- 1. Guard approval_status on profiles (prevent self-approval)
CREATE OR REPLACE FUNCTION public.guard_approval_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.requested_role IS DISTINCT FROM OLD.requested_role THEN
    IF NOT public.is_admin_or_manager(auth.uid()) THEN
      RAISE EXCEPTION 'Only admins or operations managers may change approval fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_approval_status ON public.profiles;
CREATE TRIGGER trg_guard_approval_status
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_approval_status_change();

-- 2. Remittance amount validation in RPC + CHECK constraint
CREATE OR REPLACE FUNCTION public.process_remittance_with_overdue(
  p_rider_id uuid, p_bike_id uuid, p_amount numeric, p_remittance_date date,
  p_type text, p_payment_method text, p_reference_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_overdue_balance numeric;
  v_applied_to_overdue numeric := 0;
  v_remaining numeric;
  v_status text;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: only staff may record remittances';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  IF p_type NOT IN ('daily','weekly') THEN
    RAISE EXCEPTION 'Invalid remittance type';
  END IF;

  IF p_payment_method NOT IN ('cash','bank_transfer','mobile_money','card') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  SELECT COALESCE(outstanding_balance, 0) INTO v_overdue_balance
  FROM riders WHERE id = p_rider_id;

  v_remaining := p_amount;

  IF v_overdue_balance > 0 THEN
    IF p_amount >= v_overdue_balance THEN
      v_applied_to_overdue := v_overdue_balance;
      v_remaining := p_amount - v_overdue_balance;
      UPDATE riders SET outstanding_balance = 0 WHERE id = p_rider_id;
    ELSE
      v_applied_to_overdue := p_amount;
      v_remaining := 0;
      UPDATE riders SET outstanding_balance = outstanding_balance - p_amount WHERE id = p_rider_id;
    END IF;
  END IF;

  IF v_remaining > 0 THEN
    v_status := 'paid';
  ELSIF v_applied_to_overdue > 0 AND v_remaining = 0 THEN
    v_status := 'partial';
  ELSE
    v_status := 'paid';
  END IF;

  UPDATE riders SET total_remittance = total_remittance + p_amount WHERE id = p_rider_id;

  INSERT INTO remittances (rider_id, bike_id, amount, remittance_date, type, payment_method, status, reference_note, recorded_by)
  VALUES (p_rider_id, p_bike_id, p_amount, p_remittance_date, p_type, p_payment_method, v_status, p_reference_note, auth.uid());

  v_result := jsonb_build_object(
    'applied_to_overdue', v_applied_to_overdue,
    'applied_to_current', v_remaining,
    'status', v_status,
    'remaining_overdue', GREATEST(v_overdue_balance - p_amount, 0)
  );

  RETURN v_result;
END;
$function$;

ALTER TABLE public.remittances
  DROP CONSTRAINT IF EXISTS remittances_amount_positive;
ALTER TABLE public.remittances
  ADD CONSTRAINT remittances_amount_positive CHECK (amount > 0);

-- 3. Force remittance creation through RPC (drop direct insert policy)
DROP POLICY IF EXISTS "Staff can create remittances" ON public.remittances;

-- 4. Restrict execute on internal helper functions
REVOKE EXECUTE ON FUNCTION public.get_founding_admin_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_bike_revenue(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_bike_maintenance(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_rider_compliance_score(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calc_rider_compliance_score(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_recorded_by() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_uploaded_by() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_recorded_by_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_kyc_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_approval_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_conversation_on_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expenses_recalc_bike_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.remittances_recalc_bike_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.kyc_docs_recalc_compliance_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.riders_recalc_compliance_trigger() FROM PUBLIC, anon, authenticated;

-- 5. Storage policies for motorcycle-documents (DELETE/UPDATE by staff)
CREATE POLICY "Staff can update motorcycle documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'motorcycle-documents' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'motorcycle-documents' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete motorcycle documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'motorcycle-documents' AND public.is_staff(auth.uid()));
