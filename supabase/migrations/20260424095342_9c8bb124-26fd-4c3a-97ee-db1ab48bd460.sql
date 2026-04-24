-- 1. Add receipt_url to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_url text;

-- 2. Create expense-receipts bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for expense receipts
DROP POLICY IF EXISTS "Staff view expense receipts" ON storage.objects;
CREATE POLICY "Staff view expense receipts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'expense-receipts' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff upload expense receipts" ON storage.objects;
CREATE POLICY "Staff upload expense receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'expense-receipts' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff update expense receipts" ON storage.objects;
CREATE POLICY "Staff update expense receipts"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'expense-receipts' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'expense-receipts' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins delete expense receipts" ON storage.objects;
CREATE POLICY "Admins delete expense receipts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'expense-receipts' AND public.is_admin_or_manager(auth.uid()));

-- 3. Recalculate motorcycle maintenance from expenses
CREATE OR REPLACE FUNCTION public.recalc_bike_maintenance(p_bike_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_bike_id IS NULL THEN RETURN; END IF;
  UPDATE motorcycles m
  SET
    maintenance_cost = COALESCE((
      SELECT SUM(amount) FROM expenses
      WHERE motorcycle_id = p_bike_id AND category IN ('maintenance', 'mechanic')
    ), 0),
    last_maintenance = (
      SELECT MAX(expense_date) FROM expenses
      WHERE motorcycle_id = p_bike_id AND category IN ('maintenance', 'mechanic')
    )
  WHERE m.id = p_bike_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.expenses_recalc_bike_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_bike_maintenance(OLD.motorcycle_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_bike_maintenance(NEW.motorcycle_id);
  IF TG_OP = 'UPDATE' AND OLD.motorcycle_id IS DISTINCT FROM NEW.motorcycle_id THEN
    PERFORM public.recalc_bike_maintenance(OLD.motorcycle_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_expenses_recalc_bike ON public.expenses;
CREATE TRIGGER trg_expenses_recalc_bike
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.expenses_recalc_bike_trigger();

-- 4. Recalculate motorcycle revenue from remittances
CREATE OR REPLACE FUNCTION public.recalc_bike_revenue(p_bike_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_bike_id IS NULL THEN RETURN; END IF;
  UPDATE motorcycles m
  SET total_revenue = COALESCE((
    SELECT SUM(amount) FROM remittances WHERE bike_id = p_bike_id
  ), 0)
  WHERE m.id = p_bike_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.remittances_recalc_bike_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_bike_revenue(OLD.bike_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_bike_revenue(NEW.bike_id);
  IF TG_OP = 'UPDATE' AND OLD.bike_id IS DISTINCT FROM NEW.bike_id THEN
    PERFORM public.recalc_bike_revenue(OLD.bike_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_remittances_recalc_bike ON public.remittances;
CREATE TRIGGER trg_remittances_recalc_bike
AFTER INSERT OR UPDATE OR DELETE ON public.remittances
FOR EACH ROW EXECUTE FUNCTION public.remittances_recalc_bike_trigger();

-- 5. Backfill existing motorcycles
DO $$
DECLARE bike_row RECORD;
BEGIN
  FOR bike_row IN SELECT id FROM motorcycles LOOP
    PERFORM public.recalc_bike_maintenance(bike_row.id);
    PERFORM public.recalc_bike_revenue(bike_row.id);
  END LOOP;
END $$;