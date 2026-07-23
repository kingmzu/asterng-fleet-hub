## Diagnosis

Your `kingabdulkm@gmail.com` profile is `approved` with `admin` role in the database, so the block is not a data problem — it's a permissions problem I introduced in the last security migration.

The RLS policies on `profiles` (and most other tables) call helper functions like `is_admin_or_manager(auth.uid())`, `is_staff(auth.uid())`, and `has_role(auth.uid(), 'admin')`. In the previous security pass I revoked `EXECUTE` on those helpers from `anon` and `authenticated`. Confirmed just now:

```
is_admin_or_manager → EXECUTE for authenticated: false
has_role            → EXECUTE for authenticated: false
is_staff            → EXECUTE for authenticated: false
```

When the browser queries `profiles`, Postgres evaluates every applicable policy — including `Admin manage all profiles USING (is_admin_or_manager(auth.uid()))`. Because the signed-in role no longer has `EXECUTE` on that function, the query errors out. The frontend gets no profile row back, so `ProtectedRoute` treats you as unapproved and bounces you to `/pending-approval`, where the page then sits on its spinner because the same query keeps failing.

## Fix

Restore `EXECUTE` on the five helper functions that RLS policies depend on. They must be callable by the signed-in role for policy evaluation to work; they are read-only role checks and safe to expose.

Migration:

- `GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;`
- `GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;`
- `GRANT EXECUTE ON FUNCTION public.is_admin_or_manager(uuid) TO authenticated;`
- `GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated;`
- `GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated;`

All the other trigger/internal SECURITY DEFINER functions I locked down last time stay locked down — those are never referenced by RLS policies, so they don't affect login.

## Small hardening in the page itself

While we're in there, make `PendingApprovalPage` resilient so a failing profile fetch surfaces an error instead of an infinite spinner:

- If `useUserProfile` returns an error, show a "Couldn't load your account" message with a Retry and Sign out button instead of the spinner.
- Keep the existing realtime + polling + manual "Check status" flow unchanged.

## Verification after apply

1. Hard-refresh the preview and sign in as `kingabdulkm@gmail.com` — you should land on `/` (dashboard), not `/pending-approval`.
2. In the Network tab, the `profiles?...user_id=eq.<id>` request should return `200` with your row.
3. `demo@asterng.com` should also go straight to the dashboard.
4. Re-run the security scan — the "SECURITY DEFINER executable by authenticated" finding will list `has_role`, `is_staff`, `is_admin_or_manager`, `is_approved`, `is_conversation_member` again; those are intentional (already noted in `@security-memory`) and can be ignored.