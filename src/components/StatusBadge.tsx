import { Badge } from '@/components/ui/badge';

type StatusType = 'active' | 'suspended' | 'pending' | 'maintenance' | 'paid' | 'partial' | 'overdue' | 'verified' | 'rejected';

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-success/15 text-success border-success/30 hover:bg-success/20' },
  suspended: { label: 'Suspended', className: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20' },
  pending: { label: 'Pending', className: 'bg-warning/15 text-warning border-warning/30 hover:bg-warning/20' },
  maintenance: { label: 'Maintenance', className: 'bg-info/15 text-info border-info/30 hover:bg-info/20' },
  paid: { label: 'Paid', className: 'bg-success/15 text-success border-success/30 hover:bg-success/20' },
  partial: { label: 'Partial', className: 'bg-warning/15 text-warning border-warning/30 hover:bg-warning/20' },
  overdue: { label: 'Overdue', className: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20' },
  verified: { label: 'Verified', className: 'bg-success/15 text-success border-success/30 hover:bg-success/20' },
  rejected: { label: 'Rejected', className: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20' },
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status as StatusType] || statusConfig.pending;
  return (
    <Badge variant="outline" className={`text-[11px] font-semibold ${config.className}`}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
