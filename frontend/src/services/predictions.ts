import { api } from './api';
import { PredictionResponse, PredictionHistoryItem } from '../types';

export const predictionService = {
  async getPrediction(targetMonth?: number, targetYear?: number): Promise<PredictionResponse> {
    const res = await api.get<PredictionResponse>('/predictions', {
      params: { target_month: targetMonth, target_year: targetYear },
    });
    return res.data;
  },

  async getHistory(limit: number = 10): Promise<PredictionHistoryItem[]> {
    const res = await api.get<PredictionHistoryItem[]>('/predictions/history', {
      params: { limit },
    });
    return res.data;
  },
};
