import React, { useState, useEffect } from 'react';
import { insightsService } from '../services/insights';
import { FinancialInsightsResponse } from '../types';
import { LoadingSpinner } from '../components/EmptyState';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface InsightsPageProps {
  onNavigateToTransactions?: () => void;
  onNavigateToBudgets?: () => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({
  onNavigateToTransactions,
  onNavigateToBudgets,
}) => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [data, setData] = useState<FinancialInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const res = await insightsService.getInsights(selectedMonth, selectedYear);
      setData(res);
    } catch (err) {
      console.error('Failed to load insights', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [selectedMonth, selectedYear]);

  const formatCurrency = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-violet-600 dark:text-violet-400" />;
      default:
        return <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const hasMomExpense = data?.mom_spending_change_pct !== null && data?.mom_spending_change_pct !== undefined;
  const isMomExpenseIncrease = hasMomExpense && (data?.mom_spending_change_pct ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Financial Insights
            </h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50">
              Explainable Rule Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Intelligent pattern discovery, Month-over-Month variance, 50/30/20 benchmark & anomaly detection
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <Calendar className="h-4 w-4 text-slate-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Auditing transactions and evaluating rule-based financial patterns..." />
      ) : data ? (
        <div className="space-y-6">
          {/* Top Metric Badges */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Top Spending Category */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Top Spending Category</span>
                <PieChart className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {data.top_spending_category || 'N/A'}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {formatCurrency(data.top_category_amount)} ({data.top_category_percentage}% of total)
              </p>
            </div>

            {/* Month-over-Month Expense Change */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider">MoM Spending Delta</span>
                {isMomExpenseIncrease ? (
                  <TrendingUp className="h-4 w-4 text-rose-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-emerald-600" />
                )}
              </div>
              <div
                className={`mt-2 text-xl font-bold ${
                  !hasMomExpense
                    ? 'text-slate-900 dark:text-white'
                    : isMomExpenseIncrease
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                }`}
              >
                {hasMomExpense
                  ? `${(data.mom_spending_change_pct ?? 0) > 0 ? '+' : ''}${data.mom_spending_change_pct}%`
                  : 'Baseline Month'}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Compared to preceding month
              </p>
            </div>

            {/* Savings Rate Tier */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Savings Health</span>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {data.savings_rating} ({data.savings_rate.toFixed(1)}%)
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                50/30/20 Financial Benchmark
              </p>
            </div>

            {/* Outlier Anomalies Detected */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Anomalies Detected</span>
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {data.outliers.length} Outlier(s)
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                &gt;2 Std Dev above category mean
              </p>
            </div>
          </div>

          {/* Explainable Insights Cards */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Data-Driven Financial Insights
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data.insights.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/80">
                      {getInsightIcon(item.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>
                        {item.metric_value && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                            {item.metric_value}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistical Outliers / Anomalies Section */}
          {data.outliers && data.outliers.length > 0 && (
            <div className="rounded-3xl border border-amber-200/70 bg-white p-6 shadow-xs dark:border-amber-900/50 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      Statistical Outlier Transactions
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Individual purchases exceeding 2 standard deviations from your category baseline
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Category Mean</th>
                      <th className="py-2.5 px-3 text-right">Deviation Factor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {data.outliers.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 text-slate-500">{o.transaction_date}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {o.description}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {o.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                          {formatCurrency(o.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          {formatCurrency(o.category_average)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-amber-600">
                          {o.deviation_factor}x normal
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actionable Recommendations */}
          <div className="rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/50 to-white p-6 shadow-xs dark:border-indigo-900/40 dark:from-slate-900 dark:to-indigo-950/20">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                AI Budget Optimization Recommendations
              </h3>
            </div>
            <div className="space-y-2.5">
              {data.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                  <p className="leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
