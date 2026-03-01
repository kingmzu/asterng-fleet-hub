import {
  Bike,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { mockDashboardStats, mockRemittances, mockRiders, monthlyRevenueData, formatNaira } from '@/lib/mockData';

const Dashboard = () => {
  const recentPayments = mockRemittances.slice(0, 5);
  const overdueRiders = mockRiders.filter(r => r.outstandingBalance > 0);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Welcome back, Admin</h1>
        <p className="text-sm text-muted-foreground">Here's your fleet overview for today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Bikes" value={mockDashboardStats.totalBikes} icon={Bike} />
        <StatCard title="Active Riders" value={mockDashboardStats.activeRiders} icon={Users} trend={{ value: 12, positive: true }} />
        <StatCard title="Monthly Revenue" value={mockDashboardStats.monthlyRevenue} icon={TrendingUp} isCurrency trend={{ value: 8, positive: true }} variant="primary" />
        <StatCard title="Monthly Expenses" value={mockDashboardStats.monthlyExpenses} icon={TrendingDown} isCurrency />
        <StatCard title="Net Profit" value={mockDashboardStats.netProfit} icon={Wallet} isCurrency trend={{ value: 15, positive: true }} />
        <StatCard title="Overdue" value={mockDashboardStats.overduePayments} icon={AlertTriangle} variant="destructive" />
      </div>

      {/* Charts & Tables */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-3">
          <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Revenue vs Expenses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₦${(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => formatNaira(value)}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="expenses" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent payments */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Recent Remittances</h3>
          <div className="space-y-3">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{p.riderName}</p>
                  <p className="text-xs text-muted-foreground">{p.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{formatNaira(p.amount)}</span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Outstanding balances */}
      {overdueRiders.length > 0 && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Outstanding Balances</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overdueRiders.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.phone}</p>
                </div>
                <span className="font-display text-sm font-bold text-destructive">{formatNaira(r.outstandingBalance)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
