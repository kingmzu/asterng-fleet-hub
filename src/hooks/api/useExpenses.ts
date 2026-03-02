/**
 * Expenses Hooks - Supabase implementation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export const useExpenses = (
  page = 1,
  limit = 20,
  category = 'all',
  _search = ''
) => {
  return useQuery({
    queryKey: ['expenses', page, limit, category],
    queryFn: async () => {
      let query = supabase.from('expenses').select('*', { count: 'exact' });

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1).order('date', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    },
    staleTime: 60 * 1000,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TablesInsert<'expenses'>) => {
      const { data: result, error } = await supabase.from('expenses').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useExpenseBreakdown = () => {
  return useQuery({
    queryKey: ['expenses', 'breakdown'],
    queryFn: async () => {
      const { data, error } = await supabase.from('expenses').select('category, amount');
      if (error) throw error;

      const byCategory: Record<string, number> = {};
      let total = 0;
      (data || []).forEach((e) => {
        const amt = Number(e.amount);
        byCategory[e.category] = (byCategory[e.category] || 0) + amt;
        total += amt;
      });

      const breakdown = Object.entries(byCategory).map(([category, catTotal]) => ({
        category,
        total: catTotal,
        percentage: total > 0 ? Math.round((catTotal / total) * 100) : 0,
      }));

      return { breakdown };
    },
    staleTime: 2 * 60 * 1000,
  });
};
