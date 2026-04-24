/**
 * Generic export helper: PDF (jsPDF + autoTable) and XLSX (SheetJS).
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type ExportFormat = 'pdf' | 'xlsx';

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

export function exportData<T>(
  format: ExportFormat,
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const safeName = filename.replace(/[^a-z0-9-_]+/gi, '_');
  if (rows.length === 0) {
    throw new Error('Nothing to export — there are no rows to include.');
  }
  if (format === 'xlsx') {
    const aoa = [columns.map((c) => c.header), ...rows.map((r) => columns.map((c) => c.accessor(r)))];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Export');
    XLSX.writeFile(wb, `${safeName}.xlsx`);
  } else {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(filename, 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [columns.map((c) => c.header)],
      body: rows.map((r) => columns.map((c) => String(c.accessor(r) ?? ''))),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [234, 88, 12] },
    });
    doc.save(`${safeName}.pdf`);
  }
}
