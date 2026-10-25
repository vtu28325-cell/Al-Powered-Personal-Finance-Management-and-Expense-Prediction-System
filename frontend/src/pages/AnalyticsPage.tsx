import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analytics';
import { transactionService } from '../services/transactions';
import { MonthlyCashFlowItem } from '../types';
import { LoadingSpinner } from '../components/EmptyState';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Filter,
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

export const AnalyticsPage: React.FC = () => {
  const [cashFlow, setCashFlow] = useState<MonthlyCashFlowItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await analyticsService.getCashFlow();
        setCashFlow(data);
      } catch (err) {
        console.error('Failed to load cash flow analytics', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportAll = async () => {
    try {
      setIsExporting(true);
      const blob = await transactionService.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export report.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Summary totals
  const totalIncomeAll = cashFlow.reduce((acc, curr) => acc + curr.income, 0);
  const totalExpenseAll = cashFlow.reduce((acc, curr) => acc + curr.expense, 0);
  const totalNetAll = totalIncomeAll - totalExpenseAll;
  const avgSavingsRate = cashFlow.length > 0 ? (totalNetAll / totalIncomeAll) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-month financial summaries, cumulative net savings, and CSV export
          </p>
        </div>

        <button
          onClick={handleExportAll}
          disabled={isExporting}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs shadow-indigo-600/30 hover:bg-indigo-700 transition"
        >
          <Download className="h-4 w-4" />
          <span>{isExporting ? 'Generating CSV...' : 'Download Complete CSV Report'}</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Compiling multi-period financial reports..." />
      ) : (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Multi-Period Income
              </span>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalIncomeAll)}
              </div>
              <p className="mt-1 text-xs text-slate-400">Recorded inflow total</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Multi-Period Expenses
              </span>
              <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(totalExpenseAll)}
              </div>
              <p className="mt-1 text-xs text-slate-400">Recorded outflow total</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Cumulative Net Savings
              </span>
              <div
                className={`mt-2 text-2xl font-bold ${
                  totalNetAll >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                }`}
              >
                {formatCurrency(totalNetAll)}
              </div>
              <p className="mt-1 text-xs text-slate-400">Total surplus retention</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Average Savings Rate
              </span>
              <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {avgSavingsRate.toFixed(1)}%
              </div>
              <p className="mt-1 text-xs text-slate-400">Across recorded periods</p>
            </div>
          </div>

          {/* Cash Flow Timeline Chart */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cash Flow & Net Savings Progression
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly income against expenditures alongside net savings trajectory
              </p>
            </div>

            <div className="h-72 w-full">
              {cashFlow.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cashFlow} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
                    <XAxis dataKey="month_name" tick={{ fontSize: 11, fill: '#6b7280' }} />
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
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="net_savings" name="Net Savings" stroke="#6366f1" strokeWidth={2.5} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No data to chart
                </div>
              )}
            </div>
          </div>

          {/* Monthly Summaries Table */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Detailed Monthly Financial Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited monthly figures and savings rate performance
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Month Period</th>
                    <th className="py-3 px-4 font-semibold text-right">Income</th>
                    <th className="py-3 px-4 font-semibold text-right">Expense</th>
                    <th className="py-3 px-4 font-semibold text-right">Net Savings</th>
                    <th className="py-3 px-4 font-semibold text-right">Savings Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {cashFlow.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {row.month_name}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600">
                        {formatCurrency(row.income)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-rose-600">
                        {formatCurrency(row.expense)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${
                          row.net_savings >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'
                        }`}
                      >
                        {formatCurrency(row.net_savings)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            row.savings_rate >= 20
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : row.savings_rate > 0
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {row.savings_rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
