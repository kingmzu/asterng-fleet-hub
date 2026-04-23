-- 1. KYC documents table
CREATE TABLE public.kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES public.riders(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('passport_photo','national_id','bvn','government_id','additional')),
  government_id_type text CHECK (government_id_type IN ('drivers_license','voters_card','international_passport') OR government_id_type IS NULL),
  file_url text NOT NULL,
  file_name text,
  mime_type text,
  file_size integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_kyc_documents_rider ON public.kyc_documents(rider_id);
CREATE INDEX idx_kyc_documents_type ON public.kyc_documents(document_type);

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Staff & owning rider can SELECT
CREATE POLICY "Staff and owner view kyc docs"
ON public.kyc_documents FOR SELECT
TO authenticated
USING (
  public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.riders r WHERE r.id = kyc_documents.rider_id AND r.user_id = auth.uid())
);

-- Staff can INSERT
CREATE POLICY "Staff insert kyc docs"
ON public.kyc_documents FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

-- Staff can UPDATE (file replacement). Status changes also gated below by trigger.
CREATE POLICY "Staff update kyc docs"
ON public.kyc_documents FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- Only admins can DELETE
CREATE POLICY "Admins delete kyc docs"
ON public.kyc_documents FOR DELETE
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- 2. Trigger: only admins/managers may change status or notes
CREATE OR REPLACE FUNCTION public.guard_kyc_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.status IS DISTINCT FROM OLD.status OR NEW.notes IS DISTINCT FROM OLD.notes OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by) THEN
    IF NOT public.is_admin_or_manager(auth.uid()) THEN
      RAISE EXCEPTION 'Only admins or operations managers can change KYC status or notes';
    END IF;
    NEW.reviewed_by := auth.uid();
    NEW.reviewed_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_kyc_status_change ON public.kyc_documents;
CREATE TRIGGER trg_guard_kyc_status_change
BEFORE UPDATE ON public.kyc_documents
FOR EACH ROW EXECUTE FUNCTION public.guard_kyc_status_change();

-- 3. Auto-set uploaded_by on insert
CREATE OR REPLACE FUNCTION public.set_uploaded_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.uploaded_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_uploaded_by ON public.kyc_documents;
CREATE TRIGGER trg_set_uploaded_by
BEFORE INSERT ON public.kyc_documents
FOR EACH ROW EXECUTE FUNCTION public.set_uploaded_by();

-- 4. Storage policies on rider-documents bucket (private)
-- Staff can upload/read/update/delete; riders can read their own folder.
DROP POLICY IF EXISTS "Staff read rider-documents" ON storage.objects;
CREATE POLICY "Staff read rider-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'rider-documents'
  AND (
    public.is_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.riders r
      WHERE r.user_id = auth.uid()
        AND r.id::text = (storage.foldername(name))[1]
    )
  )
);

DROP POLICY IF EXISTS "Staff upload rider-documents" ON storage.objects;
CREATE POLICY "Staff upload rider-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'rider-documents' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff update rider-documents" ON storage.objects;
CREATE POLICY "Staff update rider-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'rider-documents' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'rider-documents' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff delete rider-documents" ON storage.objects;
CREATE POLICY "Staff delete rider-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'rider-documents' AND public.is_staff(auth.uid()));