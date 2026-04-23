-- 1. Harden process_remittance_with_overdue: add auth check + set recorded_by
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
  -- Authorization guard: only staff may record remittances
  IF auth.uid() IS NULL OR NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: only staff may record remittances';
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

-- 2. Force recorded_by = auth.uid() via BEFORE INSERT triggers
CREATE OR REPLACE FUNCTION public.set_recorded_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.recorded_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_recorded_by_remittances ON public.remittances;
CREATE TRIGGER trg_set_recorded_by_remittances
BEFORE INSERT ON public.remittances
FOR EACH ROW EXECUTE FUNCTION public.set_recorded_by();

DROP TRIGGER IF EXISTS trg_set_recorded_by_expenses ON public.expenses;
CREATE TRIGGER trg_set_recorded_by_expenses
BEFORE INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.set_recorded_by();

-- 3. Prevent updating recorded_by after creation
CREATE OR REPLACE FUNCTION public.prevent_recorded_by_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.recorded_by IS DISTINCT FROM OLD.recorded_by THEN
    RAISE EXCEPTION 'recorded_by cannot be changed after creation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_recorded_by_change_remittances ON public.remittances;
CREATE TRIGGER trg_prevent_recorded_by_change_remittances
BEFORE UPDATE ON public.remittances
FOR EACH ROW EXECUTE FUNCTION public.prevent_recorded_by_change();

DROP TRIGGER IF EXISTS trg_prevent_recorded_by_change_expenses ON public.expenses;
CREATE TRIGGER trg_prevent_recorded_by_change_expenses
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.prevent_recorded_by_change();

-- 4. Restrict rider PII exposure: accountants no longer see full rider rows
DROP POLICY IF EXISTS "Staff can view all riders" ON public.riders;

CREATE POLICY "Admins and managers view all riders"
ON public.riders
FOR SELECT
TO authenticated
USING (public.is_admin_or_manager(auth.uid()) OR auth.uid() = user_id);

-- Accountants get a financial-only view (no PII)
CREATE OR REPLACE VIEW public.rider_financial_view
WITH (security_invoker = true) AS
SELECT
  id, full_name, status, compliance_score,
  total_remittance, outstanding_balance,
  assigned_bike_id, join_date
FROM public.riders;

GRANT SELECT ON public.rider_financial_view TO authenticated;