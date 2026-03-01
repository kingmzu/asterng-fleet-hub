/**
 * Dashboard Hooks
 *
 * React Query hooks for dashboard statistics and analytics
 */

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

interface DashboardStats {
  totalBikes: number;
  activeBikes: number;
  activeRiders: number;
  suspendedRiders: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  overduePayments: number;
  collectionRate: number;
}

interface RevenueTrend {
  month: string;
  revenue: number;
  expenses: number;
}

interface ComplianceData {
  fullCompliant: number;
  needsAttention: number;
  nonCompliant: number;
  averageScore: number;
  byRider: Array<{
    id: string;
    name: string;
    status: string;
    kycStatus: string;
    policeClearance: boolean;
    complianceScore: number;
  }>;
}

interface CollectionRateData {
  totalCollected: number;
  totalOverdue: number;
  collectionRate: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: DashboardStats;
      }>('/dashboard/stats');
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useRevenueTrends = (months = 6) => {
  return useQuery({
    queryKey: ['dashboard', 'revenue-trends', months],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: RevenueTrend[];
      }>(`/dashboard/revenue-trends?months=${months}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useComplianceOverview = () => {
  return useQuery({
    queryKey: ['dashboard', 'compliance'],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: ComplianceData;
      }>('/dashboard/compliance');
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useCollectionRate = () => {
  return useQuery({
    queryKey: ['dashboard', 'collection-rate'],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: CollectionRateData;
      }>('/dashboard/collection-rate');
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};
