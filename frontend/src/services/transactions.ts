import { api } from './api';
import { PaginatedTransactions, Transaction, TransactionFormData } from '../types';

export const transactionService = {
  async getTransactions(params?: {
    tx_type?: string;
    category?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedTransactions> {
    const res = await api.get<PaginatedTransactions>('/transactions', { params });
    return res.data;
  },

  async createTransaction(data: TransactionFormData): Promise<Transaction> {
    const res = await api.post<Transaction>('/transactions', data);
    return res.data;
  },

  async updateTransaction(id: number, data: Partial<TransactionFormData>): Promise<Transaction> {
    const res = await api.put<Transaction>(`/transactions/${id}`, data);
    return res.data;
  },

  async deleteTransaction(id: number): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  async exportCsv(dateFrom?: string, dateTo?: string): Promise<Blob> {
    const res = await api.get('/transactions/export/csv', {
      params: { date_from: dateFrom, date_to: dateTo },
      responseType: 'blob',
    });
    return res.data;
  },
};
