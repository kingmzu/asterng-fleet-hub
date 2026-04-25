import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Eye, CheckCircle2, AlertCircle, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import {
  useKycDocuments,
  useUploadKycDocument,
  useDeleteKycDocument,
  getSignedUrl,
  type KycDocument,
  type KycDocumentType,
  type GovernmentIdType,
} from '@/hooks/api/useKycDocuments';
import { useUserRoles } from '@/hooks/api/useAuth';

const MAX_SIZE = 5 * 1024 * 1024;

const SLOTS: {
  type: KycDocumentType;
  label: string;
  required: boolean;
  accept: string;
  description: string;
  icon: typeof FileText;
}[] = [
  { type: 'passport_photo', label: 'Passport Photograph', required: true, accept: 'image/jpeg,image/png', description: 'JPG or PNG, max 5MB', icon: ImageIcon },
  { type: 'national_id', label: 'National ID (NIN Slip/Card)', required: true, accept: 'image/jpeg,image/png,application/pdf', description: 'JPG, PNG or PDF, max 5MB', icon: FileText },
  { type: 'bvn', label: 'BVN Document / Proof', required: true, accept: 'image/jpeg,image/png,application/pdf', description: 'JPG, PNG or PDF, max 5MB', icon: FileText },
];

const GOV_ID_OPTIONS: { value: GovernmentIdType; label: string }[] = [
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'voters_card', label: "Voter's Card" },
  { value: 'international_passport', label: 'International Passport' },
];

interface Props {
  riderId: string;
  onCompletionChange?: (pct: number, hasRequired: boolean) => void;
}

const validateFile = (file: File, accept: string): string | null => {
  if (file.size > MAX_SIZE) return 'File exceeds 5MB';
  const accepted = accept.split(',').map((s) => s.trim());
  if (!accepted.includes(file.type)) return 'Unsupported file type';
  return null;
};

const KycDocumentsSection = ({ riderId, onCompletionChange }: Props) => {
  const { data: docs = [], isLoading } = useKycDocuments(riderId);
  const { data: roles = [] } = useUserRoles();
  const isAdmin = roles.includes('admin');
  const upload = useUploadKycDocument();
  const remove = useDeleteKycDocument();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string>('');
  const [govIdType, setGovIdType] = useState<GovernmentIdType>('drivers_license');
  const [activeUpload, setActiveUpload] = useState<string | null>(null);

  const findDoc = (type: KycDocumentType, govType?: GovernmentIdType) =>
    docs.find((d) => d.document_type === type && (type !== 'government_id' || d.government_id_type === govType));

  const additionals = docs.filter((d) => d.document_type === 'additional');

  // completion %
  useEffect(() => {
    const required = SLOTS.filter((s) => s.required);
    const filled = required.filter((s) => findDoc(s.type)).length;
    const optional = findDoc('government_id', govIdType) ? 1 : 0;
    const total = required.length + 1; // +1 for optional govt id contribution
    const pct = Math.round(((filled + optional) / total) * 100);
    const hasRequired = filled === required.length;
    onCompletionChange?.(pct, hasRequired);
  }, [docs, govIdType, onCompletionChange]);

  const handleFile = async (
    file: File,
    type: KycDocumentType,
    accept: string,
    govType?: GovernmentIdType,
  ) => {
    const err = validateFile(file, accept);
    if (err) {
      toast({ title: 'Upload failed', description: err, variant: 'destructive' });
      return;
    }
    const slotKey = `${type}-${govType ?? ''}`;
    setActiveUpload(slotKey);
    try {
      const existing = type === 'additional' ? undefined : findDoc(type, govType);
      await upload.mutateAsync({
        riderId,
        file,
        documentType: type,
        governmentIdType: govType,
        replaceId: existing?.id,
        replaceOldPath: existing?.file_url,
      });
      toast({ title: existing ? 'Document replaced' : 'Document uploaded' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setActiveUpload(null);
    }
  };

  const handlePreview = async (doc: KycDocument) => {
    try {
      const url = await getSignedUrl(doc.file_url);
      setPreviewMime(doc.mime_type || '');
      setPreviewUrl(url);
    } catch (e: any) {
      toast({ title: 'Preview failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (doc: KycDocument) => {
    try {
      await remove.mutateAsync(doc);
      toast({ title: 'Document removed' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading documents...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-foreground">Rider KYC Verification</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {SLOTS.map((slot) => (
          <DocSlot
            key={slot.type}
            slot={slot}
            doc={findDoc(slot.type)}
            isUploading={activeUpload === `${slot.type}-`}
            isAdmin={isAdmin}
            onPick={(file) => handleFile(file, slot.type, slot.accept)}
            onPreview={handlePreview}
            onDelete={handleDelete}
          />
        ))}

        {/* Government ID with selector */}
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">Government ID <span className="text-xs text-muted-foreground">(Optional, recommended)</span></p>
              <p className="text-xs text-muted-foreground">Select type, then upload a JPG, PNG or PDF (max 5MB)</p>
            </div>
            <Select value={govIdType} onValueChange={(v) => setGovIdType(v as GovernmentIdType)}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GOV_ID_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DocSlot
            slot={{
              type: 'government_id',
              label: GOV_ID_OPTIONS.find((o) => o.value === govIdType)!.label,
              required: false,
              accept: 'image/jpeg,image/png,application/pdf',
              description: 'JPG, PNG or PDF, max 5MB',
              icon: FileText,
            }}
            doc={findDoc('government_id', govIdType)}
            isUploading={activeUpload === `government_id-${govIdType}`}
            isAdmin={isAdmin}
            onPick={(file) => handleFile(file, 'government_id', 'image/jpeg,image/png,application/pdf', govIdType)}
            onPreview={handlePreview}
            onDelete={handleDelete}
            compact
          />
        </div>
      </div>

      {/* Additional documents */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Additional Documents</p>
            <p className="text-xs text-muted-foreground">Add multiple supporting files (JPG, PNG, PDF — max 5MB each)</p>
          </div>
          <AddAdditionalButton
            isUploading={activeUpload === 'additional-'}
            onPick={(file) => handleFile(file, 'additional', 'image/jpeg,image/png,application/pdf')}
          />
        </div>
        {additionals.length === 0 ? (
          <p className="text-xs text-muted-foreground">No additional documents uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {additionals.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate text-sm text-foreground">{d.file_name}</span>
                <StatusPill status={d.status} />
                <button type="button" onClick={() => handlePreview(d)} className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Preview">
                  <Eye className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => handleDelete(d)} className="rounded p-1 text-destructive hover:bg-destructive/10" aria-label="Delete">
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Document Preview</DialogTitle></DialogHeader>
          {previewUrl && (
            previewMime.startsWith('image/') ? (
              <img src={previewUrl} alt="Document preview" className="mx-auto max-h-[70vh] rounded-lg" />
            ) : (
              <iframe src={previewUrl} title="Document preview" className="h-[70vh] w-full rounded-lg" />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- subcomponents ---

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: 'border-warning/30 bg-warning/10 text-warning',
    verified: 'border-success/30 bg-success/10 text-success',
    rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] capitalize ${map[status] || ''}`}>{status}</span>;
};

interface DocSlotProps {
  slot: { type: KycDocumentType; label: string; required: boolean; accept: string; description: string; icon: typeof FileText };
  doc?: KycDocument;
  isUploading: boolean;
  isAdmin?: boolean;
  onPick: (file: File) => void;
  onPreview: (doc: KycDocument) => void;
  onDelete: (doc: KycDocument) => void;
  compact?: boolean;
}

const DocSlot = ({ slot, doc, isUploading, isAdmin, onPick, onPreview, onDelete, compact }: DocSlotProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = slot.icon;

  return (
    <div className={`rounded-xl border bg-card p-4 ${doc ? 'border-success/30' : 'border-border'} ${compact ? '' : ''}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {slot.label}{slot.required && <span className="text-destructive"> *</span>}
            </p>
            <p className="text-[11px] text-muted-foreground">{slot.description}</p>
          </div>
        </div>
        {doc && <StatusPill status={doc.status} />}
      </div>

      {doc ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
            <span className="flex-1 truncate text-xs text-foreground">{doc.file_name}</span>
          </div>
          {doc.notes && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-2 py-1.5">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-warning shrink-0" />
              <span className="text-[11px] text-warning">{doc.notes}</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => onPreview(doc)} className="flex-1 gap-1">
              <Eye className="h-3 w-3" /> Preview
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={isUploading} className="flex-1 gap-1">
              {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Replace
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onDelete(doc)} className="px-2 text-destructive">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/20 py-5 text-xs text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Uploading…</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span>Click to upload</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={slot.accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = '';
        }}
      />
    </div>
  );
};

const AddAdditionalButton = ({ onPick, isUploading }: { onPick: (file: File) => void; isUploading: boolean }) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => ref.current?.click()} disabled={isUploading}>
        {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
        Add file
      </Button>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = '';
        }}
      />
    </>
  );
};

export default KycDocumentsSection;

// Re-export progress for convenience
export { Progress };
