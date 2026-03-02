
-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'operations_manager', 'accountant', 'rider');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create riders table
CREATE TABLE public.riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  national_id TEXT NOT NULL,
  license_number TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'suspended', 'pending')),
  compliance_score INTEGER NOT NULL DEFAULT 0,
  assigned_bike_id UUID,
  kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('verified', 'pending', 'rejected')),
  police_clearance BOOLEAN NOT NULL DEFAULT false,
  test_approved BOOLEAN NOT NULL DEFAULT false,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_remittance NUMERIC NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create motorcycles table
CREATE TABLE public.motorcycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'suspended')),
  assigned_rider_id UUID REFERENCES public.riders(id) ON DELETE SET NULL,
  insurance_expiry DATE NOT NULL,
  last_maintenance DATE,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  maintenance_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key for riders.assigned_bike_id
ALTER TABLE public.riders ADD CONSTRAINT fk_riders_assigned_bike FOREIGN KEY (assigned_bike_id) REFERENCES public.motorcycles(id) ON DELETE SET NULL;

-- Create remittances table
CREATE TABLE public.remittances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES public.riders(id) ON DELETE CASCADE,
  bike_id UUID NOT NULL REFERENCES public.motorcycles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL DEFAULT 'daily' CHECK (type IN ('daily', 'weekly')),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'partial', 'overdue')),
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'transfer', 'pos')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('maintenance', 'mechanic', 'pos', 'fuel', 'insurance', 'capital', 'other')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  bike_id UUID REFERENCES public.motorcycles(id) ON DELETE SET NULL,
  rider_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remittances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: check if user is admin or operations manager
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'operations_manager')
  )
$$;

-- Helper: check if user is staff (not rider)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'operations_manager', 'accountant')
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Riders policies
CREATE POLICY "Staff can view all riders" ON public.riders FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Riders can view own record" ON public.riders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can insert riders" ON public.riders FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update riders" ON public.riders FOR UPDATE USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins can delete riders" ON public.riders FOR DELETE USING (public.is_admin_or_manager(auth.uid()));

-- Motorcycles policies
CREATE POLICY "Staff can view motorcycles" ON public.motorcycles FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert motorcycles" ON public.motorcycles FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update motorcycles" ON public.motorcycles FOR UPDATE USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins can delete motorcycles" ON public.motorcycles FOR DELETE USING (public.is_admin_or_manager(auth.uid()));

-- Remittances policies
CREATE POLICY "Staff can view all remittances" ON public.remittances FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Riders can view own remittances" ON public.remittances FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.riders WHERE riders.id = remittances.rider_id AND riders.user_id = auth.uid())
);
CREATE POLICY "Staff can insert remittances" ON public.remittances FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update remittances" ON public.remittances FOR UPDATE USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins can delete remittances" ON public.remittances FOR DELETE USING (public.is_admin_or_manager(auth.uid()));

-- Expenses policies
CREATE POLICY "Staff can view expenses" ON public.expenses FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert expenses" ON public.expenses FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update expenses" ON public.expenses FOR UPDATE USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins can delete expenses" ON public.expenses FOR DELETE USING (public.is_admin_or_manager(auth.uid()));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON public.riders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_motorcycles_updated_at BEFORE UPDATE ON public.motorcycles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_remittances_updated_at BEFORE UPDATE ON public.remittances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
