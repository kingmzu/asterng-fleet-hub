
CREATE OR REPLACE FUNCTION public.enforce_trip_fare_server_side()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pricing pricing_settings%ROWTYPE;
  v_extras_total numeric := 0;
  v_distance numeric;
  v_minutes numeric;
  v_base numeric;
  v_dist_cost numeric;
  v_time_cost numeric;
  v_computed numeric;
BEGIN
  -- Staff (admin/manager/accountant) may record trips with explicit values.
  IF public.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Load active pricing tier (fall back to matching tier if snapshot pins one)
  SELECT * INTO v_pricing FROM pricing_settings WHERE is_active = true LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active pricing tier configured';
  END IF;

  v_distance := GREATEST(COALESCE(NEW.distance_km, 0), 0);
  v_minutes  := GREATEST(COALESCE(NEW.active_duration_seconds, 0) / 60.0, 0);

  -- Sum server-side extras for this trip
  SELECT COALESCE(SUM(amount), 0) INTO v_extras_total
  FROM trip_extras WHERE trip_id = NEW.id;

  v_base      := v_pricing.base_fare;
  v_dist_cost := ROUND(v_distance * v_pricing.price_per_km, 2);
  v_time_cost := ROUND(v_minutes  * v_pricing.price_per_minute, 2);
  v_computed  := ROUND(((v_base + v_dist_cost + v_time_cost) * v_pricing.rate_multiplier) + v_extras_total, 2);
  IF v_computed < v_pricing.minimum_fare THEN
    v_computed := v_pricing.minimum_fare;
  END IF;

  NEW.base_fare       := v_base;
  NEW.distance_cost   := v_dist_cost;
  NEW.time_cost       := v_time_cost;
  NEW.extras_total    := v_extras_total;
  NEW.rate_multiplier := v_pricing.rate_multiplier;
  NEW.minimum_fare    := v_pricing.minimum_fare;
  NEW.total_fare      := v_computed;
  NEW.pricing_tier    := v_pricing.tier;
  NEW.pricing_snapshot := jsonb_build_object(
    'tier', v_pricing.tier,
    'base_fare', v_pricing.base_fare,
    'price_per_km', v_pricing.price_per_km,
    'price_per_minute', v_pricing.price_per_minute,
    'minimum_fare', v_pricing.minimum_fare,
    'rate_multiplier', v_pricing.rate_multiplier,
    'pricing_id', v_pricing.id
  );

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_trip_fare_server_side() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trips_enforce_fare_ins ON public.trips;
DROP TRIGGER IF EXISTS trips_enforce_fare_upd ON public.trips;

CREATE TRIGGER trips_enforce_fare_ins
BEFORE INSERT ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.enforce_trip_fare_server_side();

CREATE TRIGGER trips_enforce_fare_upd
BEFORE UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.enforce_trip_fare_server_side();

-- Also recompute a trip's fare when its extras change (rider-added luggage etc.)
CREATE OR REPLACE FUNCTION public.trip_extras_recalc_fare()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id uuid;
BEGIN
  v_trip_id := COALESCE(NEW.trip_id, OLD.trip_id);
  IF v_trip_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  -- Touch the trip to fire the fare trigger; only non-staff rows get recomputed.
  UPDATE trips SET updated_at = now() WHERE id = v_trip_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trip_extras_recalc_fare() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trip_extras_recalc_ins ON public.trip_extras;
DROP TRIGGER IF EXISTS trip_extras_recalc_upd ON public.trip_extras;
DROP TRIGGER IF EXISTS trip_extras_recalc_del ON public.trip_extras;

CREATE TRIGGER trip_extras_recalc_ins AFTER INSERT ON public.trip_extras
FOR EACH ROW EXECUTE FUNCTION public.trip_extras_recalc_fare();
CREATE TRIGGER trip_extras_recalc_upd AFTER UPDATE ON public.trip_extras
FOR EACH ROW EXECUTE FUNCTION public.trip_extras_recalc_fare();
CREATE TRIGGER trip_extras_recalc_del AFTER DELETE ON public.trip_extras
FOR EACH ROW EXECUTE FUNCTION public.trip_extras_recalc_fare();
