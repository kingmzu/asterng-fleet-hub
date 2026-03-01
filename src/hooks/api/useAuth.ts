/**
 * Authentication Hooks
 *
 * React Query hooks for authentication operations
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  };
}

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const useLogin = () => {
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await apiClient.post<AuthResponse>('/auth/login', payload);
      return response.data;
    },
    onSuccess: (data) => {
      // Store token in localStorage
      if (data.data?.token) {
        localStorage.setItem('authToken', data.data.token);
      }
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    },
    onSuccess: () => {
      // Clear token from localStorage
      localStorage.removeItem('authToken');
      // Redirect to login
      window.location.href = '/login';
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: CurrentUser }>(
        '/auth/me'
      );
      return response.data.data;
    },
    enabled: !!localStorage.getItem('authToken'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};
