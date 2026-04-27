import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Loader2, MapPin, Clock, Route, Wallet } from 'lucide-react';
import LeafletMap, { LeafletMarker } from '@/components/maps/LeafletMap';
import { useRiderLocations } from '@/hooks/api/useRiderLocations';
import { useRiders } from '@/hooks/api/useRiders';
import { useTripsPaginated, useTripPoints, useActivePricing } from '@/hooks/api/useSmartMeter';
import { calcFare, formatDuration, formatNaira } from '@/lib/smartMeter';

const ABUJA: [number, number] = [9.0765, 7.3986];

const LiveTrackingPage = () => {
  const { data: locations = [], isLoading } = useRiderLocations();
  const { data: ridersResp } = useRiders(1, 200, 'all', '');
  const riders = ridersResp?.data || [];
  const { data: tripsResp } = useTripsPaginated(1, 100);
  const trips = tripsResp?.rows || [];
  const { data: pricing } = useActivePricing();

  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

  const ridersById = useMemo(() => Object.fromEntries(riders.map((r) => [r.id, r])), [riders]);

  const markers: LeafletMarker[] = locations.map((loc) => {
    const r = ridersById[loc.rider_id];
    return {
      id: loc.rider_id,
      position: [Number(loc.lat), Number(loc.lng)],
      status: loc.status,
      onClick: () => setSelectedRiderId(loc.rider_id),
      popup: (
        <div className="text-xs">
          <div className="font-semibold">{r?.full_name || 'Rider'}</div>
          <div className="capitalize text-muted-foreground">{loc.status.replace('_', ' ')}</div>
        </div>
      ),
    };
  });

  const center: [number, number] = markers[0]?.position ?? ABUJA;

  const selectedLoc = locations.find((l) => l.rider_id === selectedRiderId);
  const selectedRider = selectedRiderId ? ridersById[selectedRiderId] : null;
  const activeTrip = selectedLoc?.current_trip_id
    ? trips.find((t: any) => t.id === selectedLoc.current_trip_id)
    : trips.find((t: any) => t.rider_id === selectedRiderId && t.status !== 'completed');
  const lastTrip = trips.find((t: any) => t.rider_id === selectedRiderId);

  const { data: tripPoints = [] } = useTripPoints(activeTrip?.id);
  const livePath: [number, number][] = tripPoints.map((p: any) => [Number(p.lat), Number(p.lng)]);

  // Live fare estimate for selected active trip
  const liveFare = useMemo(() => {
    if (!activeTrip || !pricing) return null;
    const startedAt = new Date(activeTrip.started_at).getTime();
    const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    return calcFare({
      baseFare: Number(pricing.base_fare),
      pricePerKm: Number(pricing.price_per_km),
      pricePerMinute: Number(pricing.price_per_minute),
      minimumFare: Number(pricing.minimum_fare),
      rateMultiplier: Number(pricing.rate_multiplier),
      distanceKm: Number(activeTrip.distance_km || 0),
      durationSeconds: seconds,
      extrasTotal: Number(activeTrip.extras_total || 0),
    });
  }, [activeTrip, pricing]);

  const counts = {
    on_trip: locations.filter((l) => l.status === 'on_trip').length,
    online: locations.filter((l) => l.status === 'online').length,
    offline: locations.filter((l) => l.status === 'offline').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: '#16a34a' }} /> On Trip · {counts.on_trip}
        </Badge>
        <Badge variant="secondary" className="gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: '#eab308' }} /> Online · {counts.online}
        </Badge>
        <Badge variant="secondary" className="gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: '#dc2626' }} /> Offline · {counts.offline}
        </Badge>
      </div>

      <Card className="overflow-hidden h-[70vh] min-h-[420px] relative">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <LeafletMap center={center} zoom={13} markers={markers} />
        )}
        {!isLoading && markers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-lg bg-card/90 px-4 py-3 text-sm text-muted-foreground shadow">
              No active rider locations yet. Riders will appear once they start sharing GPS.
            </div>
          </div>
        )}
      </Card>

      <Sheet open={!!selectedRiderId} onOpenChange={(o) => !o && setSelectedRiderId(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedRider?.full_name || 'Rider'}</SheetTitle>
            <SheetDescription>
              Status:{' '}
              <Badge
                variant={selectedLoc?.status === 'on_trip' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {selectedLoc?.status.replace('_', ' ') || 'unknown'}
              </Badge>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg border h-48 overflow-hidden">
              {selectedLoc && (
                <LeafletMap
                  center={[Number(selectedLoc.lat), Number(selectedLoc.lng)]}
                  zoom={15}
                  markers={[{
                    id: 'sel',
                    position: [Number(selectedLoc.lat), Number(selectedLoc.lng)],
                    status: selectedLoc.status,
                  }]}
                  path={livePath}
                  followCenter
                />
              )}
            </div>

            {activeTrip ? (
              <Card className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">Current Trip</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-muted p-2">
                    <Clock className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                    <div className="text-xs mt-1 font-medium">
                      {formatDuration(Math.floor((Date.now() - new Date(activeTrip.started_at).getTime()) / 1000))}
                    </div>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <Route className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                    <div className="text-xs mt-1 font-medium">
                      {Number(activeTrip.distance_km).toFixed(2)} km
                    </div>
                  </div>
                  <div className="rounded-md bg-primary/10 p-2">
                    <Wallet className="h-3.5 w-3.5 mx-auto text-primary" />
                    <div className="text-xs mt-1 font-bold text-primary">
                      {liveFare ? formatNaira(liveFare.total) : '—'}
                    </div>
                  </div>
                </div>
                <div className="text-xs space-y-1.5">
                  <div className="flex gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="text-muted-foreground">Start</div>
                      <div>
                        {activeTrip.start_lat
                          ? `${Number(activeTrip.start_lat).toFixed(4)}, ${Number(activeTrip.start_lng).toFixed(4)}`
                          : '—'}
                      </div>
                    </div>
                  </div>
                  {selectedLoc && (
                    <div className="flex gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <div className="text-muted-foreground">Current</div>
                        <div>{Number(selectedLoc.lat).toFixed(4)}, {Number(selectedLoc.lng).toFixed(4)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-4 space-y-2">
                <h3 className="font-semibold text-sm">Last known activity</h3>
                {selectedLoc ? (
                  <p className="text-xs text-muted-foreground">
                    Last seen {new Date(selectedLoc.last_seen_at).toLocaleString()} at{' '}
                    {Number(selectedLoc.lat).toFixed(4)}, {Number(selectedLoc.lng).toFixed(4)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No GPS data available.</p>
                )}
                {lastTrip && (
                  <div className="text-xs border-t pt-2 mt-2 space-y-1">
                    <div className="font-medium">Last trip</div>
                    <div className="text-muted-foreground">
                      {new Date(lastTrip.started_at).toLocaleString()} ·{' '}
                      {Number(lastTrip.distance_km).toFixed(2)} km ·{' '}
                      {formatNaira(Number(lastTrip.total_fare || 0))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default LiveTrackingPage;
