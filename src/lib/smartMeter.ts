import jsPDF from 'jspdf';

export const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export interface FareInputs {
  baseFare: number;
  pricePerKm: number;
  pricePerMinute: number;
  minimumFare: number;
  rateMultiplier: number;
  distanceKm: number;
  durationSeconds: number;
  extrasTotal: number;
}

export interface FareBreakdown {
  baseFare: number;
  distanceCost: number;
  timeCost: number;
  extras: number;
  subtotal: number;
  total: number;
  appliedMinimum: boolean;
}

export const calcFare = (i: FareInputs): FareBreakdown => {
  const minutes = i.durationSeconds / 60;
  const distanceCost = i.distanceKm * i.pricePerKm;
  const timeCost = minutes * i.pricePerMinute;
  const subtotal = (i.baseFare + distanceCost + timeCost) * i.rateMultiplier;
  const withExtras = subtotal + i.extrasTotal;
  const total = Math.max(withExtras, i.minimumFare);
  return {
    baseFare: i.baseFare,
    distanceCost,
    timeCost,
    extras: i.extrasTotal,
    subtotal,
    total,
    appliedMinimum: total > withExtras,
  };
};

export const formatNaira = (n: number) =>
  '₦' + Math.round(n).toLocaleString('en-NG');

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
  rateMultiplier: number;
  total: number;
}

export const generateReceiptPdf = (r: ReceiptData) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  let y = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('ASTERNG', 40, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Trip Receipt', 40, y + 16);
  doc.text(new Date().toLocaleString(), W - 40, y + 16, { align: 'right' });

  y += 50;
  doc.setDrawColor(200);
  doc.line(40, y, W - 40, y);
  y += 20;

  doc.setFontSize(11);
  const row = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 40, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 200, y);
    y += 18;
  };

  row('Trip ID:', r.tripId.slice(0, 8));
  row('Rider:', r.riderName);
  if (r.plate) row('Motorcycle:', r.plate);
  row('Started:', new Date(r.startedAt).toLocaleString());
  row('Ended:', new Date(r.endedAt).toLocaleString());
  row('Duration:', formatDuration(r.durationSeconds));
  row('Distance:', `${r.distanceKm.toFixed(2)} km`);
  if (r.startAddress) row('From:', r.startAddress);
  if (r.endAddress) row('To:', r.endAddress);

  y += 10;
  doc.line(40, y, W - 40, y);
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.text('Fare Breakdown', 40, y);
  y += 20;
  doc.setFont('helvetica', 'normal');

  const fareRow = (label: string, value: string) => {
    doc.text(label, 40, y);
    doc.text(value, W - 40, y, { align: 'right' });
    y += 16;
  };

  fareRow('Base Fare', formatNaira(r.baseFare));
  fareRow('Distance Cost', formatNaira(r.distanceCost));
  fareRow('Time Cost', formatNaira(r.timeCost));
  if (r.rateMultiplier !== 1) fareRow('Rate Multiplier', `x${r.rateMultiplier}`);
  r.extras.forEach((e) => fareRow(`Extra: ${e.label}`, formatNaira(e.amount)));

  y += 6;
  doc.line(40, y, W - 40, y);
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TOTAL', 40, y);
  doc.text(formatNaira(r.total), W - 40, y, { align: 'right' });

  y += 40;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Thank you for riding with ASTERNG.', W / 2, y, { align: 'center' });

  doc.save(`asterng-receipt-${r.tripId.slice(0, 8)}.pdf`);
};
