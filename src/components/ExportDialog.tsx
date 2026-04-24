import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { exportPdf, exportXlsx, type ExportColumn } from '@/lib/exporters';

interface Props<T> {
  /** Rows visible in the current filtered view. */
  filteredRows: T[];
  /** Async loader for the full unfiltered dataset. */
  fetchAll: () => Promise<T[]>;
  columns: ExportColumn<T>[];
  fileBase: string;
  title?: string;
  triggerLabel?: string;
  disabled?: boolean;
}

export default function ExportDialog<T>({
  filteredRows,
  fetchAll,
  columns,
  fileBase,
  title,
  triggerLabel = 'Export',
  disabled,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'xlsx' | 'pdf'>('xlsx');
  const [scope, setScope] = useState<'filtered' | 'all'>('filtered');
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      const rows = scope === 'filtered' ? filteredRows : await fetchAll();
      if (!rows.length) {
        toast({
          title: 'Nothing to export',
          description: 'No records match the current selection.',
          variant: 'destructive',
        });
        return;
      }
      if (format === 'xlsx') exportXlsx(rows, columns, fileBase);
      else exportPdf(rows, columns, fileBase, title || fileBase);
      toast({ title: 'Export ready', description: `${rows.length} rows downloaded` });
      setOpen(false);
    } catch (e: any) {
      toast({ title: 'Export failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={disabled}>
          <Download className="h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export {title || fileBase}</DialogTitle>
          <DialogDescription>Choose a format and which records to include.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label className="mb-2 block text-sm font-medium">Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as 'xlsx' | 'pdf')}
              className="grid grid-cols-2 gap-2"
            >
              <label
                htmlFor="fmt-xlsx"
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  format === 'xlsx' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <RadioGroupItem id="fmt-xlsx" value="xlsx" />
                <FileSpreadsheet className="h-4 w-4 text-success" /> Excel (.xlsx)
              </label>
              <label
                htmlFor="fmt-pdf"
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  format === 'pdf' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <RadioGroupItem id="fmt-pdf" value="pdf" />
                <FileText className="h-4 w-4 text-destructive" /> PDF (.pdf)
              </label>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">Records</Label>
            <RadioGroup
              value={scope}
              onValueChange={(v) => setScope(v as 'filtered' | 'all')}
              className="space-y-2"
            >
              <label
                htmlFor="sc-filtered"
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  scope === 'filtered' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <RadioGroupItem id="sc-filtered" value="filtered" className="mt-0.5" />
                <div>
                  <div className="font-medium">Current view ({filteredRows.length})</div>
                  <div className="text-xs text-muted-foreground">
                    Exports exactly what's on screen after filters and search
                  </div>
                </div>
              </label>
              <label
                htmlFor="sc-all"
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  scope === 'all' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <RadioGroupItem id="sc-all" value="all" className="mt-0.5" />
                <div>
                  <div className="font-medium">All records</div>
                  <div className="text-xs text-muted-foreground">
                    Pulls the full dataset for this module
                  </div>
                </div>
              </label>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
