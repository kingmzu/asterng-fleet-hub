import { useMemo, useState } from 'react';
import { Eye, FileText, Search, ShieldCheck, ShieldX, ShieldAlert, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useRiders, useUpdateRider, useUserRoles } from '@/hooks/api';
import {
  useKycDocuments,
  getSignedUrl,
  type KycDocument,
} from '@/hooks/api/useKycDocuments';

const TYPE_LABEL: Record<string, string> = {
  passport_photo: 'Passport Photo',
  national_id: 'National ID (NIN)',
  bvn: 'BVN Document',
  government_id: 'Government ID',
  additional: 'Additional',
};

const REQUIRED_TYPES = ['passport_photo', 'national_id', 'bvn'];

const statusBadgeClass = (s: string) =>
  s === 'verified'
    ? 'border-success/30 bg-success/10 text-success'
    : s === 'rejected'
    ? 'border-destructive/30 bg-destructive/10 text-destructive'
    : 'border-warning/30 bg-warning/10 text-warning';

const KycRiderControl = () => {
  const { data: roles = [] } = useUserRoles();
  const isAdmin = roles.includes('admin') || roles.includes('operations_manager');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const { data: ridersData, isLoading } = useRiders(1, 100, 'all', search);
  const updateRider = useUpdateRider();

  const riders = ridersData?.data || [];
  const filtered = useMemo(
    () => (filter === 'all' ? riders : riders.filter((r) => r.kyc_status === filter)),
    [riders, filter]
  );

  // Documents modal state
  const [docsRiderId, setDocsRiderId] = useState<string | null>(null);
  const [docsRiderName, setDocsRiderName] = useState('');
  const { data: riderDocs = [], isLoading: docsLoading } = useKycDocuments(docsRiderId || undefined);

  // Reject modal state
  const [rejectRider, setRejectRider] = useState<{ id: string; name: string } | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  // Preview modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState('');

  const openPreview = async (doc: KycDocument) => {
    try {
      const url = await getSignedUrl(doc.file_url, 600);
      setPreviewMime(doc.mime_type || '');
      setPreviewUrl(url);
    } catch (e: any) {
      toast.error('Preview failed', { description: e.message });
    }
  };

  const openInNewTab = async (doc: KycDocument) => {
    try {
      const url = await getSignedUrl(doc.file_url, 600);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      toast.error('Could not open file', { description: e.message });
    }
  };

  const setStatus = async (
    rider: { id: string; full_name: string },
    next: 'pending' | 'verified' | 'rejected',
    note?: string | null
  ) => {
    if (next === 'verified') {
      // Validate required docs exist + verified
      const { data, error } = await import('@/integrations/supabase/client').then(({ supabase }) =>
        supabase.from('kyc_documents').select('document_type,status').eq('rider_id', rider.id)
      );
      if (error) {
        toast.error('Validation failed', { description: error.message });
        return;
      }
      const docs = data || [];
      const missing = REQUIRED_TYPES.filter(
        (t) => !docs.some((d) => d.document_type === t)
      );
      if (missing.length) {
        toast.error('Cannot verify rider', {
          description: `Missing required documents: ${missing
            .map((m) => TYPE_LABEL[m])
            .join(', ')}`,
        });
        return;
      }
    }

    try {
      await updateRider.mutateAsync({
        id: rider.id,
        data: { kyc_status: next, kyc_note: note ?? null },
      });
      toast.success(`KYC ${next}`, { description: rider.full_name });
    } catch (e: any) {
      toast.error('Update failed', { description: e.message });
    }
  };

  const submitReject = async () => {
    if (!rejectRider) return;
    if (!rejectNote.trim()) {
      toast.error('Reason required', { description: 'Please enter a rejection reason.' });
      return;
    }
    await setStatus({ id: rejectRider.id, full_name: rejectRider.name }, 'rejected', rejectNote.trim());
    setRejectRider(null);
    setRejectNote('');
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">Rider KYC Management</h3>
          <p className="text-xs text-muted-foreground">
            {isAdmin ? 'Approve, reject and review rider verification' : 'Read-only KYC overview'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search rider..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-44 pl-7 text-xs"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile cards / Desktop table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2 font-medium">Rider</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">KYC Status</th>
              <th className="px-3 py-2 font-medium">Note</th>
              <th className="px-5 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-5 py-3"><Skeleton className="h-5 w-32" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-5 w-20" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-5 w-32" /></td>
                  <td className="px-5 py-3"><Skeleton className="ml-auto h-7 w-32" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  No riders match the current filters
                </td>
              </tr>
            ) : (
              filtered.map((rider) => (
                <tr key={rider.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-display text-[11px] font-bold text-primary">
                        {rider.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{rider.full_name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{rider.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{rider.phone_number}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] capitalize ${statusBadgeClass(rider.kyc_status)}`}>
                      {rider.kyc_status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    <span className="line-clamp-2 max-w-[18rem]">{rider.kyc_note || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1"
                        onClick={() => {
                          setDocsRiderId(rider.id);
                          setDocsRiderName(rider.full_name);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" /> View Documents
                      </Button>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" className="h-8 gap-1" disabled={updateRider.isPending}>
                              {updateRider.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                              Set Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs">Update KYC Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setStatus(rider, 'pending', null)}>
                              <ShieldAlert className="mr-2 h-4 w-4 text-warning" /> Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatus(rider, 'verified', null)}>
                              <ShieldCheck className="mr-2 h-4 w-4 text-success" /> Verified
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setRejectRider({ id: rider.id, name: rider.full_name });
                                setRejectNote(rider.kyc_note || '');
                              }}
                            >
                              <ShieldX className="mr-2 h-4 w-4 text-destructive" /> Rejected
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Documents modal */}
      <Dialog
        open={!!docsRiderId}
        onOpenChange={(o) => {
          if (!o) {
            setDocsRiderId(null);
            setDocsRiderName('');
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documents — {docsRiderName}</DialogTitle>
            <DialogDescription>
              {isAdmin
                ? 'Click a document to preview, or open in a new tab.'
                : 'You do not have permission to view sensitive document files.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {docsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : riderDocs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No documents uploaded for this rider yet.
              </p>
            ) : (
              riderDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {TYPE_LABEL[doc.document_type] || doc.document_type}
                      {doc.government_id_type ? ` (${doc.government_id_type.replace(/_/g, ' ')})` : ''}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{doc.file_name}</p>
                    {doc.notes && <p className="text-[11px] text-warning">Note: {doc.notes}</p>}
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] capitalize ${statusBadgeClass(doc.status)}`}>
                    {doc.status}
                  </span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => openPreview(doc)}>
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => openInNewTab(doc)}>
                        <Download className="h-3.5 w-3.5" /> Open
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview modal */}
      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewUrl &&
            (previewMime.startsWith('image/') ? (
              <img src={previewUrl} alt="Document preview" className="mx-auto max-h-[70vh] rounded-lg" />
            ) : (
              <iframe src={previewUrl} title="Document preview" className="h-[70vh] w-full rounded-lg" />
            ))}
        </DialogContent>
      </Dialog>

      {/* Reject reason modal */}
      <Dialog
        open={!!rejectRider}
        onOpenChange={(o) => {
          if (!o) {
            setRejectRider(null);
            setRejectNote('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject KYC — {rejectRider?.name}</DialogTitle>
            <DialogDescription>
              Provide a reason. The rider will see this note (e.g. "Blurry ID", "BVN mismatch").
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={4}
            maxLength={400}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectRider(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={submitReject} disabled={updateRider.isPending}>
              {updateRider.isPending ? 'Saving...' : 'Reject KYC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KycRiderControl;
