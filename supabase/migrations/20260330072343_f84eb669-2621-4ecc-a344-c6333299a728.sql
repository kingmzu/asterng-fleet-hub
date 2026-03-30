
-- Create overdue handling function
CREATE OR REPLACE FUNCTION public.process_remittance_with_overdue(
  p_rider_id uuid,
  p_bike_id uuid,
  p_amount numeric,
  p_remittance_date date,
  p_type text,
  p_payment_method text,
  p_reference_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_overdue_balance numeric;
  v_applied_to_overdue numeric := 0;
  v_remaining numeric;
  v_status text;
  v_result jsonb;
BEGIN
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

  INSERT INTO remittances (rider_id, bike_id, amount, remittance_date, type, payment_method, status, reference_note)
  VALUES (p_rider_id, p_bike_id, p_amount, p_remittance_date, p_type, p_payment_method, v_status, p_reference_note);

  v_result := jsonb_build_object(
    'applied_to_overdue', v_applied_to_overdue,
    'applied_to_current', v_remaining,
    'status', v_status,
    'remaining_overdue', GREATEST(v_overdue_balance - p_amount, 0)
  );

  RETURN v_result;
END;
$$;

-- RLS policy for admin-only update/delete on remittances
DROP POLICY IF EXISTS "Authenticated full access" ON public.remittances;

CREATE POLICY "Staff can view remittances"
  ON public.remittances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can create remittances"
  ON public.remittances FOR INSERT
  TO authenticated
  WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Admin can update remittances"
  ON public.remittances FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete remittances"
  ON public.remittances FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
