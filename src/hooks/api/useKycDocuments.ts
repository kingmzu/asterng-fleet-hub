/**
 * KYC Documents hooks: list, upload, replace, delete, review.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type KycDocument = Tables<'kyc_documents'>;
export type KycDocumentType =
  | 'passport_photo'
  | 'national_id'
  | 'bvn'
  | 'government_id'
  | 'additional';
export type GovernmentIdType =
  | 'drivers_license'
  | 'voters_card'
  | 'international_passport';

const BUCKET = 'rider-documents';

export const useKycDocuments = (riderId?: string) => {
  return useQuery({
    queryKey: ['kyc_documents', riderId],
    queryFn: async () => {
      if (!riderId) return [];
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('rider_id', riderId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!riderId,
  });
};

export const getSignedUrl = async (path: string, expiresIn = 300) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
};

export const useUploadKycDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      riderId: string;
      file: File;
      documentType: KycDocumentType;
      governmentIdType?: GovernmentIdType | null;
      replaceId?: string; // when replacing existing record
      replaceOldPath?: string; // old storage path to remove
    }) => {
      const { riderId, file, documentType, governmentIdType, replaceId, replaceOldPath } = params;
      const ext = file.name.split('.').pop() || 'bin';
      const safeName = `${documentType}-${Date.now()}.${ext}`;
      const path = `${riderId}/${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;

      const payload = {
        rider_id: riderId,
        document_type: documentType,
        government_id_type: governmentIdType ?? null,
        file_url: path,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        status: 'pending' as const,
      };

      if (replaceId) {
        const { error } = await supabase
          .from('kyc_documents')
          .update(payload)
          .eq('id', replaceId);
        if (error) throw error;
        if (replaceOldPath) {
          await supabase.storage.from(BUCKET).remove([replaceOldPath]).catch(() => {});
        }
      } else {
        const { error } = await supabase.from('kyc_documents').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['kyc_documents', vars.riderId] });
      qc.invalidateQueries({ queryKey: ['kyc_documents_pending'] });
    },
  });
};

export const useDeleteKycDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: KycDocument) => {
      const { error } = await supabase.from('kyc_documents').delete().eq('id', doc.id);
      if (error) throw error;
      await supabase.storage.from(BUCKET).remove([doc.file_url]).catch(() => {});
    },
    onSuccess: (_d, doc) => {
      qc.invalidateQueries({ queryKey: ['kyc_documents', doc.rider_id] });
      qc.invalidateQueries({ queryKey: ['kyc_documents_pending'] });
    },
  });
};

export const useReviewKycDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status: 'verified' | 'rejected' | 'pending'; notes?: string | null }) => {
      const { error } = await supabase
        .from('kyc_documents')
        .update({ status: params.status, notes: params.notes ?? null })
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kyc_documents'] });
      qc.invalidateQueries({ queryKey: ['kyc_documents_pending'] });
    },
  });
};

export const usePendingKycDocuments = () => {
  return useQuery({
    queryKey: ['kyc_documents_pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*, riders(id, full_name, phone_number)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
  });
};
