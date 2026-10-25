import { api } from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async register(data: { email: string; full_name: string; password: string; currency?: string }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login/json', { email, password });
    return res.data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  async updateUser(data: { full_name?: string; currency?: string; password?: string }): Promise<User> {
    const res = await api.put<User>('/auth/me', data);
    return res.data;
  },

  async seedDemoData(): Promise<{ message: string; transactions_count: number }> {
    const res = await api.post<{ message: string; transactions_count: number }>('/auth/seed-demo');
    return res.data;
  },
};
