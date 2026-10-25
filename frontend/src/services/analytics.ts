import { api } from './api';
import { DashboardSummary, MonthlyCashFlowItem } from '../types';

export const analyticsService = {
  async getDashboard(params?: {
    date_from?: string;
    date_to?: string;
    period?: string;
  }): Promise<DashboardSummary> {
    const res = await api.get<DashboardSummary>('/analytics/dashboard', { params });
    return res.data;
  },

  async getCashFlow(): Promise<MonthlyCashFlowItem[]> {
    const res = await api.get<MonthlyCashFlowItem[]>('/analytics/cash-flow');
    return res.data;
  },
};
