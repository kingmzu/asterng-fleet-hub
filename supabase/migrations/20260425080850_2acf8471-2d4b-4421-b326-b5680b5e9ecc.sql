
-- Compute compliance score (0-100) from real signals
CREATE OR REPLACE FUNCTION public.calc_rider_compliance_score(p_rider_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_score integer := 0;
  v_verified_docs integer := 0;
BEGIN
  SELECT kyc_status, license_expiry_date, is_with_police, outstanding_balance, status
    INTO r
  FROM riders WHERE id = p_rider_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  -- KYC status (max 35)
  IF r.kyc_status = 'verified' THEN v_score := v_score + 35;
  ELSIF r.kyc_status = 'pending' THEN v_score := v_score + 10;
  END IF;

  -- License validity (max 25)
  IF r.license_expiry_date IS NOT NULL THEN
    IF r.license_expiry_date > CURRENT_DATE + INTERVAL '30 days' THEN
      v_score := v_score + 25;
    ELSIF r.license_expiry_date >= CURRENT_DATE THEN
      v_score := v_score + 10; -- expiring soon
    END IF;
  END IF;

  -- Not with police (max 15)
  IF NOT r.is_with_police THEN v_score := v_score + 15; END IF;

  -- No outstanding balance (max 15)
  IF COALESCE(r.outstanding_balance, 0) = 0 THEN
    v_score := v_score + 15;
  ELSIF r.outstanding_balance < 5000 THEN
    v_score := v_score + 7;
  END IF;

  -- Verified KYC docs uploaded (max 10)
  SELECT COUNT(*) INTO v_verified_docs
  FROM kyc_documents
  WHERE rider_id = p_rider_id AND status = 'verified';
  IF v_verified_docs >= 3 THEN v_score := v_score + 10;
  ELSIF v_verified_docs >= 1 THEN v_score := v_score + 5;
  END IF;

  RETURN LEAST(v_score, 100);
END;
$$;

-- Apply score to a rider row
CREATE OR REPLACE FUNCTION public.refresh_rider_compliance_score(p_rider_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_rider_id IS NULL THEN RETURN; END IF;
  UPDATE riders
  SET compliance_score = public.calc_rider_compliance_score(p_rider_id)
  WHERE id = p_rider_id;
END;
$$;

-- Trigger on riders: recalc when relevant fields change (BEFORE so we set on same row)
CREATE OR REPLACE FUNCTION public.riders_recalc_compliance_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verified_docs integer := 0;
  v_score integer := 0;
BEGIN
  -- Inline calc using NEW values
  IF NEW.kyc_status = 'verified' THEN v_score := v_score + 35;
  ELSIF NEW.kyc_status = 'pending' THEN v_score := v_score + 10;
  END IF;

  IF NEW.license_expiry_date IS NOT NULL THEN
    IF NEW.license_expiry_date > CURRENT_DATE + INTERVAL '30 days' THEN
      v_score := v_score + 25;
    ELSIF NEW.license_expiry_date >= CURRENT_DATE THEN
      v_score := v_score + 10;
    END IF;
  END IF;

  IF NOT NEW.is_with_police THEN v_score := v_score + 15; END IF;

  IF COALESCE(NEW.outstanding_balance, 0) = 0 THEN
    v_score := v_score + 15;
  ELSIF NEW.outstanding_balance < 5000 THEN
    v_score := v_score + 7;
  END IF;

  SELECT COUNT(*) INTO v_verified_docs
  FROM kyc_documents
  WHERE rider_id = NEW.id AND status = 'verified';
  IF v_verified_docs >= 3 THEN v_score := v_score + 10;
  ELSIF v_verified_docs >= 1 THEN v_score := v_score + 5;
  END IF;

  NEW.compliance_score := LEAST(v_score, 100);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_riders_recalc_compliance ON public.riders;
CREATE TRIGGER trg_riders_recalc_compliance
BEFORE INSERT OR UPDATE OF kyc_status, license_expiry_date, is_with_police, outstanding_balance, status
ON public.riders
FOR EACH ROW
EXECUTE FUNCTION public.riders_recalc_compliance_trigger();

-- Trigger on kyc_documents: refresh affected rider's score
CREATE OR REPLACE FUNCTION public.kyc_docs_recalc_compliance_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_rider_compliance_score(OLD.rider_id);
    RETURN OLD;
  END IF;
  PERFORM public.refresh_rider_compliance_score(NEW.rider_id);
  IF TG_OP = 'UPDATE' AND OLD.rider_id IS DISTINCT FROM NEW.rider_id THEN
    PERFORM public.refresh_rider_compliance_score(OLD.rider_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kyc_docs_recalc_compliance ON public.kyc_documents;
CREATE TRIGGER trg_kyc_docs_recalc_compliance
AFTER INSERT OR UPDATE OF status, rider_id OR DELETE
ON public.kyc_documents
FOR EACH ROW
EXECUTE FUNCTION public.kyc_docs_recalc_compliance_trigger();

-- Backfill all existing riders
UPDATE riders SET compliance_score = public.calc_rider_compliance_score(id);
