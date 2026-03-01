import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/StatusBadge';
import { useComplianceOverview, useRiders } from '@/hooks/api';

const CompliancePage = () => {
  const [page, setPage] = useState(1);

  // Fetch compliance overview stats
  const { data: overview, isLoading: overviewLoading } = useComplianceOverview();

  // Fetch all active riders for compliance details
  const { data: ridersData, isLoading: ridersLoading } = useRiders(page, 50, 'all', '');

  const riders = ridersData?.data || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Compliance & Safety</h1>
        <p className="text-sm text-muted-foreground">
          Monitor rider compliance, safety records, and fleet integrity
        </p>
      </div>

      {/* Compliance overview */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Fully Compliant
            </span>
          </div>
          {overviewLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p className="font-display text-2xl font-bold text-success">
              {overview?.fullyCompliant || 0}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Needs Attention
            </span>
          </div>
          {overviewLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p className="font-display text-2xl font-bold text-warning">
              {overview?.needsAttention || 0}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-destructive" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Non-Compliant
            </span>
          </div>
          {overviewLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p className="font-display text-2xl font-bold text-destructive">
              {overview?.nonCompliant || 0}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avg Score
            </span>
          </div>
          {overviewLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p className="font-display text-2xl font-bold text-primary">
              {overview?.averageScore || 0}%
            </p>
          )}
        </div>
      </div>

      {/* Rider compliance list */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-display text-sm font-semibold text-foreground">Rider Compliance Scores</h3>
        </div>
        <div className="divide-y divide-border">
          {ridersLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))
            : riders.length > 0
            ? riders.map((rider) => (
                <div key={rider.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                    {rider.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{rider.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={rider.status} />
                      <span
                        className={`text-[11px] rounded-full border px-2 py-0.5 ${
                          rider.kycStatus === 'verified'
                            ? 'border-success/30 bg-success/10 text-success'
                            : 'border-warning/30 bg-warning/10 text-warning'
                        }`}
                      >
                        KYC: {rider.kycStatus}
                      </span>
                      <span
                        className={`text-[11px] rounded-full border px-2 py-0.5 ${
                          rider.policeClearance
                            ? 'border-success/30 bg-success/10 text-success'
                            : 'border-destructive/30 bg-destructive/10 text-destructive'
                        }`}
                      >
                        Police: {rider.policeClearance ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            rider.complianceScore >= 80
                              ? 'bg-success'
                              : rider.complianceScore >= 50
                              ? 'bg-warning'
                              : 'bg-destructive'
                          }`}
                          style={{ width: `${rider.complianceScore}%` }}
                        />
                      </div>
                      <span
                        className={`font-display text-sm font-bold ${
                          rider.complianceScore >= 80
                            ? 'text-success'
                            : rider.complianceScore >= 50
                            ? 'text-warning'
                            : 'text-destructive'
                        }`}
                      >
                        {rider.complianceScore}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            : (
              <div className="px-5 py-8 text-center text-muted-foreground">
                No riders found
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CompliancePage;
