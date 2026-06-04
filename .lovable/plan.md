## Goal
After login, route users by role: riders → `/smart-meter`, everyone else (admin, ops manager, accountant) → `/dashboard`. `ProtectedRoute` already enforces this once the user lands on a page, but `LoginPage` hardcodes `/dashboard`, which then bounces riders. Fix the post-login redirect to honor role.

## Changes

**`src/pages/LoginPage.tsx`**
- On successful login, instead of `navigate('/dashboard')` immediately, wait for the user's roles to load, then route:
  - rider (and not staff) → `/smart-meter`
  - admin / operations_manager / accountant → `/dashboard`
- Implementation: trigger a `useEffect` that watches `useCurrentUser` + `useRoles()`; once `user` exists and roles finished loading, `navigate(...)` to the correct path. Drop the hardcoded `navigate('/dashboard')` from the `onSuccess` callback (keep the toast).

No other files need to change — `ProtectedRoute` already redirects riders away from staff-only routes and sends staff hitting rider-only pages through correctly.