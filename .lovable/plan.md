## Problem

The Leaflet maps on **Smart Meter** and **Live Tracking** pages dominate the viewport on small screens. The current sizing uses large viewport-relative heights (`h-[40vh]`/`h-[55vh]`) with high `min-h` floors (260–320px), and Leaflet's default tile layer sits at a high stacking context, so the map covers controls/header on phones and feels like it's "blocking" the page. The map also doesn't shrink predictably when content above grows.

## Fix

### 1. Smart Meter map (`src/pages/SmartMeterPage.tsx`, line 498)
Replace the fixed-vh card with a responsive, content-aware height:
- Mobile: fixed `h-56` (224px) so the meter controls remain visible without scrolling far.
- Tablet: `sm:h-72`.
- Desktop: `lg:h-[460px]` (column matches meter card height).
- Drop the `vh`/`min-h`/`max-h` combo — it fights the flex parent.

### 2. Live Tracking map (`src/pages/LiveTrackingPage.tsx`, ~line 95)
Same treatment:
- Mobile: `h-64` (256px).
- Tablet: `sm:h-80`.
- Desktop: `lg:h-[520px]`.
- Keep the status badges row above the map so it never overlaps.

### 3. Leaflet stacking / overlap (`src/components/maps/LeafletMap.tsx` + `src/index.css`)
- Add a wrapper div with `relative isolate` around `MapContainer` so Leaflet's internal `z-index` (which can reach 400+) cannot escape its card.
- Add a global rule in `src/index.css`:
  ```css
  .leaflet-container { z-index: 0; }
  .leaflet-pane, .leaflet-top, .leaflet-bottom { z-index: auto; }
  ```
  This prevents the map from covering the sidebar, sheet, dropdowns, and toasts.

### 4. Sheet detail map (Live Tracking sheet, ~line 145)
Reduce inner mini-map from `h-48` to `h-40` on mobile and ensure it scrolls inside the sheet (parent already has `overflow-y-auto`).

## Files changed
- `src/pages/SmartMeterPage.tsx`
- `src/pages/LiveTrackingPage.tsx`
- `src/components/maps/LeafletMap.tsx`
- `src/index.css`

No DB or API changes.
