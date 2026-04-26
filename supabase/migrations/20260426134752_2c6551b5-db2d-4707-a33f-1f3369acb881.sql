
-- Rider live locations
CREATE TABLE IF NOT EXISTS public.rider_locations (
  rider_id uuid PRIMARY KEY,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  accuracy numeric,
  heading numeric,
  speed numeric,
  status text NOT NULL DEFAULT 'offline', -- 'offline' | 'online' | 'on_trip'
  current_trip_id uuid,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;

-- Staff can view all
CREATE POLICY "Staff view all rider locations"
ON public.rider_locations FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- Rider can view their own
CREATE POLICY "Rider views own location"
ON public.rider_locations FOR SELECT
TO authenticated
USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

-- Rider inserts their own
CREATE POLICY "Rider inserts own location"
ON public.rider_locations FOR INSERT
TO authenticated
WITH CHECK (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

-- Rider updates their own
CREATE POLICY "Rider updates own location"
ON public.rider_locations FOR UPDATE
TO authenticated
USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()))
WITH CHECK (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

-- Staff may also upsert on behalf (for staff-driven Smart Meter sessions)
CREATE POLICY "Staff insert rider locations"
ON public.rider_locations FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff update rider locations"
ON public.rider_locations FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- updated_at trigger
CREATE TRIGGER trg_rider_locations_updated
BEFORE UPDATE ON public.rider_locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_locations;
ALTER TABLE public.rider_locations REPLICA IDENTITY FULL;
