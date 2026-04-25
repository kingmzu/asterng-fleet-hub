/**
 * Generic export helpers — XLSX and PDF.
 * Used by the ExportDialog across all list pages.
 */
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn<T> {
  header: string;
  /** Cell value — string/number, or formatter from row. */
  accessor: (row: T) => string | number | null | undefined;
}

const safeFile = (name: string) => name.replace(/[^a-z0-9-_]+/gi, '_');

const today = () => new Date().toISOString().split('T')[0];

export function exportXlsx<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  fileBase: string
) {
  const data = rows.map((r) => {
    const obj: Record<string, string | number> = {};
    columns.forEach((c) => {
      const v = c.accessor(r);
      obj[c.header] = v == null ? '' : (typeof v === 'number' ? v : String(v));
    });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data, {
    header: columns.map((c) => c.header),
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${safeFile(fileBase)}-${today()}.xlsx`);
}

export function exportPdf<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  fileBase: string,
  title?: string
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });
  // Brand header
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 6, 'F');
  doc.setFontSize(16);
  doc.setTextColor(217, 119, 6);
  doc.text('ASTERNG', 40, 32);
  doc.setFontSize(13);
  doc.setTextColor(40);
  doc.text(title || fileBase, 40, 52);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, 40, 68);

  autoTable(doc, {
    startY: 80,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) =>
      columns.map((c) => {
        const v = c.accessor(r);
        return v == null ? '' : String(v);
      })
    ),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [217, 119, 6], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 32, right: 32 },
  });

  doc.save(`${safeFile(fileBase)}-${today()}.pdf`);
}
