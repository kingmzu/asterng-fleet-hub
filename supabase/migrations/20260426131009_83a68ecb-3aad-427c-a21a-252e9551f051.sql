
-- Pricing settings
CREATE TABLE public.pricing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL DEFAULT 'tier_1',
  base_fare NUMERIC NOT NULL DEFAULT 500,
  price_per_km NUMERIC NOT NULL DEFAULT 150,
  price_per_minute NUMERIC NOT NULL DEFAULT 30,
  minimum_fare NUMERIC NOT NULL DEFAULT 700,
  rate_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view pricing"
  ON public.pricing_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage pricing"
  ON public.pricing_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER pricing_settings_updated_at BEFORE UPDATE ON public.pricing_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure only one active tier
CREATE UNIQUE INDEX pricing_settings_one_active ON public.pricing_settings (is_active) WHERE is_active = true;

-- Trips
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES public.riders(id) ON DELETE CASCADE,
  motorcycle_id UUID REFERENCES public.motorcycles(id) ON DELETE SET NULL,
  started_by UUID,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  paused_duration_seconds INTEGER NOT NULL DEFAULT 0,
  active_duration_seconds INTEGER NOT NULL DEFAULT 0,
  start_lat NUMERIC,
  start_lng NUMERIC,
  start_address TEXT,
  end_lat NUMERIC,
  end_lng NUMERIC,
  end_address TEXT,
  distance_km NUMERIC NOT NULL DEFAULT 0,
  base_fare NUMERIC NOT NULL DEFAULT 0,
  distance_cost NUMERIC NOT NULL DEFAULT 0,
  time_cost NUMERIC NOT NULL DEFAULT 0,
  extras_total NUMERIC NOT NULL DEFAULT 0,
  rate_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  minimum_fare NUMERIC NOT NULL DEFAULT 0,
  total_fare NUMERIC NOT NULL DEFAULT 0,
  pricing_tier TEXT,
  pricing_snapshot JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view all trips"
  ON public.trips FOR SELECT TO authenticated
  USING (is_staff(auth.uid()));
CREATE POLICY "Riders view own trips"
  ON public.trips FOR SELECT TO authenticated
  USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));
CREATE POLICY "Staff insert trips"
  ON public.trips FOR INSERT TO authenticated
  WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Riders insert own trips"
  ON public.trips FOR INSERT TO authenticated
  WITH CHECK (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));
CREATE POLICY "Staff update trips"
  ON public.trips FOR UPDATE TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Riders update own trips"
  ON public.trips FOR UPDATE TO authenticated
  USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()))
  WITH CHECK (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));
CREATE POLICY "Admins delete trips"
  ON public.trips FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX trips_rider_idx ON public.trips(rider_id);
CREATE INDEX trips_status_idx ON public.trips(status);

-- Trip extras
CREATE TABLE public.trip_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View extras if can view trip"
  ON public.trip_extras FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id
    AND (is_staff(auth.uid()) OR t.rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()))));
CREATE POLICY "Insert extras if owns trip"
  ON public.trip_extras FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id
    AND (is_staff(auth.uid()) OR t.rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()))));
CREATE POLICY "Delete extras if owns trip"
  ON public.trip_extras FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id
    AND (is_staff(auth.uid()) OR t.rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()))));

-- Trip GPS points
CREATE TABLE public.trip_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View points if can view trip"
  ON public.trip_points FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id
    AND (is_staff(auth.uid()) OR t.rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()))));
CREATE POLICY "Insert points if owns trip"
  ON public.trip_points FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id
    AND (is_staff(auth.uid()) OR t.rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()))));

CREATE INDEX trip_points_trip_idx ON public.trip_points(trip_id, recorded_at);

-- Seed default tier
INSERT INTO public.pricing_settings (tier, base_fare, price_per_km, price_per_minute, minimum_fare, rate_multiplier, is_active)
VALUES ('tier_1', 500, 150, 30, 700, 1.0, true);
