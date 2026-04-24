/**
 * Dashboard Hooks - Supabase implementation
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthStartIso = monthStart.toISOString().split('T')[0];

      const [bikesRes, ridersRes, monthRemRes, monthExpRes, allRemRes] = await Promise.all([
        supabase.from('motorcycles').select('id, status', { count: 'exact', head: true }),
        supabase.from('riders').select('id, status, outstanding_balance'),
        supabase.from('remittances').select('amount').gte('remittance_date', monthStartIso),
        supabase.from('expenses').select('amount').gte('expense_date', monthStartIso),
        supabase.from('remittances').select('status'),
      ]);

      if (bikesRes.error) throw bikesRes.error;
      if (ridersRes.error) throw ridersRes.error;
      if (monthRemRes.error) throw monthRemRes.error;
      if (monthExpRes.error) throw monthExpRes.error;
      if (allRemRes.error) throw allRemRes.error;

      const totalBikes = bikesRes.count || 0;
      const riders = ridersRes.data || [];
      const activeRiders = riders.filter((r) => r.status === 'active').length;
      const totalDueAmount = riders.reduce((s, r) => s + Number(r.outstanding_balance || 0), 0);

      const monthlyRevenue = (monthRemRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
      const monthlyExpenses = (monthExpRes.data || []).reduce((s, e) => s + Number(e.amount), 0);
      const overduePayments = (allRemRes.data || []).filter((r) => r.status === 'overdue').length;

      return {
        totalBikes,
        activeRiders,
        monthlyRevenue,
        monthlyExpenses,
        netProfit: monthlyRevenue - monthlyExpenses,
        overduePayments,
        totalDueAmount,
      };
    },
    staleTime: 60 * 1000,
  });
};

export const useRevenueTrends = (months = 6) => {
  return useQuery({
    queryKey: ['dashboard', 'revenue-trends', months],
    queryFn: async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      start.setMonth(start.getMonth() - (months - 1));
      const startIso = start.toISOString().split('T')[0];

      const [remRes, expRes] = await Promise.all([
        supabase.from('remittances').select('amount, remittance_date').gte('remittance_date', startIso),
        supabase.from('expenses').select('amount, expense_date').gte('expense_date', startIso),
      ]);

      if (remRes.error) throw remRes.error;
      if (expRes.error) throw expRes.error;

      const labels: { key: string; month: string }[] = [];
      for (let i = 0; i < months; i++) {
        const d = new Date(start);
        d.setMonth(start.getMonth() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const month = d.toLocaleString('en-US', { month: 'short' });
        labels.push({ key, month });
      }

      const buckets: Record<string, { revenue: number; expenses: number }> = {};
      labels.forEach((l) => (buckets[l.key] = { revenue: 0, expenses: 0 }));

      (remRes.data || []).forEach((r: any) => {
        const k = r.remittance_date?.slice(0, 7);
        if (buckets[k]) buckets[k].revenue += Number(r.amount);
      });
      (expRes.data || []).forEach((e: any) => {
        const k = e.expense_date?.slice(0, 7);
        if (buckets[k]) buckets[k].expenses += Number(e.amount);
      });

      return labels.map((l) => ({
        month: l.month,
        revenue: buckets[l.key].revenue,
        expenses: buckets[l.key].expenses,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useComplianceOverview = () => {
  return useQuery({
    queryKey: ['dashboard', 'compliance'],
    queryFn: async () => {
      const { data, error } = await supabase.from('riders').select('compliance_score, kyc_status, is_with_police');
      if (error) throw error;

      const riders = data || [];
      const fullyCompliant = riders.filter((r) => r.compliance_score >= 80).length;
      const needsAttention = riders.filter((r) => r.compliance_score >= 50 && r.compliance_score < 80).length;
      const nonCompliant = riders.filter((r) => r.compliance_score < 50).length;
      const averageScore = riders.length > 0
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
        supabase.from('riders').select('id, full_name, license_expiry_date').not('license_expiry_date', 'is', null).lte('license_expiry_date', cutoff),
        supabase.from('motorcycles').select('id, plate_number, insurance_expiry_date, registration_expiry_date').lte('insurance_expiry_date', cutoff),
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
