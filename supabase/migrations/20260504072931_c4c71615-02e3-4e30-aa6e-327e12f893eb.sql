
-- Revoke EXECUTE from public/anon/authenticated on all SECURITY DEFINER functions,
-- then grant back only to authenticated for the ones the app calls via RPC.

-- Internal trigger / helper functions: revoke from everyone (only postgres/triggers use them)
REVOKE ALL ON FUNCTION public.expenses_recalc_bike_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.remittances_recalc_bike_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_bike_revenue(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_bike_maintenance(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_approval_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_kyc_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_recorded_by() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_uploaded_by() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_conversation_on_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.kyc_docs_recalc_compliance_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.riders_recalc_compliance_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_rider_compliance_score(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_rider_compliance_score(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin_or_manager(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_approved(uuid) FROM PUBLIC, anon, authenticated;

-- Functions the app calls via RPC: allow authenticated only (these enforce their own role checks)
REVOKE ALL ON FUNCTION public.process_remittance_with_overdue(uuid, uuid, numeric, date, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_remittance_with_overdue(uuid, uuid, numeric, date, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_approved_chat_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_approved_chat_users() TO authenticated;

REVOKE ALL ON FUNCTION public.get_approved_users_for_onboarding() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_approved_users_for_onboarding() TO authenticated;
