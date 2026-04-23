import { useState } from 'react';
import { CheckCircle, XCircle, Eye, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
  usePendingKycDocuments,
  useReviewKycDocument,
  getSignedUrl,
  type KycDocument,
} from '@/hooks/api/useKycDocuments';

const TYPE_LABEL: Record<string, string> = {
  passport_photo: 'Passport Photo',
  national_id: 'National ID',
  bvn: 'BVN',
  government_id: 'Government ID',
  additional: 'Additional',
};

const KycReviewPanel = () => {
  const { data, isLoading } = usePendingKycDocuments();
  const review = useReviewKycDocument();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState('');
  const [rejectDoc, setRejectDoc] = useState<KycDocument | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const docs = (data || []) as Array<KycDocument & { riders?: { full_name: string; phone_number: string } }>;

  const handlePreview = async (doc: KycDocument) => {
    try {
      const url = await getSignedUrl(doc.file_url);
      setPreviewMime(doc.mime_type || '');
      setPreviewUrl(url);
    } catch (e: any) {
      toast({ title: 'Preview failed', description: e.message, variant: 'destructive' });
    }
  };

  const approve = async (doc: KycDocument) => {
    try {
      await review.mutateAsync({ id: doc.id, status: 'verified', notes: null });
      toast({ title: 'Document verified' });
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const submitReject = async () => {
    if (!rejectDoc) return;
    try {
      await review.mutateAsync({ id: rejectDoc.id, status: 'rejected', notes: rejectNotes.trim() || null });
      toast({ title: 'Document rejected' });
      setRejectDoc(null);
      setRejectNotes('');
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const statusClass = (s: string) =>
    s === 'verified' ? 'border-success/30 bg-success/10 text-success'
    : s === 'rejected' ? 'border-destructive/30 bg-destructive/10 text-destructive'
    : 'border-warning/30 bg-warning/10 text-warning';

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h3 className="font-display text-sm font-semibold text-foreground">KYC Document Reviews</h3>
        <p className="text-xs text-muted-foreground">Approve or reject rider verification documents</p>
      </div>
      <div className="divide-y divide-border">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="m-4 h-16" />)
        ) : docs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No KYC documents submitted yet</div>
        ) : (
          docs.map((doc) => (
            <div key={doc.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <FileText className="h-4 w-4 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {doc.riders?.full_name || 'Unknown rider'} <span className="text-muted-foreground">— {TYPE_LABEL[doc.document_type] || doc.document_type}</span>
                </p>
                <p className="truncate text-xs text-muted-foreground">{doc.file_name}</p>
                {doc.notes && <p className="mt-1 text-[11px] text-warning">Note: {doc.notes}</p>}
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] capitalize ${statusClass(doc.status)}`}>{doc.status}</span>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="outline" onClick={() => handlePreview(doc)} className="gap-1">
                  <Eye className="h-3 w-3" /> View
                </Button>
                {doc.status !== 'verified' && (
                  <Button type="button" size="sm" variant="outline" onClick={() => approve(doc)} disabled={review.isPending} className="gap-1 text-success">
                    {review.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />} Approve
                  </Button>
                )}
                {doc.status !== 'rejected' && (
                  <Button type="button" size="sm" variant="outline" onClick={() => { setRejectDoc(doc); setRejectNotes(doc.notes || ''); }} className="gap-1 text-destructive">
                    <XCircle className="h-3 w-3" /> Reject
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Document Preview</DialogTitle></DialogHeader>
          {previewUrl && (previewMime.startsWith('image/')
            ? <img src={previewUrl} alt="Document preview" className="mx-auto max-h-[70vh] rounded-lg" />
            : <iframe src={previewUrl} title="Document preview" className="h-[70vh] w-full rounded-lg" />)}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectDoc} onOpenChange={(o) => !o && setRejectDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Reject Document</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Add a note explaining why (e.g. "Blurry ID", "BVN mismatch").</p>
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={3}
              maxLength={300}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDoc(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitReject} disabled={review.isPending}>
              {review.isPending ? 'Saving...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KycReviewPanel;
