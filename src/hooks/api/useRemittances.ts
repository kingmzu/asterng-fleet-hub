/**
 * Remittances Hooks
 *
 * React Query hooks for payment/remittance operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import type { Remittance } from '@/lib/mockData';

interface RemittancesResponse {
  success: boolean;
  data: Remittance[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface RemittanceResponse {
  success: boolean;
  data: Remittance;
}

interface RemittanceStats {
  totalCollected: number;
  totalOverdue: number;
  paymentsToday: number;
  collectionRate: number;
  byStatus: {
    paid: number;
    partial: number;
    overdue: number;
  };
}

export const useRemittances = (
  page = 1,
  limit = 20,
  status = 'all',
  search = '',
  from?: string,
  to?: string
) => {
  return useQuery({
    queryKey: ['remittances', page, limit, status, search, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
        search,
      });

      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await apiClient.get<RemittancesResponse>(
        `/remittances?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
  });
};

export const useRemittance = (id: string) => {
  return useQuery({
    queryKey: ['remittance', id],
    queryFn: async () => {
      const response = await apiClient.get<RemittanceResponse>(
        `/remittances/${id}`
      );
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateRemittance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Remittance>) => {
      const response = await apiClient.post<RemittanceResponse>(
        '/remittances',
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remittances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateRemittanceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiClient.patch<RemittanceResponse>(
        `/remittances/${id}/status`,
        { status }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remittances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['riders'] });
    },
  });
};

export const useRemittancesByRider = (
  riderId: string,
  from?: string,
  to?: string
) => {
  return useQuery({
    queryKey: ['remittances', 'rider', riderId, from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await apiClient.get<{
        success: boolean;
        data: {
          remittances: Remittance[];
          summary: {
            totalAmount: number;
            paidAmount: number;
            pendingAmount: number;
          };
        };
      }>(`/remittances/rider/${riderId}?${params.toString()}`);
      return response.data.data;
    },
    enabled: !!riderId,
  });
};

export const useRemittanceStats = (from?: string, to?: string) => {
  return useQuery({
    queryKey: ['remittances', 'stats', from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await apiClient.get<{
        success: boolean;
        data: RemittanceStats;
      }>(`/remittances/stats?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useOverdueRemittances = () => {
  return useQuery({
    queryKey: ['remittances', 'overdue'],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          overdue: Array<{
            id: string;
            riderId: string;
            riderName: string;
            amount: number;
            daysOverdue: number;
          }>;
        };
      }>('/remittances/overdue');
      return response.data.data.overdue;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useExportRemittances = () => {
  return useMutation({
    mutationFn: async (params?: { format?: string; from?: string; to?: string }) => {
      const queryParams = new URLSearchParams({
        format: params?.format || 'csv',
      });
      if (params?.from) queryParams.append('from', params.from);
      if (params?.to) queryParams.append('to', params.to);

      const response = await apiClient.get(
        `/remittances/export?${queryParams.toString()}`,
        { responseType: 'blob' }
      );
      return response.data;
    },
  });
};
