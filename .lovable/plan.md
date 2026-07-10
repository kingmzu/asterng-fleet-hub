## Findings

**DB state is fine.** The demo account (`demo@asterng.com`) and the other existing account are both `approval_status = 'approved'` with the correct roles in `user_roles`. RLS policies on `profiles` are correct and table grants to `authenticated` are present. So the "stuck on pending" behavior is a **frontend routing/state bug**, not data.

Root causes in the current code:

1. **`/pending-approval` is NOT wrapped in `ProtectedRoute`** (see `src/App.tsx` line 40). All redirect logic lives inside `PendingApprovalPage` via `useEffect`, so the page can render for approved users and depends on effects firing correctly to bounce them out. This creates race windows.

2. **Hard block on `!profile` in `PendingApprovalPage`** — the page shows a full-page spinner whenever `profile` is falsy. If `useUserProfile` momentarily returns `null` (e.g. `maybeSingle()` returns null while auth session is still hydrating right after login, or a transient RLS miss), the page spins forever with no recovery UI.

3. **`useUserProfile` doesn't react to auth state.** Its queryKey is static (`['auth','profile']`) and it calls `supabase.auth.getUser()` inside the fetcher. If it runs once before the session is attached, it returns `null`, caches `null`, and won't refetch until something invalidates it. `ProtectedRoute` then sees `approval = 'pending'` (default fallback) and redirects to `/pending-approval`. `PendingApprovalPage` then hits case (2) above.

4. **`handleRefresh` can hang the button.** If `refetch()` rejects (network / RLS error), the `finally` still runs, but any thrown error inside is swallowed with no toast, leaving users confused. Also there's no visible "last checked" state.

5. **Login path** navigates to `/` immediately after `signInWithPassword` resolves. `ProtectedRoute` then runs before `useCurrentUser`'s `onAuthStateChange` has propagated in some cases → redirect to `/pending-approval` for an already-approved user.

## Plan

### 1. Fix the auth/profile hook (`src/hooks/api/useAuth.ts`)
- Make `useUserProfile` (and `useUserRoles`) depend on the current session:
  - Track the auth user in a shared hook or via `onAuthStateChange`.
  - Set `enabled: !!user?.id` and put `user.id` into the queryKey (`['auth','profile', userId]`).
  - This guarantees the query re-runs when the session appears and can't cache a stale `null`.
- Add a small retry (1–2x) with backoff to absorb transient RLS/session-hydration blips.

### 2. Wrap `/pending-approval` with `ProtectedRoute` (`src/App.tsx`)
- Move it under the same gate as other routes so the "approved → dashboard" and "unapproved → pending" decision is made in one place.
- `ProtectedRoute` already handles both directions; the standalone page can then focus on presentation.

### 3. Simplify `PendingApprovalPage` (`src/pages/PendingApprovalPage.tsx`)
- Remove the `!profile` full-page spinner. Render the card with a subtle inline loading state instead so users always see something and the "Sign out" button always works.
- Keep realtime subscription + 15s poll, but drive redirect purely off `profile.approval_status` (route-level gate already covers the redirect too, so this becomes a UX nicety, not a correctness requirement).
- Harden `handleRefresh`: wrap in `try/catch`, always toast on error, always release `checking`.

### 4. Fix login navigation (`src/pages/LoginPage.tsx`)
- After successful `signIn`, wait for `onAuthStateChange` (or `await supabase.auth.getSession()`) before calling `navigate('/')`, so `ProtectedRoute`'s first render already sees a user + can start the profile query in "loading" state (which shows the skeleton) instead of the "no user" branch (which bounces to `/login`) or the "no profile yet" branch (which bounces to `/pending-approval`).

### 5. Add lightweight instrumentation
- Console-log the resolved `{ userId, approval_status, roles }` inside `ProtectedRoute` (dev only) so future stuck-state reports are diagnosable in one glance.

## Files to change
- `src/hooks/api/useAuth.ts` — session-aware profile & roles queries, retries, enabled flag.
- `src/App.tsx` — wrap `/pending-approval` in `ProtectedRoute`.
- `src/pages/PendingApprovalPage.tsx` — remove hard `!profile` spinner, harden refresh handler.
- `src/pages/LoginPage.tsx` — await session before navigating.
- `src/components/ProtectedRoute.tsx` — small dev log; no behavior change beyond the wrapping decision above.

## Out of scope
- No DB or RLS changes (both are correct).
- No changes to signup / approval mutation flow (`useApprovals.ts` is fine).
