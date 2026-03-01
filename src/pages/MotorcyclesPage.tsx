import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { mockMotorcycles, mockRiders, formatNaira } from '@/lib/mockData';

const MotorcyclesPage = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = mockMotorcycles.filter((m) => {
    const matchSearch = m.registrationNumber.toLowerCase().includes(search.toLowerCase()) || m.make.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getRiderName = (riderId?: string) => {
    if (!riderId) return 'Unassigned';
    return mockRiders.find(r => r.id === riderId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Motorcycle Fleet</h1>
          <p className="text-sm text-muted-foreground">{mockMotorcycles.length} registered motorcycles</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Register Bike
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by registration or make..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'maintenance', 'suspended'].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((bike) => (
          <div key={bike.id} className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-foreground">{bike.registrationNumber}</h3>
                <p className="text-sm text-muted-foreground">{bike.make} {bike.model} • {bike.year}</p>
              </div>
              <StatusBadge status={bike.status} />
            </div>

            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned Rider</span>
                <span className={`font-medium ${bike.assignedRiderId ? 'text-foreground' : 'text-muted-foreground'}`}>{getRiderName(bike.assignedRiderId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insurance Expiry</span>
                <span className={`font-medium ${new Date(bike.insuranceExpiry) < new Date() ? 'text-destructive' : 'text-foreground'}`}>{bike.insuranceExpiry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Maintenance</span>
                <span className="font-medium text-foreground">{bike.lastMaintenance}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-success/10 px-3 py-2 text-center">
                <p className="text-[10px] font-medium uppercase tracking-wider text-success">Revenue</p>
                <p className="font-display text-sm font-bold text-success">{formatNaira(bike.totalRevenue)}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-center">
                <p className="text-[10px] font-medium uppercase tracking-wider text-destructive">Maintenance</p>
                <p className="font-display text-sm font-bold text-destructive">{formatNaira(bike.maintenanceCost)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MotorcyclesPage;
