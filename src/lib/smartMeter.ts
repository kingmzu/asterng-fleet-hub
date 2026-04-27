import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Returns the hour (0-23) in Africa/Lagos for a given Date. */
export const lagosHour = (d: Date) => {
  // Africa/Lagos = UTC+1, no DST
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60_000;
  return new Date(utcMs + 60 * 60_000).getHours();
};

/** Night window: 18:00 (inclusive) → 06:00 (exclusive) */
export const isNightHour = (h: number) => h >= 18 || h < 6;

/**
 * Computes minutes during the trip that fell inside the night window.
 * Iterates minute-by-minute from start to end (cap at 24h to be safe).
 */
export const nightMinutesInRange = (start: Date, end: Date): number => {
  if (end <= start) return 0;
  const totalMin = Math.min(Math.floor((end.getTime() - start.getTime()) / 60_000), 24 * 60);
  let nightMin = 0;
  for (let i = 0; i < totalMin; i++) {
    const t = new Date(start.getTime() + i * 60_000);
    if (isNightHour(lagosHour(t))) nightMin++;
  }
  return nightMin;
};

export const NIGHT_RATE_PER_MINUTE = 15; // ₦15/min within night window
export const LUGGAGE_FLAT = 100; // ₦100 per trip when toggled

export interface FareInputs {
  baseFare: number;
  pricePerKm: number;
  pricePerMinute: number;
  minimumFare: number;
  rateMultiplier: number;
  distanceKm: number;
  durationSeconds: number;
  extrasTotal: number; // sum of stored extras (luggage/waiting/custom)
  nightSurcharge?: number; // pre-computed night charge
}

export interface FareBreakdown {
  baseFare: number;
  distanceCost: number;
  timeCost: number;
  extras: number;
  nightSurcharge: number;
  subtotal: number;
  total: number;
  appliedMinimum: boolean;
}

export const calcFare = (i: FareInputs): FareBreakdown => {
  const minutes = i.durationSeconds / 60;
  const distanceCost = i.distanceKm * i.pricePerKm;
  const timeCost = minutes * i.pricePerMinute;
  const subtotal = (i.baseFare + distanceCost + timeCost) * i.rateMultiplier;
  const nightSurcharge = i.nightSurcharge ?? 0;
  const withExtras = subtotal + i.extrasTotal + nightSurcharge;
  const total = Math.max(withExtras, i.minimumFare);
  return {
    baseFare: i.baseFare,
    distanceCost,
    timeCost,
    extras: i.extrasTotal,
    nightSurcharge,
    subtotal,
    total,
    appliedMinimum: total > withExtras,
  };
};

export const formatNaira = (n: number) =>
  'NGN ' + Math.round(n).toLocaleString('en-NG');

export const formatDuration = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
};

export interface ReceiptData {
  tripId: string;
  riderName: string;
  plate?: string | null;
  startedAt: string;
  endedAt: string;
  startAddress?: string | null;
  endAddress?: string | null;
  distanceKm: number;
  durationSeconds: number;
  baseFare: number;
  distanceCost: number;
  timeCost: number;
  extras: { label: string; amount: number }[];
  nightSurcharge: number;
  rateMultiplier: number;
  total: number;
}

const ORANGE: [number, number, number] = [217, 119, 6];
const SLATE: [number, number, number] = [100, 116, 139];

export const generateReceiptPdf = (r: ReceiptData) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  // Brand bar
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, W, 8, 'F');

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...ORANGE);
  doc.text('ASTERNG', 40, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE);
  doc.text('Trip Receipt', 40, 66);
  doc.text(new Date().toLocaleString('en-NG'), W - 40, 66, { align: 'right' });

  // Trip info table
  autoTable(doc, {
    startY: 90,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: { top: 4, bottom: 4, left: 0, right: 0 } },
    columnStyles: {
      0: { cellWidth: 110, fontStyle: 'bold', textColor: 60 },
      1: { textColor: 30 },
    },
    body: [
      ['Trip ID', r.tripId.slice(0, 8).toUpperCase()],
      ['Rider', r.riderName],
      ...(r.plate ? [['Motorcycle', r.plate]] : []),
      ['Started', new Date(r.startedAt).toLocaleString('en-NG')],
      ['Ended', new Date(r.endedAt).toLocaleString('en-NG')],
      ['Duration', formatDuration(r.durationSeconds)],
      ['Distance', `${r.distanceKm.toFixed(2)} km`],
      ...(r.startAddress ? [['From', r.startAddress]] : []),
      ...(r.endAddress ? [['To', r.endAddress]] : []),
    ] as any,
    margin: { left: 40, right: 40 },
  });

  let y = (doc as any).lastAutoTable.finalY + 18;

  // Fare breakdown title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.text('FARE BREAKDOWN', 40, y);
  y += 6;

  const fareRows: any[] = [
    ['Base Fare', formatNaira(r.baseFare)],
    ['Distance Cost', formatNaira(r.distanceCost)],
    ['Time Cost', formatNaira(r.timeCost)],
  ];
  if (r.rateMultiplier !== 1) fareRows.push(['Rate Multiplier', `x${r.rateMultiplier}`]);
  if (r.nightSurcharge > 0) fareRows.push(['Night Surcharge', formatNaira(r.nightSurcharge)]);
  r.extras.forEach((e) => fareRows.push([`Extra: ${e.label}`, formatNaira(e.amount)]));

  autoTable(doc, {
    startY: y + 6,
    theme: 'striped',
    head: [['Item', 'Amount']],
    body: fareRows,
    headStyles: { fillColor: ORANGE, textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 10, cellPadding: 6 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 130 },
    },
    margin: { left: 40, right: 40 },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // Total box
  doc.setFillColor(245, 158, 11);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(40, y, W - 80, 50, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255);
  doc.text('TOTAL', 56, y + 22);
  doc.setFontSize(20);
  doc.text(formatNaira(r.total), W - 56, y + 28, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text('Thank you for riding with ASTERNG.', W / 2, y + 80, { align: 'center' });

  doc.save(`asterng-receipt-${r.tripId.slice(0, 8)}.pdf`);
};

/** Multi-trip PDF export — for "Print" / "Export" of recent trips. */
export interface TripExportRow {
  date: string;
  rider: string;
  distanceKm: number;
  durationSeconds: number;
  status: string;
  total: number;
}

export const generateTripsPdf = (rows: TripExportRow[], opts: { title?: string; subtitle?: string }) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, W, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...ORANGE);
  doc.text('ASTERNG', 40, 32);

  doc.setFontSize(13);
  doc.setTextColor(40);
  doc.text(opts.title || 'Trip History', 40, 52);

  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text(opts.subtitle || `Generated ${new Date().toLocaleString('en-NG')}`, 40, 68);

  const totalRevenue = rows.reduce((s, r) => s + (r.total || 0), 0);

  autoTable(doc, {
    startY: 84,
    head: [['Date', 'Rider', 'Distance', 'Duration', 'Status', 'Total']],
    body: rows.map((r) => [
      r.date,
      r.rider,
      `${r.distanceKm.toFixed(2)} km`,
      formatDuration(r.durationSeconds),
      r.status,
      formatNaira(r.total),
    ]),
    headStyles: { fillColor: ORANGE, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9, cellPadding: 5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 130 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 32, right: 32 },
    foot: [['', '', '', '', 'Total', formatNaira(totalRevenue)]],
    footStyles: { fillColor: [241, 245, 249], textColor: 30, fontStyle: 'bold' },
  });

  doc.save(`asterng-trips-${new Date().toISOString().split('T')[0]}.pdf`);
};
