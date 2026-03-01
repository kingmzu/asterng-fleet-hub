/**
 * Motorcycles Hooks
 *
 * React Query hooks for motorcycle operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import type { Motorcycle } from '@/lib/mockData';

interface MotorcyclesResponse {
  success: boolean;
  data: Motorcycle[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface MotorcycleResponse {
  success: boolean;
  data: Motorcycle;
}

export const useMotorcycles = (
  page = 1,
  limit = 20,
  status = 'all',
  search = ''
) => {
  return useQuery({
    queryKey: ['motorcycles', page, limit, status, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
        search,
      });

      const response = await apiClient.get<MotorcyclesResponse>(
        `/motorcycles?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
  });
};

export const useMotorcycle = (id: string) => {
  return useQuery({
    queryKey: ['motorcycle', id],
    queryFn: async () => {
      const response = await apiClient.get<MotorcycleResponse>(
        `/motorcycles/${id}`
      );
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateMotorcycle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Motorcycle>) => {
      const response = await apiClient.post<MotorcycleResponse>(
        '/motorcycles',
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycles'] });
    },
  });
};

export const useUpdateMotorcycle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Motorcycle> }) => {
      const response = await apiClient.put<MotorcycleResponse>(
        `/motorcycles/${id}`,
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycles'] });
    },
  });
};

export const useDeleteMotorcycle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/motorcycles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycles'] });
    },
  });
};

export const useAssignRider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bikeId, riderId }: { bikeId: string; riderId: string }) => {
      const response = await apiClient.patch<MotorcycleResponse>(
        `/motorcycles/${bikeId}/assign`,
        { riderId }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycles'] });
    },
  });
};

export const useUpdateMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bikeId, date }: { bikeId: string; date: string }) => {
      const response = await apiClient.patch<MotorcycleResponse>(
        `/motorcycles/${bikeId}/maintenance`,
        { lastMaintenance: date }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycles'] });
    },
  });
};

export const useMaintenanceAlerts = () => {
  return useQuery({
    queryKey: ['motorcycles', 'alerts', 'maintenance'],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          motorcycles: Array<{
            id: string;
            registrationNumber: string;
            lastMaintenance: string;
            daysSinceMaintenance: number;
          }>;
        };
      }>('/motorcycles/maintenance/alerts');
      return response.data.data.motorcycles;
    },
    staleTime: 1 * 60 * 1000,
  });
};

export const useInsuranceAlerts = () => {
  return useQuery({
    queryKey: ['motorcycles', 'alerts', 'insurance'],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          motorcycles: Array<{
            id: string;
            registrationNumber: string;
            insuranceExpiry: string;
            daysUntilExpiry: number;
          }>;
        };
      }>('/motorcycles/insurance/alerts');
      return response.data.data.motorcycles;
    },
    staleTime: 1 * 60 * 1000,
  });
};
