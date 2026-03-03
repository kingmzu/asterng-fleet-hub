
-- =============================================
-- COMPREHENSIVE SCHEMA MIGRATION
-- =============================================

-- 1. RIDERS TABLE MODIFICATIONS
ALTER TABLE public.riders RENAME COLUMN name TO full_name;
ALTER TABLE public.riders RENAME COLUMN phone TO phone_number;
ALTER TABLE public.riders RENAME COLUMN photo_url TO profile_image_url;
ALTER TABLE public.riders RENAME COLUMN license_number TO rider_license_number;
ALTER TABLE public.riders RENAME COLUMN police_clearance TO is_with_police;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS home_address text;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS rider_license_image_url text;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS license_expiry_date date;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS police_station_name text;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS police_case_reference text;

-- 2. MOTORCYCLES TABLE MODIFICATIONS
ALTER TABLE public.motorcycles RENAME COLUMN assigned_rider_id TO rider_id;
ALTER TABLE public.motorcycles RENAME COLUMN registration_number TO plate_number;
ALTER TABLE public.motorcycles RENAME COLUMN insurance_expiry TO insurance_expiry_date;
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS engine_number text;
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS chassis_number text;
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS registration_expiry_date date;
ALTER TABLE public.motorcycles ADD CONSTRAINT motorcycles_plate_number_unique UNIQUE (plate_number);

-- 3. REMITTANCES TABLE MODIFICATIONS
ALTER TABLE public.remittances RENAME COLUMN date TO remittance_date;
ALTER TABLE public.remittances RENAME COLUMN method TO payment_method;
ALTER TABLE public.remittances ADD COLUMN IF NOT EXISTS reference_note text;
ALTER TABLE public.remittances ADD COLUMN IF NOT EXISTS recorded_by uuid;

-- 4. EXPENSES TABLE MODIFICATIONS
ALTER TABLE public.expenses RENAME COLUMN bike_id TO motorcycle_id;
ALTER TABLE public.expenses RENAME COLUMN date TO expense_date;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS rider_id uuid REFERENCES public.riders(id) ON DELETE SET NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS recorded_by uuid;

-- 5. PROFILES TABLE MODIFICATIONS
ALTER TABLE public.profiles RENAME COLUMN phone TO phone_number;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_address text;

-- 6. CREATE COMPLIANCE_RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.compliance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES public.riders(id) ON DELETE CASCADE,
  compliance_type text NOT NULL CHECK (compliance_type IN ('license', 'police_case', 'insurance', 'registration')),
  document_url text,
  status text NOT NULL DEFAULT 'under_review' CHECK (status IN ('valid', 'expired', 'under_review')),
  notes text,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;

-- 7. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('rider-documents', 'rider-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-avatars', 'profile-avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('motorcycle-documents', 'motorcycle-documents', false) ON CONFLICT DO NOTHING;

-- 8. DROP OLD RLS POLICIES
DROP POLICY IF EXISTS "Admins can delete riders" ON public.riders;
DROP POLICY IF EXISTS "Riders can view own record" ON public.riders;
DROP POLICY IF EXISTS "Staff can insert riders" ON public.riders;
DROP POLICY IF EXISTS "Staff can update riders" ON public.riders;
DROP POLICY IF EXISTS "Staff can view all riders" ON public.riders;

DROP POLICY IF EXISTS "Admins can delete motorcycles" ON public.motorcycles;
DROP POLICY IF EXISTS "Staff can insert motorcycles" ON public.motorcycles;
DROP POLICY IF EXISTS "Staff can update motorcycles" ON public.motorcycles;
DROP POLICY IF EXISTS "Staff can view motorcycles" ON public.motorcycles;

DROP POLICY IF EXISTS "Admins can delete remittances" ON public.remittances;
DROP POLICY IF EXISTS "Riders can view own remittances" ON public.remittances;
DROP POLICY IF EXISTS "Staff can insert remittances" ON public.remittances;
DROP POLICY IF EXISTS "Staff can update remittances" ON public.remittances;
DROP POLICY IF EXISTS "Staff can view all remittances" ON public.remittances;

DROP POLICY IF EXISTS "Admins can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Staff can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Staff can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Staff can view expenses" ON public.expenses;

-- 9. NEW RLS POLICIES - RIDERS
CREATE POLICY "Admin/manager can insert riders" ON public.riders FOR INSERT TO authenticated WITH CHECK (is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin/manager can update riders" ON public.riders FOR UPDATE TO authenticated USING (is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin/manager can delete riders" ON public.riders FOR DELETE TO authenticated USING (is_admin_or_manager(auth.uid()));
CREATE POLICY "Staff can view all riders" ON public.riders FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Riders can view own record" ON public.riders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Riders can update own profile" ON public.riders FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 10. NEW RLS POLICIES - MOTORCYCLES
CREATE POLICY "Admin/manager insert motorcycles" ON public.motorcycles FOR INSERT TO authenticated WITH CHECK (is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin/manager update motorcycles" ON public.motorcycles FOR UPDATE TO authenticated USING (is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin/manager delete motorcycles" ON public.motorcycles FOR DELETE TO authenticated USING (is_admin_or_manager(auth.uid()));
CREATE POLICY "Staff can view motorcycles" ON public.motorcycles FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Riders view own motorcycle" ON public.motorcycles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.riders WHERE riders.id = motorcycles.rider_id AND riders.user_id = auth.uid())
);

-- 11. NEW RLS POLICIES - REMITTANCES
CREATE POLICY "Staff view remittances" ON public.remittances FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Staff insert remittances" ON public.remittances FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff update remittances" ON public.remittances FOR UPDATE TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Admin delete remittances" ON public.remittances FOR DELETE TO authenticated USING (is_admin_or_manager(auth.uid()));
CREATE POLICY "Riders create own remittance" ON public.remittances FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.riders WHERE riders.id = remittances.rider_id AND riders.user_id = auth.uid())
);
CREATE POLICY "Riders view own remittances" ON public.remittances FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.riders WHERE riders.id = remittances.rider_id AND riders.user_id = auth.uid())
);

-- 12. NEW RLS POLICIES - EXPENSES
CREATE POLICY "Staff view expenses" ON public.expenses FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Staff insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Admin/accountant update expenses" ON public.expenses FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'accountant')
);
CREATE POLICY "Admin delete expenses" ON public.expenses FOR DELETE TO authenticated USING (is_admin_or_manager(auth.uid()));

-- 13. NEW RLS POLICIES - COMPLIANCE RECORDS
CREATE POLICY "Admin manage compliance" ON public.compliance_records FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff view compliance" ON public.compliance_records FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Riders view own compliance" ON public.compliance_records FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.riders WHERE riders.id = compliance_records.rider_id AND riders.user_id = auth.uid())
);
CREATE POLICY "Riders insert own compliance" ON public.compliance_records FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.riders WHERE riders.id = compliance_records.rider_id AND riders.user_id = auth.uid())
);

-- 14. STORAGE RLS POLICIES
CREATE POLICY "Users upload own avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone view avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'profile-avatars');
CREATE POLICY "Users update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own rider docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'rider-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "View own or admin rider docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'rider-documents' AND (is_admin_or_manager(auth.uid()) OR (storage.foldername(name))[1] = auth.uid()::text));

CREATE POLICY "Staff upload motorcycle docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'motorcycle-documents' AND is_staff(auth.uid()));
CREATE POLICY "View own or admin motorcycle docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'motorcycle-documents' AND (is_admin_or_manager(auth.uid()) OR (storage.foldername(name))[1] = auth.uid()::text));

-- 15. PROFILES RLS - update for admin access
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin view all profiles" ON public.profiles FOR SELECT TO authenticated USING (is_admin_or_manager(auth.uid()));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin update any profile" ON public.profiles FOR UPDATE TO authenticated USING (is_admin_or_manager(auth.uid()));
