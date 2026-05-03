## Why the buttons appear to do nothing

In `src/components/KycRiderControl.tsx`, each row's Set Status menu uses `<DropdownMenuItem onClick={...}>`. Radix DropdownMenu items fire `onSelect` (not `onClick`) as the canonical action, and they auto-close the menu before propagating click events — so in some browsers/builds the click handler can be cancelled mid-flight, especially when the parent is a `<table><tr>`. The current handlers also swallow failures silently if `updateRider.mutateAsync` throws synchronously (no `console.error`, no granular toast on the validation pre-check), so any RLS or trigger error reads to the user as "nothing happened".

Database side, the Kabir Muazu rider already has `kyc_status = verified`, so re-clicking "Verified" produces a no-op update (`.update(...).select().single()` on an unchanged row still returns the row, but the React Query invalidation can race and look like nothing changed).

## Fix

1. **Switch DropdownMenuItem to `onSelect`** in `KycRiderControl.tsx` and call `e.preventDefault()` so the menu closes only after our handler runs. This is the documented Radix pattern and resolves the "click does nothing in a table row" issue.
2. **Make `setStatus` resilient and visible:**
   - Wrap the whole flow in try/catch with `console.error` + `toast.error` showing the real Postgres message.
   - Skip the no-op update when `rider.kyc_status === next` (just toast "Already <status>").
   - After `updateRider.mutateAsync`, explicitly call `queryClient.invalidateQueries({ queryKey: ['riders'] })` and `['rider', id]` to force a refresh (the existing hook only invalidates `['riders']`).
3. **Pre-check uses dynamic import** of supabase — replace with the static import already at the top of the file (the dynamic import can fail silently in some bundling edge cases).
4. **Show admin gating clearly:** if `roles` hasn't loaded yet, render a disabled "Loading…" button instead of nothing, so admins don't see "no buttons" and assume they're broken.
5. **Confirm admin role at runtime:** add a one-line guard — if the dropdown is clicked but `is_admin_or_manager` is false, surface a toast "You don't have permission" rather than an opaque RLS reject.
6. **Same hardening in `KycReviewPanel.tsx`** Approve/Reject buttons (use try/catch with `console.error`, invalidate queries, switch to `onSelect` not needed there since they're plain Buttons).

## Files to change

- `src/components/KycRiderControl.tsx` — switch to `onSelect`, harden `setStatus`, static supabase import, no-op short-circuit, query invalidation, loading state for admin gate.
- `src/hooks/api/useRiders.ts` — `useUpdateRider` `onSuccess` also invalidates `['rider', id]` and `['kyc_documents_pending']`.
- `src/components/KycReviewPanel.tsx` — add `console.error` in approve/reject catch blocks so failures surface.

No DB migration is required — the `riders` RLS policy already allows staff to UPDATE, and there is no guard trigger on `riders.kyc_status`. If after this fix the toast surfaces a specific Postgres error, we'll address it as a follow-up.
