-- Backfill profiles for any auth.users missing one (handles_new_user trigger may have failed silently)
INSERT INTO public.profiles (user_id, full_name, email, requested_role, approval_status, approved_at)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  u.email,
  COALESCE(u.raw_user_meta_data->>'requested_role', 'rider'),
  CASE WHEN u.email = 'kingabdulkm@gmail.com' THEN 'approved' ELSE 'pending' END,
  CASE WHEN u.email = 'kingabdulkm@gmail.com' THEN now() ELSE NULL END
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- Ensure handle_new_user trigger is robust against errors so signups always create a profile row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_status text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'requested_role', 'rider');

  IF NEW.email = 'kingabdulkm@gmail.com' THEN
    v_status := 'approved';
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
  )
  ON CONFLICT (user_id) DO NOTHING;

  IF NEW.email = 'kingabdulkm@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block signup; log via RAISE NOTICE
  RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$function$;

-- Make sure profiles.user_id has a unique constraint for ON CONFLICT to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;