-- 1) Ensure a single General conversation exists (staff-only by RLS).
INSERT INTO public.conversations (type, title, created_by)
SELECT 'general', 'General', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.conversations WHERE type = 'general');

-- 2) Helper: list approved users with their (preferred) role and rider link.
CREATE OR REPLACE FUNCTION public.get_approved_users_for_onboarding()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  phone_number text,
  requested_role text,
  has_rider_record boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.full_name,
    p.email,
    p.phone_number,
    COALESCE(p.requested_role, 'rider') AS requested_role,
    EXISTS (SELECT 1 FROM public.riders r WHERE r.user_id = p.user_id) AS has_rider_record
  FROM public.profiles p
  WHERE p.approval_status = 'approved'
    AND public.is_admin_or_manager(auth.uid())
  ORDER BY p.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_approved_users_for_onboarding() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_approved_users_for_onboarding() TO authenticated;

-- 3) Helper: list approved users that the current user can DM (staff sees approved staff/admins).
CREATE OR REPLACE FUNCTION public.get_approved_chat_users()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  role text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.full_name,
    p.email,
    COALESCE(
      (SELECT ur.role::text FROM public.user_roles ur
        WHERE ur.user_id = p.user_id
        ORDER BY CASE ur.role
          WHEN 'admin' THEN 1
          WHEN 'operations_manager' THEN 2
          WHEN 'accountant' THEN 3
          ELSE 4 END
        LIMIT 1),
      'rider'
    ) AS role
  FROM public.profiles p
  WHERE p.approval_status = 'approved'
    AND p.user_id <> auth.uid()
    AND public.is_staff(auth.uid())
  ORDER BY p.full_name;
$$;

REVOKE EXECUTE ON FUNCTION public.get_approved_chat_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_approved_chat_users() TO authenticated;