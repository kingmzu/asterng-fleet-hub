
-- 1. Approval columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS requested_role text,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_approval_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_approval_status_check
  CHECK (approval_status IN ('pending','approved','rejected'));

-- 2. Replace handle_new_user to capture requested_role and auto-approve founding admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_status text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'requested_role', 'rider');

  IF NEW.email = 'kingabdulkm@gmail.com' THEN
    v_status := 'approved';
  ELSIF v_role = 'rider' THEN
    v_status := 'pending'; -- riders pending until admin reviews
  ELSE
    v_status := 'pending';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, email, requested_role, approval_status, approved_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    v_role,
    v_status,
    CASE WHEN v_status = 'approved' THEN now() ELSE NULL END
  );

  -- Founding admin gets admin role automatically
  IF NEW.email = 'kingabdulkm@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Founding admin lookup helper
CREATE OR REPLACE FUNCTION public.get_founding_admin_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM auth.users WHERE email = 'kingabdulkm@gmail.com' LIMIT 1;
$$;

-- 4. Ensure founding admin (if exists) is approved + admin
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'kingabdulkm@gmail.com';
  IF v_uid IS NOT NULL THEN
    UPDATE public.profiles
      SET approval_status = 'approved', approved_at = COALESCE(approved_at, now())
      WHERE user_id = v_uid;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 5. DATA WIPE (preserve motorcycles, founding admin profile/role)
DELETE FROM public.rider_locations;
DELETE FROM public.trip_points;
DELETE FROM public.trip_extras;
DELETE FROM public.trips;
DELETE FROM public.kyc_documents;
DELETE FROM public.compliance_records;
DELETE FROM public.remittances;
DELETE FROM public.expenses;
DELETE FROM public.riders;

-- Detach motorcycles from any rider
UPDATE public.motorcycles SET rider_id = NULL, total_revenue = 0, maintenance_cost = 0, last_maintenance = NULL;

-- Wipe non-admin profiles & roles (cascade-safe: no FKs to auth.users from profiles per project rules, so we filter by founding admin)
DELETE FROM public.user_roles
  WHERE user_id <> COALESCE(public.get_founding_admin_id(), '00000000-0000-0000-0000-000000000000'::uuid);

DELETE FROM public.message_reads;
DELETE FROM public.messages;
DELETE FROM public.conversation_participants;
DELETE FROM public.conversations;

DELETE FROM public.profiles
  WHERE user_id <> COALESCE(public.get_founding_admin_id(), '00000000-0000-0000-0000-000000000000'::uuid);

-- 6. Helper: is user approved?
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND approval_status = 'approved'
  )
$$;

-- 7. Index for active-trip lookup
CREATE INDEX IF NOT EXISTS idx_trips_rider_active ON public.trips(rider_id, status) WHERE status = 'active' OR status = 'paused';

-- 8. Realtime for key tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.riders REPLICA IDENTITY FULL;
ALTER TABLE public.trips REPLICA IDENTITY FULL;
ALTER TABLE public.kyc_documents REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.riders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.kyc_documents;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
