/**
 * Riders Hooks
 *
 * React Query hooks for rider operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import type { Rider } from '@/lib/mockData';

interface RidersResponse {
  success: boolean;
  data: Rider[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface RiderResponse {
  success: boolean;
  data: Rider;
}

interface OutstandingResponse {
  success: boolean;
  data: {
    riders: Rider[];
  };
}

export const useRiders = (
  page = 1,
  limit = 20,
  status = 'all',
  search = ''
) => {
  return useQuery({
    queryKey: ['riders', page, limit, status, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
        search,
      });

      const response = await apiClient.get<RidersResponse>(
        `/riders?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useRider = (id: string) => {
  return useQuery({
    queryKey: ['rider', id],
    queryFn: async () => {
      const response = await apiClient.get<RiderResponse>(`/riders/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateRider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Rider>) => {
      const response = await apiClient.post<RiderResponse>('/riders', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
    },
  });
};

export const useUpdateRider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Rider> }) => {
      const response = await apiClient.put<RiderResponse>(`/riders/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
    },
  });
};

export const useDeleteRider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/riders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
    },
  });
};

export const useUpdateRiderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiClient.patch<RiderResponse>(
        `/riders/${id}/status`,
        { status }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
    },
  });
};

export const useOutstandingRiders = () => {
  return useQuery({
    queryKey: ['riders', 'outstanding'],
    queryFn: async () => {
      const response = await apiClient.get<OutstandingResponse>(
        '/riders/outstanding'
      );
      return response.data.data.riders;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSearchRiders = (searchTerm: string, status = 'all') => {
  return useQuery({
    queryKey: ['riders', 'search', searchTerm, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: searchTerm,
        status,
        limit: '10',
      });

      const response = await apiClient.get<{ success: boolean; riders: Rider[] }>(
        `/riders/search?${params.toString()}`
      );
      return response.data.riders;
    },
    enabled: searchTerm.length >= 2,
  });
};
