import React, { useState, useEffect } from 'react';
import { predictionService } from '../services/predictions';
import { authService } from '../services/auth';
import { PredictionResponse, PredictionHistoryItem } from '../types';
import { LoadingSpinner, EmptyState } from '../components/EmptyState';
import {
  BrainCircuit,
  TrendingUp,
  AlertCircle,
  Database,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Info,
  BarChart,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface PredictionsPageProps {
  onRefreshData?: () => void;
}

export const PredictionsPage: React.FC<PredictionsPageProps> = ({ onRefreshData }) => {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetraining, setIsRetraining] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchPrediction = async () => {
    try {
      setIsLoading(true);
      const [predRes, histRes] = await Promise.all([
        predictionService.getPrediction(),
        predictionService.getHistory(5),
      ]);
      setPrediction(predRes);
      setHistory(histRes);
    } catch (err) {
      console.error('Failed to load predictions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, []);

  const handleRetrain = async () => {
    try {
      setIsRetraining(true);
      await fetchPrediction();
    } finally {
      setIsRetraining(false);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      setIsSeeding(true);
      await authService.seedDemoData();
      await fetchPrediction();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to seed demo data', err);
      alert('Failed to load sample dataset.');
    } finally {
      setIsSeeding(false);
    }
  };

  const formatCurrency = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (isLoading && !prediction) {
    return <LoadingSpinner message="Training Scikit-learn regression models on transaction history..." />;
  }

  // Chart data combining historical actuals with model fitted line and next month target
  const chartData = prediction
    ? [
        ...prediction.history_points.map((p) => ({
          period: p.period,
          Actual: p.actual,
          ModelFitted: p.predicted,
        })),
        {
          period: `${prediction.target_period} (Forecast)`,
          Actual: null,
          Forecast: prediction.predicted_total_expense,
          Baseline: prediction.baseline_predicted_amount,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Expense Prediction
            </h1>
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/50">
              Scikit-Learn Regression
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Time series forecasting with lag-features, cyclical seasonality, and out-of-sample evaluation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRetrain}
            disabled={isRetraining}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
            <span>Retrain Model</span>
          </button>
        </div>
      </div>

      {/* Preliminary Data Notice & Seed Button */}
      {prediction?.is_preliminary && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider dark:text-amber-200">
                  Preliminary Model Status ({prediction.training_months_count} Months Recorded)
                </h3>
                <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  {prediction.data_quality_notice ||
                    'Machine learning time-series regression requires at least 3-6 continuous months to fit robust lag parameters and compute out-of-sample MAE/RMSE test metrics without temporal leakage.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleSeedDemoData}
              disabled={isSeeding}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition shrink-0"
            >
              <Database className={`h-4 w-4 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Loading Data...' : 'Load 12-Month Demo Dataset'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Prediction Highlight Card */}
      {prediction && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Forecast Card */}
          <div className="rounded-3xl border border-violet-200/70 bg-gradient-to-br from-white to-violet-50/40 p-6 shadow-xs dark:border-violet-900/40 dark:from-slate-900 dark:to-violet-950/20 lg:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">
                Target Forecast Period: {prediction.target_period}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800 dark:bg-violet-900/60 dark:text-violet-200">
                <Sparkles className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                {prediction.model_name}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <div className="text-4xl font-extrabold text-slate-950 dark:text-white">
                  {formatCurrency(prediction.predicted_total_expense)}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Estimated 90% Confidence Band:{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatCurrency(prediction.lower_bound)} - {formatCurrency(prediction.upper_bound)}
                  </span>
                </div>
              </div>

              {/* Baseline Comparison Pill */}
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Baseline Benchmark:
                </span>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(prediction.baseline_predicted_amount)}
                </div>
                <span className="text-[10px] text-slate-400">
                  {prediction.baseline_model_name}
                </span>
              </div>
            </div>

            {/* Explanation box */}
            <div className="mt-6 rounded-2xl bg-white p-4 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                Model Reasoning & Explanation
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {prediction.explanation}
              </p>
              {prediction.feature_importance_note && (
                <p className="mt-2 text-[11px] text-violet-700 dark:text-violet-300 font-medium">
                  {prediction.feature_importance_note}
                </p>
              )}
            </div>
          </div>

          {/* Model Card & Evaluation Metrics */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Model Evaluation Metrics
              </h3>

              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">
                    Mean Absolute Error (MAE)
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {prediction.mae !== undefined && prediction.mae !== null
                      ? `$${prediction.mae.toFixed(2)}`
                      : 'N/A (Evaluating)'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Average magnitude of residual errors
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">
                    Root Mean Squared Error (RMSE)
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {prediction.rmse !== undefined && prediction.rmse !== null
                      ? `$${prediction.rmse.toFixed(2)}`
                      : 'N/A (Evaluating)'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Penalizes larger outlier variances
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">
                    Training Observations
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {prediction.training_months_count} Months
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Chronological time series sequence
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              Evaluated using chronological train/test split to prevent lookahead bias.
            </div>
          </div>
        </div>
      )}

      {/* Historical vs Forecast Comparison Chart */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Historical Actual Spending vs. AI Model Forecast
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Actual expenses plotted with in-sample model regression fit and projected next-month target
          </p>
        </div>

        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Actual" fill="#f43f5e" name="Actual Spending" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="ModelFitted" stroke="#6366f1" strokeWidth={2} dot={false} name="Model Fit" />
                <Bar dataKey="Forecast" fill="#8b5cf6" name="AI Next-Month Forecast" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Baseline" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" name="Baseline Moving Avg" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No historical trend points available
            </div>
          )}
        </div>
      </div>

      {/* Category-Level Predictions Table */}
      {prediction?.category_predictions && prediction.category_predictions.length > 0 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Category-Wise Expense Breakdown Forecast
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Expected spending per category calibrated to total regression target
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-right">Predicted Amount</th>
                  <th className="py-3 px-4 font-semibold text-right">Share of Total</th>
                  <th className="py-3 px-4 font-semibold text-right">Historical Monthly Avg</th>
                  <th className="py-3 px-4 font-semibold text-center">Trend Trajectory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {prediction.category_predictions.map((cat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {cat.category}
                    </td>
                    <td className="py-3 px-4 font-semibold text-right text-slate-900 dark:text-white">
                      {formatCurrency(cat.predicted_amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {cat.percentage_of_total}%
                        </span>
                        <div className="h-1.5 w-12 rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-indigo-600"
                            style={{ width: `${Math.min(100, cat.percentage_of_total)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">
                      {formatCurrency(cat.historical_avg)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          cat.trend_direction === 'increasing'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : cat.trend_direction === 'decreasing'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {cat.trend_direction}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
