/**
 * Expenses Hooks
 *
 * React Query hooks for expense operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import type { Expense } from '@/lib/mockData';

interface ExpensesResponse {
  success: boolean;
  data: Expense[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface ExpenseResponse {
  success: boolean;
  data: Expense;
}

interface ExpenseStats {
  totalExpenses: number;
  byCategory: {
    [key: string]: {
      total: number;
      count: number;
      average: number;
    };
  };
}

export const useExpenses = (
  page = 1,
  limit = 20,
  category = 'all',
  from?: string,
  to?: string
) => {
  return useQuery({
    queryKey: ['expenses', page, limit, category, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        category,
      });

      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await apiClient.get<ExpensesResponse>(
        `/expenses?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
  });
};

export const useExpense = (id: string) => {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: async () => {
      const response = await apiClient.get<ExpenseResponse>(`/expenses/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Expense>) => {
      const response = await apiClient.post<ExpenseResponse>('/expenses', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Expense> }) => {
      const response = await apiClient.put<ExpenseResponse>(`/expenses/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useExpensesByCategory = (
  category: string,
  from?: string,
  to?: string
) => {
  return useQuery({
    queryKey: ['expenses', 'category', category, from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await apiClient.get<{
        success: boolean;
        data: {
          category: string;
          total: number;
          count: number;
          expenses: Expense[];
        };
      }>(`/expenses/category/${category}?${params.toString()}`);
      return response.data.data;
    },
    enabled: !!category && category !== 'all',
  });
};

export const useExpenseStats = (from?: string, to?: string) => {
  return useQuery({
    queryKey: ['expenses', 'stats', from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await apiClient.get<{
        success: boolean;
        data: ExpenseStats;
      }>(`/expenses/stats?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useExpenseBreakdown = (from?: string, to?: string) => {
  return useQuery({
    queryKey: ['expenses', 'breakdown', from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await apiClient.get<{
        success: boolean;
        data: {
          breakdown: Array<{
            category: string;
            total: number;
            percentage: number;
          }>;
        };
      }>(`/expenses/breakdown?${params.toString()}`);
      return response.data.data.breakdown;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useExportExpenses = () => {
  return useMutation({
    mutationFn: async (params?: { format?: string; from?: string; to?: string }) => {
      const queryParams = new URLSearchParams({
        format: params?.format || 'csv',
      });
      if (params?.from) queryParams.append('from', params.from);
      if (params?.to) queryParams.append('to', params.to);

      const response = await apiClient.get(
        `/expenses/export?${queryParams.toString()}`,
        { responseType: 'blob' }
      );
      return response.data;
    },
  });
};
