
-- Auto-approve all users and assign role immediately. Remove approval gate.

-- Backfill: mark every existing profile approved and ensure user_roles row exists
UPDATE public.profiles
SET approval_status = 'approved',
    approved_at = COALESCE(approved_at, now())
WHERE approval_status <> 'approved';

INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id,
       (CASE
          WHEN p.requested_role IN ('admin','operations_manager','accountant','rider')
            THEN p.requested_role
          ELSE 'rider'
        END)::app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Change default for profiles.approval_status to 'approved'
ALTER TABLE public.profiles ALTER COLUMN approval_status SET DEFAULT 'approved';

-- Replace handle_new_user trigger to auto-approve + auto-assign role + auto-create rider record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'requested_role', 'rider');
  IF v_role NOT IN ('admin','operations_manager','accountant','rider') THEN
    v_role := 'rider';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, email, requested_role, approval_status, approved_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    v_role,
    'approved',
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$function$;
