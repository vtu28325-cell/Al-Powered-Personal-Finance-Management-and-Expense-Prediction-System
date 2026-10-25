import { api } from './api';
import { FinancialInsightsResponse } from '../types';

export const insightsService = {
  async getInsights(month?: number, year?: number): Promise<FinancialInsightsResponse> {
    const res = await api.get<FinancialInsightsResponse>('/insights', {
      params: { month, year },
    });
    return res.data;
  },
};
