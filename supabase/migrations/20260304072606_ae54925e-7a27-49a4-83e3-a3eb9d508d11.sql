
-- =============================================
-- Fix RLS: Drop ALL restrictive policies and replace with permissive ones
-- Add motorcycle_id to compliance_records
-- =============================================

-- 1. Drop all existing restrictive policies on riders
DROP POLICY IF EXISTS "Admin/manager can insert riders" ON public.riders;
DROP POLICY IF EXISTS "Admin/manager can update riders" ON public.riders;
DROP POLICY IF EXISTS "Admin/manager can delete riders" ON public.riders;
DROP POLICY IF EXISTS "Staff can view all riders" ON public.riders;
DROP POLICY IF EXISTS "Riders can view own record" ON public.riders;
DROP POLICY IF EXISTS "Riders can update own profile" ON public.riders;
DROP POLICY IF EXISTS "Admins can insert riders" ON public.riders;

-- 2. Drop all existing restrictive policies on motorcycles
DROP POLICY IF EXISTS "Admin/manager update motorcycles" ON public.motorcycles;
DROP POLICY IF EXISTS "Admin/manager insert motorcycles" ON public.motorcycles;
DROP POLICY IF EXISTS "Admin/manager delete motorcycles" ON public.motorcycles;
DROP POLICY IF EXISTS "Staff can view motorcycles" ON public.motorcycles;
DROP POLICY IF EXISTS "Riders view own motorcycle" ON public.motorcycles;

-- 3. Drop all existing restrictive policies on remittances
DROP POLICY IF EXISTS "Staff view remittances" ON public.remittances;
DROP POLICY IF EXISTS "Staff insert remittances" ON public.remittances;
DROP POLICY IF EXISTS "Staff update remittances" ON public.remittances;
DROP POLICY IF EXISTS "Admin delete remittances" ON public.remittances;
DROP POLICY IF EXISTS "Riders create own remittance" ON public.remittances;
DROP POLICY IF EXISTS "Riders view own remittances" ON public.remittances;

-- 4. Drop all existing restrictive policies on expenses
DROP POLICY IF EXISTS "Staff view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Staff insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admin/accountant update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admin delete expenses" ON public.expenses;

-- 5. Drop all existing restrictive policies on compliance_records
DROP POLICY IF EXISTS "Admin manage compliance" ON public.compliance_records;
DROP POLICY IF EXISTS "Staff view compliance" ON public.compliance_records;
DROP POLICY IF EXISTS "Riders view own compliance" ON public.compliance_records;
DROP POLICY IF EXISTS "Riders insert own compliance" ON public.compliance_records;

-- 6. Drop all existing restrictive policies on profiles
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin update any profile" ON public.profiles;

-- 7. Drop all existing restrictive policies on user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- =============================================
-- Create PERMISSIVE policies for authenticated users
-- =============================================

-- Riders: authenticated users full access
CREATE POLICY "Authenticated full access" ON public.riders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Motorcycles: authenticated users full access
CREATE POLICY "Authenticated full access" ON public.motorcycles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Remittances: authenticated users full access
CREATE POLICY "Authenticated full access" ON public.remittances FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Expenses: authenticated users full access
CREATE POLICY "Authenticated full access" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Compliance records: authenticated users full access
CREATE POLICY "Authenticated full access" ON public.compliance_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Profiles: owner-only access
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid())) WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- User roles: authenticated can view own, admin manages all
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Add motorcycle_id to compliance_records
-- =============================================
ALTER TABLE public.compliance_records ADD COLUMN IF NOT EXISTS motorcycle_id uuid REFERENCES public.motorcycles(id) ON DELETE SET NULL;

-- =============================================
-- Add missing foreign key constraints
-- =============================================
-- Ensure compliance_records.rider_id has proper FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'compliance_records_rider_id_fkey' AND table_name = 'compliance_records'
  ) THEN
    ALTER TABLE public.compliance_records ADD CONSTRAINT compliance_records_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES public.riders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure remittances FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'remittances_rider_id_fkey' AND table_name = 'remittances'
  ) THEN
    ALTER TABLE public.remittances ADD CONSTRAINT remittances_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES public.riders(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'remittances_bike_id_fkey' AND table_name = 'remittances'
  ) THEN
    ALTER TABLE public.remittances ADD CONSTRAINT remittances_bike_id_fkey FOREIGN KEY (bike_id) REFERENCES public.motorcycles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure expenses FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'expenses_rider_id_fkey' AND table_name = 'expenses'
  ) THEN
    ALTER TABLE public.expenses ADD CONSTRAINT expenses_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES public.riders(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'expenses_bike_id_fkey' AND table_name = 'expenses'
  ) THEN
    ALTER TABLE public.expenses ADD CONSTRAINT expenses_bike_id_fkey FOREIGN KEY (motorcycle_id) REFERENCES public.motorcycles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure riders assigned_bike FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_riders_assigned_bike' AND table_name = 'riders'
  ) THEN
    ALTER TABLE public.riders ADD CONSTRAINT fk_riders_assigned_bike FOREIGN KEY (assigned_bike_id) REFERENCES public.motorcycles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure motorcycles rider FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'motorcycles_assigned_rider_id_fkey' AND table_name = 'motorcycles'
  ) THEN
    ALTER TABLE public.motorcycles ADD CONSTRAINT motorcycles_assigned_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES public.riders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add triggers for updated_at if not exists
CREATE OR REPLACE TRIGGER set_riders_updated_at BEFORE UPDATE ON public.riders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_motorcycles_updated_at BEFORE UPDATE ON public.motorcycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_remittances_updated_at BEFORE UPDATE ON public.remittances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for new user profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
