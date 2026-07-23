## 1. Route admin/manager to the Dashboard after login

`LoginPage` currently calls `navigate('/')` immediately on login success. At that moment the auth session has just been set but `useRoles` hasn't hydrated, and in some cases the user is bounced through `ProtectedRoute`'s loading state before landing correctly. We'll wait for the role to load and then route explicitly:

- Staff (admin, operations_manager, accountant) → `/` (Dashboard)
- Rider → `/smart-meter`

Implementation:
- In `src/pages/LoginPage.tsx`, on `login` success set a `justLoggedIn` flag instead of navigating immediately.
- Add a `useEffect` that watches `useRoles()` — once `!isLoading` and a user is present, `navigate(isStaff ? '/' : '/smart-meter', { replace: true })`.
- This guarantees admins/managers always land on the Dashboard.

## 2. Auto-select the motorcycle linked to the selected rider

In `src/components/forms/RemittanceFormDialog.tsx`:
- Watch `rider_id` via `form.watch`.
- When it changes (and we're not editing an existing remittance), look up the rider in the already-loaded `riders` list and, if `assigned_bike_id` is set, call `form.setValue('bike_id', rider.assigned_bike_id)`.
- User can still override the bike manually.

## Technical notes

- No schema changes. `riders.assigned_bike_id` already exists and points at `motorcycles.id`.
- No RLS changes.
- Edit mode keeps the stored `bike_id` untouched to preserve historical accuracy.
