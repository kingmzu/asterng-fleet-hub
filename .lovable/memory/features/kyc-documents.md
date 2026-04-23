---
name: KYC Documents
description: Rider KYC document upload, storage, and admin verification workflow
type: feature
---
KYC documents stored in `kyc_documents` table linked to riders. Files in private `rider-documents` bucket under `{rider_id}/{type}-{timestamp}.{ext}`.

Document types: passport_photo, national_id, bvn (all required), government_id (optional with subtype: drivers_license/voters_card/international_passport), additional (multiple allowed).

Limits: 5MB per file. Passport: JPG/PNG only. Others: JPG/PNG/PDF.

Access: Staff insert/update files; only admin/operations_manager can change `status` (pending/verified/rejected) and `notes` — enforced by `guard_kyc_status_change` trigger. `uploaded_by` auto-set by `set_uploaded_by` trigger. Riders can only view their own documents.

UI: `KycDocumentsSection` rendered inside RiderFormDialog (edit mode only — needs rider.id). Admin review via `KycReviewPanel` on Compliance page (admin/manager only). All previews use signed URLs (5 min expiry).
