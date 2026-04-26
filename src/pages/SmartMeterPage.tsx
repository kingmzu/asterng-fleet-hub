import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Play, Pause, Square, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LeafletMap from '@/components/maps/LeafletMap';
import { useRiders } from '@/hooks/api/useRiders';
import { useCurrentUser } from '@/hooks/api/useAuth';
import { useRoles } from '@/hooks/api/useRoles';
import {
  useActivePricing,
  useUpdateTrip,
  useAddExtra,
  useRemoveExtra,
  useTripExtras,
  useAddTripPoint,
  useTrips,
} from '@/hooks/api/useSmartMeter';
import { usePushRiderLocation } from '@/hooks/api/useRiderLocations';
import { calcFare, formatDuration, formatNaira, generateReceiptPdf, haversineKm } from '@/lib/smartMeter';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_CENTER: [number, number] = [9.0765, 7.3986]; // Abuja

type Status = 'idle' | 'active' | 'paused';

const SmartMeterPage = () => {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { isStaff } = useRoles();

  const { data: pricing } = useActivePricing();
  const { data: ridersResp } = useRiders(1, 200, 'all', '');
  const riders = ridersResp?.data || [];
  const { data: recentTrips = [] } = useTrips();

  const updateTrip = useUpdateTrip();
  const addExtra = useAddExtra();
  const removeExtra = useRemoveExtra();
  const addPoint = useAddTripPoint();
  const pushLocation = usePushRiderLocation();

  const [riderId, setRiderId] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [tripId, setTripId] = useState<string | null>(null);
  const { data: extras = [] } = useTripExtras(tripId ?? undefined);

  const [path, setPath] = useState<[number, number][]>([]);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [extraLabel, setExtraLabel] = useState('');
  const [extraAmount, setExtraAmount] = useState('');

  const watchIdRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const startedAtRef = useRef<string | null>(null);
  const motorcycleIdRef = useRef<string | null>(null);

  const myRider = useMemo(() => riders.find((r) => r.user_id === user?.id), [riders, user]);
  useEffect(() => {
    if (!isStaff && myRider && !riderId) setRiderId(myRider.id);
  }, [isStaff, myRider, riderId]);

  const selectedRider = riders.find((r) => r.id === riderId);
  const extrasTotal = extras.reduce((s, e) => s + Number(e.amount), 0);

  const fare = useMemo(() => {
    if (!pricing) return null;
    return calcFare({
      baseFare: Number(pricing.base_fare),
      pricePerKm: Number(pricing.price_per_km),
      pricePerMinute: Number(pricing.price_per_minute),
      minimumFare: Number(pricing.minimum_fare),
      rateMultiplier: Number(pricing.rate_multiplier),
      distanceKm,
      durationSeconds: activeSeconds,
      extrasTotal,
    });
  }, [pricing, distanceKm, activeSeconds, extrasTotal]);

  // Push location to backend (so live-tracking map sees this rider)
  const broadcast = (
    pos: [number, number],
    accuracy: number | null,
    heading: number | null,
    speed: number | null,
    nextStatus: 'online' | 'on_trip'
  ) => {
    if (!riderId) return;
    pushLocation.mutate({
      rider_id: riderId,
      lat: pos[0],
      lng: pos[1],
      accuracy,
      heading,
      speed,
      status: nextStatus,
      current_trip_id: tripId,
    });
  };

  const startGps = (statusForPush: 'online' | 'on_trip') => {
    if (!navigator.geolocation) {
      toast({ title: 'GPS unavailable', description: 'Browser geolocation not supported.', variant: 'destructive' });
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCurrentPos(p);
        setCenter(p);
        setPath((prev) => {
          if (prev.length === 0) {
            broadcast(p, pos.coords.accuracy, pos.coords.heading, pos.coords.speed, statusForPush);
            return [p];
          }
          const last = prev[prev.length - 1];
          const d = haversineKm({ lat: last[0], lng: last[1] }, { lat: p[0], lng: p[1] });
          if (d < 0.005) return prev;
          setDistanceKm((dk) => dk + d);
          if (tripId) addPoint.mutate({ trip_id: tripId, lat: p[0], lng: p[1] });
          broadcast(p, pos.coords.accuracy, pos.coords.heading, pos.coords.speed, statusForPush);
          return [...prev, p];
        });
      },
      (err) => toast({ title: 'GPS error', description: err.message, variant: 'destructive' }),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    // Heartbeat in case position barely changes
    if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
    heartbeatRef.current = window.setInterval(() => {
      if (currentPos) broadcast(currentPos, null, null, null, statusForPush);
    }, 15_000);
  };

  const stopGps = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
    heartbeatRef.current = null;
  };

  const startTimer = () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => setActiveSeconds((s) => s + 1), 1000);
  };
  const stopTimer = () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
  };

  useEffect(() => () => { stopGps(); stopTimer(); }, []);

  // Auto-start "online" presence ping for rider when idle
  useEffect(() => {
    if (status !== 'idle') return;
    if (!riderId) return;
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(p);
        pushLocation.mutate({
          rider_id: riderId,
          lat: p[0],
          lng: p[1],
          accuracy: pos.coords.accuracy,
          heading: null,
          speed: null,
          status: 'online',
          current_trip_id: null,
        });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    );
    return () => { /* one-shot, nothing to clear */ void id; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riderId, status]);

  const handleStart = async () => {
    if (!riderId) { toast({ title: 'Select a rider', variant: 'destructive' }); return; }
    if (!pricing) { toast({ title: 'No active pricing', description: 'Ask an admin to set pricing.', variant: 'destructive' }); return; }
    const rider = riders.find((r) => r.id === riderId);
    motorcycleIdRef.current = rider?.assigned_bike_id ?? null;

    let startPos: [number, number] | null = null;
    try {
      startPos = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve([p.coords.latitude, p.coords.longitude]),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    } catch {}

    startedAtRef.current = new Date().toISOString();
    const { data, error } = await supabase
      .from('trips')
      .insert({
        rider_id: riderId,
        motorcycle_id: motorcycleIdRef.current,
        status: 'active',
        started_at: startedAtRef.current,
        started_by: user?.id,
        start_lat: startPos?.[0],
        start_lng: startPos?.[1],
        pricing_tier: pricing.tier,
        rate_multiplier: Number(pricing.rate_multiplier),
        minimum_fare: Number(pricing.minimum_fare),
        base_fare: Number(pricing.base_fare),
        pricing_snapshot: pricing as any,
      })
      .select()
      .single();
    if (error) { toast({ title: 'Could not start', description: error.message, variant: 'destructive' }); return; }
    setTripId(data.id);
    setPath(startPos ? [startPos] : []);
    setDistanceKm(0);
    setActiveSeconds(0);
    setStatus('active');
    if (startPos) {
      setCenter(startPos);
      setCurrentPos(startPos);
      pushLocation.mutate({
        rider_id: riderId,
        lat: startPos[0],
        lng: startPos[1],
        accuracy: null, heading: null, speed: null,
        status: 'on_trip',
        current_trip_id: data.id,
      });
    }
    startGps('on_trip');
    startTimer();
    toast({ title: 'Ride started', description: 'GPS tracking active.' });
  };

  const handlePause = async () => {
    if (status === 'active') {
      stopGps();
      stopTimer();
      setStatus('paused');
      if (tripId) await updateTrip.mutateAsync({ id: tripId, data: { status: 'paused' } });
    } else if (status === 'paused') {
      startGps('on_trip');
      startTimer();
      setStatus('active');
      if (tripId) await updateTrip.mutateAsync({ id: tripId, data: { status: 'active' } });
    }
  };

  const handleEnd = async () => {
    if (!tripId || !fare || !pricing) return;
    stopGps();
    stopTimer();
    const endedAt = new Date().toISOString();
    const endPos = currentPos;
    await updateTrip.mutateAsync({
      id: tripId,
      data: {
        status: 'completed',
        ended_at: endedAt,
        end_lat: endPos?.[0],
        end_lng: endPos?.[1],
        active_duration_seconds: activeSeconds,
        distance_km: distanceKm,
        base_fare: fare.baseFare,
        distance_cost: fare.distanceCost,
        time_cost: fare.timeCost,
        extras_total: fare.extras,
        total_fare: fare.total,
      },
    });

    if (riderId && endPos) {
      pushLocation.mutate({
        rider_id: riderId,
        lat: endPos[0],
        lng: endPos[1],
        accuracy: null, heading: null, speed: null,
        status: 'online',
        current_trip_id: null,
      });
    }

    generateReceiptPdf({
      tripId,
      riderName: selectedRider?.full_name || 'Rider',
      plate: undefined,
      startedAt: startedAtRef.current!,
      endedAt,
      distanceKm,
      durationSeconds: activeSeconds,
      baseFare: fare.baseFare,
      distanceCost: fare.distanceCost,
      timeCost: fare.timeCost,
      extras: extras.map((e) => ({ label: e.label, amount: Number(e.amount) })),
      rateMultiplier: Number(pricing.rate_multiplier),
      total: fare.total,
    });

    toast({ title: 'Ride completed', description: `Total: ${formatNaira(fare.total)}` });
    setStatus('idle');
    setTripId(null);
    setPath([]);
    setDistanceKm(0);
    setActiveSeconds(0);
  };

  const handleAddExtra = async () => {
    const amt = Number(extraAmount);
    if (!tripId || !extraLabel || !amt) return;
    await addExtra.mutateAsync({ trip_id: tripId, label: extraLabel, amount: amt });
    setExtraLabel('');
    setExtraAmount('');
  };

  const meterDisabled = status === 'idle';

  const markers = useMemo(() => {
    const list: any[] = [];
    if (path[0]) list.push({ id: 'start', position: path[0], status: 'start' as const });
    if (currentPos && status !== 'idle') list.push({ id: 'cur', position: currentPos, status: 'current' as const });
    return list;
  }, [path, currentPos, status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Smart Meter</h1>
          <p className="text-sm text-muted-foreground">Track trips with live GPS and automatic fare calculation.</p>
        </div>
        {pricing && (
          <Badge variant="secondary" className="text-xs">
            {pricing.tier} • x{pricing.rate_multiplier}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="overflow-hidden lg:col-span-3 h-[60vh] min-h-[400px]">
          <LeafletMap
            center={center}
            zoom={15}
            markers={markers}
            path={path}
            followCenter={status !== 'idle'}
          />
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-4">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Rider</Label>
              <Select value={riderId} onValueChange={setRiderId} disabled={status !== 'idle' || (!isStaff && !!myRider)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select rider" />
                </SelectTrigger>
                <SelectContent>
                  {(isStaff ? riders : myRider ? [myRider] : []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl bg-foreground text-background p-5 text-center">
              <div className="text-xs uppercase tracking-wider opacity-70">Total Fare</div>
              <div className="font-display text-5xl font-bold mt-1">
                {fare ? formatNaira(fare.total) : '₦0'}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-background/10 p-2">
                  <div className="opacity-60">Time</div>
                  <div className="font-semibold text-base">{formatDuration(activeSeconds)}</div>
                </div>
                <div className="rounded-md bg-background/10 p-2">
                  <div className="opacity-60">Distance</div>
                  <div className="font-semibold text-base">{distanceKm.toFixed(2)} km</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {status === 'idle' ? (
                <Button onClick={handleStart} className="col-span-3" size="lg">
                  <Play className="h-4 w-4 mr-2" /> Start Ride
                </Button>
              ) : (
                <>
                  <Button onClick={handlePause} variant="secondary">
                    {status === 'paused' ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                    {status === 'paused' ? 'Resume' : 'Pause'}
                  </Button>
                  <Button onClick={handleEnd} variant="destructive" className="col-span-2">
                    <Square className="h-4 w-4 mr-1" /> End Ride
                  </Button>
                </>
              )}
            </div>

            {fare && (
              <div className="text-xs space-y-1.5 border-t pt-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Base fare</span><span>{formatNaira(fare.baseFare)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Distance cost</span><span>{formatNaira(fare.distanceCost)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time cost</span><span>{formatNaira(fare.timeCost)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Extras</span><span>{formatNaira(fare.extras)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Multiplier</span><span>x{pricing?.rate_multiplier}</span></div>
                {fare.appliedMinimum && <div className="text-[11px] text-primary">Minimum fare applied</div>}
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-semibold text-sm">Extras</h3>
            <div className="flex gap-2">
              <Input placeholder="Label (e.g. Luggage)" value={extraLabel} onChange={(e) => setExtraLabel(e.target.value)} disabled={meterDisabled} />
              <Input type="number" placeholder="₦" className="w-24" value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)} disabled={meterDisabled} />
              <Button size="icon" onClick={handleAddExtra} disabled={meterDisabled}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Waiting time', 'Luggage', 'Night charge'].map((q) => (
                <Button key={q} size="sm" variant="outline" disabled={meterDisabled} onClick={() => setExtraLabel(q)}>
                  {q}
                </Button>
              ))}
            </div>
            <div className="space-y-1.5">
              {extras.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm rounded-md bg-muted px-3 py-2">
                  <span>{e.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatNaira(Number(e.amount))}</span>
                    <button onClick={() => tripId && removeExtra.mutate({ id: e.id, tripId })} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {extras.length === 0 && <p className="text-xs text-muted-foreground">No extras added.</p>}
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Recent Trips</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="py-2">Date</th>
                <th>Rider</th>
                <th>Distance</th>
                <th>Duration</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((t: any) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2">{new Date(t.started_at).toLocaleString()}</td>
                  <td>{t.riders?.full_name ?? '—'}</td>
                  <td>{Number(t.distance_km).toFixed(2)} km</td>
                  <td>{formatDuration(t.active_duration_seconds || 0)}</td>
                  <td><Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>{t.status}</Badge></td>
                  <td className="text-right font-medium">{formatNaira(Number(t.total_fare || 0))}</td>
                </tr>
              ))}
              {recentTrips.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No trips yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SmartMeterPage;
