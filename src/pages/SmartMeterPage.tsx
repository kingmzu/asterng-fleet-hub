import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Play, Pause, Square, Download, Printer, FileSpreadsheet, ChevronLeft, ChevronRight, Loader2, Moon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LeafletMap from '@/components/maps/LeafletMap';
import { useRiders } from '@/hooks/api/useRiders';
import { useCurrentUser } from '@/hooks/api/useAuth';
import { useRoles } from '@/hooks/api/useRoles';
import {
  useActivePricing,
  useUpdateTrip,
  useAddTripPoint,
  useTripsPaginated,
  useActiveTrip,
} from '@/hooks/api/useSmartMeter';
import { usePushRiderLocation } from '@/hooks/api/useRiderLocations';
import {
  calcFare,
  formatDuration,
  formatNaira,
  generateReceiptPdf,
  generateTripsPdf,
  haversineKm,
  isNightHour,
  lagosHour,
  nightMinutesInRange,
  NIGHT_RATE_PER_MINUTE,
  LUGGAGE_FLAT,
} from '@/lib/smartMeter';
import { supabase } from '@/integrations/supabase/client';
import { exportXlsx } from '@/lib/exporters';

const DEFAULT_CENTER: [number, number] = [9.0765, 7.3986]; // Abuja
const PERSIST_KEY = 'asterng:smartmeter:active';
const PAGE_SIZE = 20;

type Status = 'idle' | 'active' | 'paused';

interface PersistedTrip {
  tripId: string;
  riderId: string;
  startedAt: string;
  distanceKm: number;
  activeSeconds: number;
  path: [number, number][];
  luggage: boolean;
  waitingAmount: number;
  status: Status;
}

const SmartMeterPage = () => {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { isStaff } = useRoles();

  const { data: pricing } = useActivePricing();
  const { data: ridersResp } = useRiders(1, 200, 'all', '');
  const riders = ridersResp?.data || [];

  const updateTrip = useUpdateTrip();
  const addPoint = useAddTripPoint();
  const pushLocation = usePushRiderLocation();

  // Identify the rider account (if any) tied to the logged-in user.
  const myRider = useMemo(() => riders.find((r) => r.user_id === user?.id), [riders, user]);

  // Riders are LOCKED to their own rider account. Staff may select any rider.
  const [riderId, setRiderId] = useState<string>('');
  useEffect(() => {
    if (!isStaff && myRider && !riderId) setRiderId(myRider.id);
  }, [isStaff, myRider, riderId]);

  const selectedRider = riders.find((r) => r.id === riderId);

  // Active-trip detection from backend (so refresh restores).
  const { data: activeTripFromDb } = useActiveTrip(riderId || undefined);

  // ---------- Local meter state ----------
  const [status, setStatus] = useState<Status>('idle');
  const [tripId, setTripId] = useState<string | null>(null);
  const [path, setPath] = useState<[number, number][]>([]);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [luggage, setLuggage] = useState(false);
  const [waitingAmount, setWaitingAmount] = useState<number>(0);

  const watchIdRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const startedAtRef = useRef<string | null>(null);
  const motorcycleIdRef = useRef<string | null>(null);
  const restoredRef = useRef(false);

  // ---------- Trip persistence (local + db) ----------
  const persist = (override?: Partial<PersistedTrip>) => {
    if (!tripId || !riderId || !startedAtRef.current) return;
    const snap: PersistedTrip = {
      tripId,
      riderId,
      startedAt: startedAtRef.current,
      distanceKm,
      activeSeconds,
      path,
      luggage,
      waitingAmount,
      status,
      ...override,
    };
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(snap));
    } catch { /* quota */ }
  };

  // Restore on first mount (after activeTripFromDb resolves)
  useEffect(() => {
    if (restoredRef.current) return;
    if (!activeTripFromDb) return;
    restoredRef.current = true;

    const raw = localStorage.getItem(PERSIST_KEY);
    let local: PersistedTrip | null = null;
    try { local = raw ? JSON.parse(raw) : null; } catch { local = null; }

    setTripId(activeTripFromDb.id);
    startedAtRef.current = activeTripFromDb.started_at;
    motorcycleIdRef.current = activeTripFromDb.motorcycle_id ?? null;

    const startSeconds = Math.floor((Date.now() - new Date(activeTripFromDb.started_at).getTime()) / 1000);
    setActiveSeconds(local?.tripId === activeTripFromDb.id ? local.activeSeconds : Math.max(startSeconds, activeTripFromDb.active_duration_seconds || 0));
    setDistanceKm(local?.tripId === activeTripFromDb.id ? local.distanceKm : Number(activeTripFromDb.distance_km || 0));
    setPath(local?.tripId === activeTripFromDb.id ? local.path : (activeTripFromDb.start_lat && activeTripFromDb.start_lng ? [[Number(activeTripFromDb.start_lat), Number(activeTripFromDb.start_lng)]] : []));
    setLuggage(local?.tripId === activeTripFromDb.id ? local.luggage : false);
    setWaitingAmount(local?.tripId === activeTripFromDb.id ? local.waitingAmount : 0);

    const restoredStatus: Status = activeTripFromDb.status === 'paused' ? 'paused' : 'active';
    setStatus(restoredStatus);
    if (restoredStatus === 'active') {
      startGps('on_trip');
      startTimer();
    }
    toast({ title: 'Active trip restored', description: 'Resumed from where you left off.' });
  }, [activeTripFromDb]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { persist(); }, [distanceKm, activeSeconds, path, luggage, waitingAmount, status]); // eslint-disable-line

  // ---------- Fare calc (live) ----------
  const nightSurcharge = useMemo(() => {
    if (!startedAtRef.current) return 0;
    const start = new Date(startedAtRef.current);
    const end = new Date(start.getTime() + activeSeconds * 1000);
    const minutes = nightMinutesInRange(start, end);
    return minutes * NIGHT_RATE_PER_MINUTE;
  }, [activeSeconds]);

  const extrasTotal = (luggage ? LUGGAGE_FLAT : 0) + (waitingAmount > 0 ? waitingAmount : 0);

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
      nightSurcharge,
    });
  }, [pricing, distanceKm, activeSeconds, extrasTotal, nightSurcharge]);

  // ---------- GPS broadcasting ----------
  const broadcast = (
    pos: [number, number],
    accuracy: number | null,
    heading: number | null,
    speed: number | null,
    nextStatus: 'online' | 'on_trip',
  ) => {
    if (!riderId) return;
    pushLocation.mutate({
      rider_id: riderId,
      lat: pos[0], lng: pos[1],
      accuracy, heading, speed,
      status: nextStatus,
      current_trip_id: tripId,
    });
  };

  const startGps = (statusForPush: 'online' | 'on_trip') => {
    if (!navigator.geolocation) {
      toast({ title: 'GPS unavailable', description: 'Browser geolocation not supported.', variant: 'destructive' });
      return;
    }
    if (watchIdRef.current !== null) return;
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

  // ---------- Start / Pause / End ----------
  const handleStart = async () => {
    if (!riderId) { toast({ title: 'Select a rider', variant: 'destructive' }); return; }
    if (!pricing) { toast({ title: 'No active pricing', description: 'Ask an admin to set pricing.', variant: 'destructive' }); return; }

    // Prevent multiple active trips
    const { data: existing } = await supabase
      .from('trips').select('id, status').eq('rider_id', riderId).in('status', ['active', 'paused']).limit(1).maybeSingle();
    if (existing) {
      toast({
        title: 'Trip already in progress',
        description: 'Please end the current trip before starting another.',
        variant: 'destructive',
      });
      return;
    }

    const rider = riders.find((r) => r.id === riderId);
    motorcycleIdRef.current = rider?.assigned_bike_id ?? null;

    const startPos: [number, number] | null = await new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve([p.coords.latitude, p.coords.longitude]),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

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
      .select().single();
    if (error) { toast({ title: 'Could not start', description: error.message, variant: 'destructive' }); return; }

    setTripId(data.id);
    setPath(startPos ? [startPos] : []);
    setDistanceKm(0);
    setActiveSeconds(0);
    setLuggage(false);
    setWaitingAmount(0);
    setStatus('active');
    if (startPos) {
      setCenter(startPos);
      setCurrentPos(startPos);
      pushLocation.mutate({
        rider_id: riderId,
        lat: startPos[0], lng: startPos[1],
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
      stopGps(); stopTimer(); setStatus('paused');
      if (tripId) await updateTrip.mutateAsync({ id: tripId, data: { status: 'paused', active_duration_seconds: activeSeconds, distance_km: distanceKm } });
    } else if (status === 'paused') {
      startGps('on_trip'); startTimer(); setStatus('active');
      if (tripId) await updateTrip.mutateAsync({ id: tripId, data: { status: 'active' } });
    }
  };

  const handleEnd = async () => {
    if (!tripId || !fare || !pricing) return;
    stopGps(); stopTimer();
    const endedAt = new Date().toISOString();
    const endPos = currentPos;

    const extrasArr: { label: string; amount: number }[] = [];
    if (luggage) extrasArr.push({ label: 'Luggage', amount: LUGGAGE_FLAT });
    if (waitingAmount > 0) extrasArr.push({ label: 'Waiting time', amount: waitingAmount });

    // Persist extras as rows so they're auditable
    if (extrasArr.length) {
      await supabase.from('trip_extras').insert(extrasArr.map((e) => ({ trip_id: tripId, label: e.label, amount: e.amount })));
    }

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
        extras_total: fare.extras + fare.nightSurcharge,
        total_fare: fare.total,
      },
    });

    if (riderId && endPos) {
      pushLocation.mutate({
        rider_id: riderId,
        lat: endPos[0], lng: endPos[1],
        accuracy: null, heading: null, speed: null,
        status: 'online',
        current_trip_id: null,
      });
    }

    // Auto-download receipt
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
      extras: extrasArr,
      nightSurcharge: fare.nightSurcharge,
      rateMultiplier: Number(pricing.rate_multiplier),
      total: fare.total,
    });

    toast({ title: 'Ride completed', description: `Total: ${formatNaira(fare.total)}` });

    // Reset
    localStorage.removeItem(PERSIST_KEY);
    setStatus('idle'); setTripId(null); setPath([]); setDistanceKm(0); setActiveSeconds(0);
    setLuggage(false); setWaitingAmount(0);
    startedAtRef.current = null;
  };

  const isNight = isNightHour(lagosHour(new Date()));

  const markers = useMemo(() => {
    const list: any[] = [];
    if (path[0]) list.push({ id: 'start', position: path[0], status: 'start' as const });
    if (currentPos && status !== 'idle') list.push({ id: 'cur', position: currentPos, status: 'current' as const });
    return list;
  }, [path, currentPos, status]);

  // ---------- Recent Trips (paginated, role-filtered) ----------
  const [page, setPage] = useState(1);
  const tripsRiderFilter = isStaff ? undefined : myRider?.id;
  const { data: tripsResp, isLoading: tripsLoading } = useTripsPaginated(page, PAGE_SIZE, tripsRiderFilter);
  const tripRows = tripsResp?.rows || [];
  const totalPages = tripsResp?.pages || 1;

  // Admin: choose a specific rider to export
  const [exportRiderId, setExportRiderId] = useState<string>('all');

  const downloadHistory = async (format: 'pdf' | 'xlsx', scope: 'mine' | 'rider' | 'all') => {
    let q = supabase
      .from('trips')
      .select('started_at, distance_km, active_duration_seconds, status, total_fare, riders:rider_id(full_name)')
      .order('started_at', { ascending: false });

    if (scope === 'mine' && myRider) q = q.eq('rider_id', myRider.id);
    else if (scope === 'rider' && exportRiderId !== 'all') q = q.eq('rider_id', exportRiderId);

    const { data, error } = await q;
    if (error) {
      toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
      return;
    }
    if (!data || data.length === 0) {
      toast({ title: 'Nothing to export', description: 'No trips found.', variant: 'destructive' });
      return;
    }
    const rows = data.map((t: any) => ({
      date: new Date(t.started_at).toLocaleString('en-NG'),
      rider: t.riders?.full_name || '—',
      distanceKm: Number(t.distance_km || 0),
      durationSeconds: t.active_duration_seconds || 0,
      status: t.status,
      total: Number(t.total_fare || 0),
    }));

    const subtitle = scope === 'mine'
      ? `Rider: ${myRider?.full_name || ''}`
      : scope === 'rider'
        ? `Rider: ${riders.find((r) => r.id === exportRiderId)?.full_name || 'Selected'}`
        : 'All Riders';

    if (format === 'pdf') {
      generateTripsPdf(rows, { title: 'ASTERNG Trip History', subtitle });
    } else {
      exportXlsx(
        rows,
        [
          { header: 'Date', accessor: (r: any) => r.date },
          { header: 'Rider', accessor: (r: any) => r.rider },
          { header: 'Distance (km)', accessor: (r: any) => Number(r.distanceKm.toFixed(2)) },
          { header: 'Duration', accessor: (r: any) => formatDuration(r.durationSeconds) },
          { header: 'Status', accessor: (r: any) => r.status },
          { header: 'Total (NGN)', accessor: (r: any) => Math.round(r.total) },
        ],
        'asterng-trips'
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Smart Meter</h1>
          <p className="text-sm text-muted-foreground">Track trips with live GPS and automatic fare calculation.</p>
        </div>
        <div className="flex items-center gap-2">
          {pricing && (
            <Badge variant="secondary" className="text-xs">
              {pricing.tier} · x{pricing.rate_multiplier}
            </Badge>
          )}
          {isNight && (
            <Badge className="text-xs gap-1 bg-indigo-500 hover:bg-indigo-500">
              <Moon className="h-3 w-3" /> Night rate
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Map column */}
        <Card className="overflow-hidden lg:col-span-3 h-56 sm:h-72 lg:h-[460px]">
          <LeafletMap
            center={center}
            zoom={15}
            markers={markers}
            path={path}
            followCenter={status !== 'idle'}
          />
        </Card>

        {/* Meter column */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-4">
            {/* Rider selection — staff only; riders are locked */}
            {isStaff ? (
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Rider</Label>
                <Select value={riderId} onValueChange={setRiderId} disabled={status !== 'idle'}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select rider" /></SelectTrigger>
                  <SelectContent>
                    {riders.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : myRider ? (
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Rider</Label>
                <div className="mt-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium">
                  {myRider.full_name}
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                Your rider profile hasn't been linked yet. Ask an admin to complete your onboarding.
              </div>
            )}

            {/* Fare display */}
            <div className="rounded-xl bg-foreground text-background p-5 text-center">
              <div className="text-xs uppercase tracking-wider opacity-70">Total Fare</div>
              <div className="font-display text-5xl font-bold mt-1 tabular-nums">
                {fare ? formatNaira(fare.total) : 'NGN 0'}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-background/10 p-2">
                  <div className="opacity-60">Time</div>
                  <div className="font-semibold text-base tabular-nums">{formatDuration(activeSeconds)}</div>
                </div>
                <div className="rounded-md bg-background/10 p-2">
                  <div className="opacity-60">Distance</div>
                  <div className="font-semibold text-base tabular-nums">{distanceKm.toFixed(2)} km</div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-3 gap-2">
              {status === 'idle' ? (
                <Button onClick={handleStart} className="col-span-3" size="lg" disabled={!riderId}>
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

            {/* Charges (luggage / waiting) */}
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Add Luggage</Label>
                  <p className="text-[11px] text-muted-foreground">Adds NGN {LUGGAGE_FLAT} flat</p>
                </div>
                <Switch checked={luggage} onCheckedChange={setLuggage} disabled={status === 'idle'} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="waiting" className="text-sm">Waiting Time Charge (NGN)</Label>
                <Input
                  id="waiting"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={waitingAmount || ''}
                  onChange={(e) => setWaitingAmount(Math.max(0, Number(e.target.value) || 0))}
                  disabled={status === 'idle'}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Breakdown */}
            {fare && (
              <div className="text-xs space-y-1.5 border-t pt-3 tabular-nums">
                <div className="flex justify-between"><span className="text-muted-foreground">Base fare</span><span>{formatNaira(fare.baseFare)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Distance cost</span><span>{formatNaira(fare.distanceCost)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time cost</span><span>{formatNaira(fare.timeCost)}</span></div>
                {fare.nightSurcharge > 0 && (
                  <div className="flex justify-between text-indigo-500"><span>Night surcharge</span><span>{formatNaira(fare.nightSurcharge)}</span></div>
                )}
                {luggage && (<div className="flex justify-between"><span className="text-muted-foreground">Luggage</span><span>{formatNaira(LUGGAGE_FLAT)}</span></div>)}
                {waitingAmount > 0 && (<div className="flex justify-between"><span className="text-muted-foreground">Waiting time</span><span>{formatNaira(waitingAmount)}</span></div>)}
                <div className="flex justify-between"><span className="text-muted-foreground">Multiplier</span><span>x{pricing?.rate_multiplier}</span></div>
                {fare.appliedMinimum && <div className="text-[11px] text-primary">Minimum fare applied</div>}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Trips */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="font-semibold">{isStaff ? 'Recent Trips' : 'My Recent Trips'}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {isStaff && (
              <Select value={exportRiderId} onValueChange={setExportRiderId}>
                <SelectTrigger className="h-9 w-48 text-xs"><SelectValue placeholder="Filter rider for export" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All riders</SelectItem>
                  {riders.map((r) => <SelectItem key={r.id} value={r.id}>{r.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => downloadHistory('pdf', isStaff ? (exportRiderId === 'all' ? 'all' : 'rider') : 'mine')}>
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => downloadHistory('xlsx', isStaff ? (exportRiderId === 'all' ? 'all' : 'rider') : 'mine')}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="py-2">Date</th>
                {isStaff && <th>Rider</th>}
                <th>Distance</th>
                <th>Duration</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {tripsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2"><Skeleton className="h-4 w-32" /></td>
                    {isStaff && <td><Skeleton className="h-4 w-24" /></td>}
                    <td><Skeleton className="h-4 w-16" /></td>
                    <td><Skeleton className="h-4 w-16" /></td>
                    <td><Skeleton className="h-4 w-16" /></td>
                    <td className="text-right"><Skeleton className="ml-auto h-4 w-20" /></td>
                  </tr>
                ))
              ) : tripRows.length === 0 ? (
                <tr><td colSpan={isStaff ? 6 : 5} className="py-8 text-center text-muted-foreground">No trips yet.</td></tr>
              ) : tripRows.map((t: any) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 tabular-nums">{new Date(t.started_at).toLocaleString('en-NG')}</td>
                  {isStaff && <td>{t.riders?.full_name ?? '—'}</td>}
                  <td className="tabular-nums">{Number(t.distance_km).toFixed(2)} km</td>
                  <td className="tabular-nums">{formatDuration(t.active_duration_seconds || 0)}</td>
                  <td><Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>{t.status}</Badge></td>
                  <td className="text-right font-medium tabular-nums">{formatNaira(Number(t.total_fare || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 pt-3 border-t mt-3">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {tripsResp?.total ?? 0} trips
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1 || tripsLoading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(totalPages - 4, page - 2));
                return start + i;
              }).filter((p) => p <= totalPages).map((p) => (
                <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)} className="h-8 w-8 p-0">
                  {p}
                </Button>
              ))}
              <Button size="sm" variant="outline" disabled={page >= totalPages || tripsLoading} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SmartMeterPage;
