import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon loading in bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

export type MarkerStatus = 'on_trip' | 'online' | 'offline' | 'start' | 'current' | 'end';

const statusColor: Record<MarkerStatus, string> = {
  on_trip: '#16a34a',  // green
  online: '#eab308',   // yellow
  offline: '#dc2626',  // red
  start: '#0ea5e9',    // sky
  current: '#f97316',  // orange
  end: '#7c3aed',      // violet
};

export const dotIcon = (status: MarkerStatus) =>
  L.divIcon({
    className: 'asterng-dot-marker',
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${statusColor[status]};box-shadow:0 0 0 4px ${statusColor[status]}33,0 1px 4px rgba(0,0,0,.3);border:2px solid #fff"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const Recenter = ({ center, zoom }: { center: [number, number]; zoom?: number }) => {
  const map = useMap();
  const last = useRef<string>('');
  useEffect(() => {
    const key = `${center[0].toFixed(5)},${center[1].toFixed(5)}`;
    if (key !== last.current) {
      map.setView(center, zoom ?? map.getZoom(), { animate: true });
      last.current = key;
    }
  }, [center, zoom, map]);
  return null;
};

export interface LeafletMarker {
  id: string;
  position: [number, number];
  status: MarkerStatus;
  popup?: React.ReactNode;
  onClick?: () => void;
}

interface Props {
  center: [number, number];
  zoom?: number;
  markers?: LeafletMarker[];
  path?: [number, number][];
  pathColor?: string;
  followCenter?: boolean;
  className?: string;
}

const LeafletMap = ({
  center,
  zoom = 14,
  markers = [],
  path,
  pathColor = '#f97316',
  followCenter = false,
  className,
}: Props) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className={className ?? 'h-full w-full'}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {followCenter && <Recenter center={center} zoom={zoom} />}
      {path && path.length > 1 && <Polyline positions={path} pathOptions={{ color: pathColor, weight: 4 }} />}
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={m.position}
          icon={dotIcon(m.status)}
          eventHandlers={m.onClick ? { click: m.onClick } : undefined}
        >
          {m.popup && <Popup>{m.popup}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  );
};

export default LeafletMap;
