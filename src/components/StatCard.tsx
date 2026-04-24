import { LucideIcon } from 'lucide-react';
import { formatNaira } from '@/lib/mockData';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  isCurrency?: boolean;
  variant?: 'default' | 'primary' | 'accent' | 'destructive';
  subtitle?: string;
}

const StatCard = ({ title, value, icon: Icon, trend, isCurrency, variant = 'default', subtitle }: StatCardProps) => {
  const variantStyles = {
    default: 'bg-card border border-border',
    primary: 'bg-primary text-primary-foreground',
    accent: 'bg-accent text-accent-foreground',
    destructive: 'bg-destructive/10 border border-destructive/20',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    accent: 'bg-accent-foreground/10 text-accent-foreground',
    destructive: 'bg-destructive/10 text-destructive',
  };

  const trendColor = trend?.positive ? 'text-success' : 'text-destructive';

  return (
    <div className={`rounded-xl p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)] ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={`text-xs font-medium uppercase tracking-wider ${variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {title}
          </p>
          <p className="font-display text-2xl font-bold">
            {isCurrency ? formatNaira(value as number) : value}
          </p>
          {trend && (
            <p className={`text-xs font-medium ${variant === 'primary' ? (trend.positive ? 'text-primary-foreground/80' : 'text-primary-foreground/60') : trendColor}`}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% vs last month
            </p>
          )}
          {subtitle && (
            <p className={`text-xs font-medium ${variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${iconStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
