/**
 * Dashboard Hooks - Supabase implementation
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const [bikesRes, ridersRes, remittancesRes, expensesRes] = await Promise.all([
        supabase.from('motorcycles').select('id, status', { count: 'exact' }),
        supabase.from('riders').select('id, status', { count: 'exact' }),
        supabase.from('remittances').select('amount, status'),
        supabase.from('expenses').select('amount'),
      ]);

      if (bikesRes.error) throw bikesRes.error;
      if (ridersRes.error) throw ridersRes.error;
      if (remittancesRes.error) throw remittancesRes.error;
      if (expensesRes.error) throw expensesRes.error;

      const totalBikes = bikesRes.count || 0;
      const activeRiders = (ridersRes.data || []).filter((r) => r.status === 'active').length;
      const monthlyRevenue = (remittancesRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
      const monthlyExpenses = (expensesRes.data || []).reduce((s, e) => s + Number(e.amount), 0);
      const overduePayments = (remittancesRes.data || []).filter((r) => r.status === 'overdue').length;

      return {
        totalBikes,
        activeRiders,
        monthlyRevenue,
        monthlyExpenses,
        netProfit: monthlyRevenue - monthlyExpenses,
        overduePayments,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useRevenueTrends = (_months = 6) => {
  return useQuery({
    queryKey: ['dashboard', 'revenue-trends'],
    queryFn: async () => {
      // Return empty for now - will populate with real monthly data later
      return [] as Array<{ month: string; revenue: number; expenses: number }>;
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
