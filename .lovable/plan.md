## Problem
After an admin logs in, they land on `/smart-meter` instead of the dashboard `/`.

Root cause (verified in `src/hooks/api/useAuth.ts`, `useRoles.ts`, `ProtectedRoute.tsx`, `LoginPage.tsx`):
- `useUserRoles` caches `[]` while logged out (query runs with no user).
- `useLogin.onSuccess` invalidates `['auth']` then `LoginPage` immediately `navigate('/')`.
- On the dashboard render, the roles query is *refetching* but `isLoading` is `false` and cached `data` is still `[]`. So `useRoles` reports `isStaff=false`, `isRider=false`.
- `ProtectedRoute` on the dashboard has `staffOnly` → falls through to line 48: `<Navigate to="/smart-meter" replace />`.
- The refetch then resolves with `['admin']`, but the URL is already `/smart-meter`.

## Fix
Make role-based gating wait for a fresh role fetch after login.

1. `src/hooks/api/useAuth.ts` — in `useUserRoles`, disable the query while there is no authenticated user (skip the cached `[]` for logged-out state) and return `isLoading` true until a user exists. Concretely: read `useCurrentUser()` (or `supabase.auth.getSession`) and set `enabled: !!user`, so post-login the query is a fresh fetch with `isLoading=true`.
2. `src/hooks/api/useRoles.ts` — also surface `isFetching` and treat `isLoading || isFetching` as loading, so ProtectedRoute keeps the skeleton up during the post-invalidation refetch.
3. `src/components/ProtectedRoute.tsx` — use the combined loading flag from `useRoles` when gating.
4. `src/pages/LoginPage.tsx` — after `login` success, `await queryClient.invalidateQueries({ queryKey: ['auth'] })` and then compute destination from the freshly refetched roles (admin/staff → `/`, rider → `/smart-meter`), so the admin is routed correctly even if the ProtectedRoute race ever recurs.

No schema, RLS, or business-logic changes. Rider redirect behavior is preserved.
