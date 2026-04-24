import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { ExportColumn, ExportFormat } from '@/lib/exportData';
import { exportData } from '@/lib/exportData';

interface Props<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filename: string;
  columns: ExportColumn<T>[];
  /** Currently filtered rows shown on screen */
  filteredRows: T[];
  /** Optional loader for the entire dataset (when scope = "all") */
  loadAllRows?: () => Promise<T[]>;
}

function ExportDialog<T>({
  open, onOpenChange, filename, columns, filteredRows, loadAllRows,
}: Props<T>) {
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [scope, setScope] = useState<'filtered' | 'all'>('filtered');
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      const rows =
        scope === 'all' && loadAllRows ? await loadAllRows() : filteredRows;
      exportData(format, filename, columns, rows);
      toast.success(`Exported ${rows.length} row${rows.length === 1 ? '' : 's'}`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Export failed', { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export data</DialogTitle>
          <DialogDescription>Choose a format and scope for your download.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Format</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${format === 'xlsx' ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:bg-muted/40'}`}
              >
                <FileSpreadsheet className="h-5 w-5" />
                Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${format === 'pdf' ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:bg-muted/40'}`}
              >
                <FileText className="h-5 w-5" />
                PDF
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Scope</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('filtered')}
                className={`rounded-lg border p-2 text-sm transition-colors ${scope === 'filtered' ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:bg-muted/40'}`}
              >
                Current view ({filteredRows.length})
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                disabled={!loadAllRows}
                className={`rounded-lg border p-2 text-sm transition-colors disabled:opacity-50 ${scope === 'all' ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:bg-muted/40'}`}
              >
                All records
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={busy} className="gap-2">
            <Download className="h-4 w-4" />
            {busy ? 'Exporting...' : 'Download'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
