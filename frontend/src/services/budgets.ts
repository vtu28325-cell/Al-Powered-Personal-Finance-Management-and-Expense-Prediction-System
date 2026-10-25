import { api } from './api';
import { MonthlyBudgetSummary, BudgetStatus, BudgetAlertItem } from '../types';

export const budgetService = {
  async getSummary(month?: number, year?: number): Promise<MonthlyBudgetSummary> {
    const res = await api.get<MonthlyBudgetSummary>('/budgets/summary', {
      params: { month, year },
    });
    return res.data;
  },

  async setBudget(data: { category: string; amount: number; month: number; year: number }): Promise<BudgetStatus> {
    const res = await api.post<BudgetStatus>('/budgets', data);
    return res.data;
  },

  async deleteBudget(id: number): Promise<void> {
    await api.delete(`/budgets/${id}`);
  },

  async getAlerts(): Promise<BudgetAlertItem[]> {
    const res = await api.get<BudgetAlertItem[]>('/budgets/alerts');
    return res.data;
  },
};
