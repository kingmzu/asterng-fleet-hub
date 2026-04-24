/**
 * Dashboard Hooks - Supabase implementation
 * - Stats with current-month revenue/expenses + outstanding totals + overdue counts.
 * - Revenue trends aggregated client-side over the last 12 months.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const monthStart = startOfMonth(new Date()).toISOString().split('T')[0];

      const [bikesRes, ridersRes, remitMonthRes, expMonthRes, remitOverdueRes] = await Promise.all([
        supabase.from('motorcycles').select('id, status', { count: 'exact', head: true }),
        supabase.from('riders').select('id, status, outstanding_balance'),
        supabase.from('remittances').select('amount').gte('remittance_date', monthStart),
        supabase.from('expenses').select('amount').gte('expense_date', monthStart),
        supabase.from('remittances').select('id', { count: 'exact', head: true }).eq('status', 'overdue'),
      ]);

      if (bikesRes.error) throw bikesRes.error;
      if (ridersRes.error) throw ridersRes.error;
      if (remitMonthRes.error) throw remitMonthRes.error;
      if (expMonthRes.error) throw expMonthRes.error;
      if (remitOverdueRes.error) throw remitOverdueRes.error;

      const ridersList = ridersRes.data || [];
      const totalBikes = bikesRes.count || 0;
      const activeRiders = ridersList.filter((r) => r.status === 'active').length;
      const monthlyRevenue = (remitMonthRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
      const monthlyExpenses = (expMonthRes.data || []).reduce((s, e) => s + Number(e.amount), 0);
      const dueAmount = ridersList.reduce(
        (s, r) => s + Number(r.outstanding_balance || 0),
        0
      );
      const overdueCount = remitOverdueRes.count || 0;

      return {
        totalBikes,
        activeRiders,
        monthlyRevenue,
        monthlyExpenses,
        netProfit: monthlyRevenue - monthlyExpenses,
        dueAmount,
        overdueCount,
      };
    },
    staleTime: 60 * 1000,
  });
};

/** Real revenue vs expenses, grouped by month, for the last `months` months. */
export const useRevenueTrends = (months = 12) => {
  return useQuery({
    queryKey: ['dashboard', 'revenue-trends', months],
    queryFn: async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
      const startISO = start.toISOString().split('T')[0];

      const [remitRes, expRes] = await Promise.all([
        supabase.from('remittances').select('amount, remittance_date').gte('remittance_date', startISO),
        supabase.from('expenses').select('amount, expense_date').gte('expense_date', startISO),
      ]);
      if (remitRes.error) throw remitRes.error;
      if (expRes.error) throw expRes.error;

      const buckets: Record<string, { month: string; revenue: number; expenses: number }> = {};
      const monthLabels: string[] = [];
      for (let i = 0; i < months; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        buckets[key] = { month: label, revenue: 0, expenses: 0 };
        monthLabels.push(key);
      }

      (remitRes.data || []).forEach((r) => {
        const key = (r.remittance_date as string).slice(0, 7);
        if (buckets[key]) buckets[key].revenue += Number(r.amount);
      });
      (expRes.data || []).forEach((e) => {
        const key = (e.expense_date as string).slice(0, 7);
        if (buckets[key]) buckets[key].expenses += Number(e.amount);
      });

      return monthLabels.map((k) => buckets[k]);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useComplianceOverview = () => {
  return useQuery({
    queryKey: ['dashboard', 'compliance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('compliance_score, kyc_status, is_with_police');
      if (error) throw error;

      const riders = data || [];
      const fullyCompliant = riders.filter((r) => r.compliance_score >= 80).length;
      const needsAttention = riders.filter(
        (r) => r.compliance_score >= 50 && r.compliance_score < 80
      ).length;
      const nonCompliant = riders.filter((r) => r.compliance_score < 50).length;
      const averageScore =
        riders.length > 0
          ? Math.round(riders.reduce((s, r) => s + r.compliance_score, 0) / riders.length)
          : 0;

      return { fullyCompliant, needsAttention, nonCompliant, averageScore };
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useExpiryAlerts = () => {
  return useQuery({
    queryKey: ['dashboard', 'expiry-alerts'],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const cutoff = thirtyDaysFromNow.toISOString().split('T')[0];

      const [ridersRes, bikesRes] = await Promise.all([
        supabase
          .from('riders')
          .select('id, full_name, license_expiry_date')
          .not('license_expiry_date', 'is', null)
          .lte('license_expiry_date', cutoff),
        supabase
          .from('motorcycles')
          .select('id, plate_number, insurance_expiry_date, registration_expiry_date')
          .lte('insurance_expiry_date', cutoff),
      ]);

      if (ridersRes.error) throw ridersRes.error;
      if (bikesRes.error) throw bikesRes.error;

      const today = new Date().toISOString().split('T')[0];

      const licenseAlerts = (ridersRes.data || []).map((r) => ({
        id: r.id,
        type: 'license' as const,
        label: r.full_name,
        date: r.license_expiry_date!,
        expired: r.license_expiry_date! <= today,
      }));

      const insuranceAlerts = (bikesRes.data || []).map((b) => ({
        id: b.id,
        type: 'insurance' as const,
        label: b.plate_number,
        date: b.insurance_expiry_date,
        expired: b.insurance_expiry_date <= today,
      }));

      const registrationAlerts = (bikesRes.data || [])
        .filter((b) => b.registration_expiry_date && b.registration_expiry_date <= cutoff)
        .map((b) => ({
          id: b.id,
          type: 'registration' as const,
          label: b.plate_number,
          date: b.registration_expiry_date!,
          expired: b.registration_expiry_date! <= today,
        }));

      return [...licenseAlerts, ...insuranceAlerts, ...registrationAlerts].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    },
    staleTime: 5 * 60 * 1000,
  });
};
