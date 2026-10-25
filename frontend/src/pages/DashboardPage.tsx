import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/analytics';
import { DashboardSummary } from '../types';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner, EmptyState } from '../components/EmptyState';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Target,
  BrainCircuit,
  AlertTriangle,
  AlertCircle,
  Calendar,
  ArrowRight,
  Receipt,
  PlusCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

interface DashboardPageProps {
  onNavigateToTransactions: () => void;
  onNavigateToBudgets: () => void;
  onNavigateToPredictions: () => void;
  refreshTrigger?: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToTransactions,
  onNavigateToBudgets,
  onNavigateToPredictions,
  refreshTrigger,
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<string>('This Month');

  const fetchDashboard = async (selectedPeriod: string) => {
    try {
      setIsLoading(true);
      const today = new Date();
      let dateFrom: string | undefined;
      let dateTo: string | undefined;

      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      if (selectedPeriod === 'This Month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        dateFrom = formatDate(start);
        dateTo = formatDate(end);
      } else if (selectedPeriod === 'Last 30 Days') {
        const start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFrom = formatDate(start);
        dateTo = formatDate(today);
      } else if (selectedPeriod === 'Last 3 Months') {
        const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        dateFrom = formatDate(start);
        dateTo = formatDate(end);
      } else if (selectedPeriod === 'This Year') {
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear(), 11, 31);
        dateFrom = formatDate(start);
        dateTo = formatDate(end);
      }

      const res = await analyticsService.getDashboard({
        date_from: dateFrom,
        date_to: dateTo,
        period: selectedPeriod,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(period);
  }, [period, refreshTrigger]);

  if (isLoading && !data) {
    return <LoadingSpinner message="Calculating dashboard financial metrics and AI forecasts..." />;
  }

  if (!data) {
    return (
      <EmptyState
        icon={Receipt}
        title="No Financial Data Found"
        description="Add your first transaction or click 'Load Demo Data' in the header to view live charts and ML predictions."
        actionLabel="Go to Transactions"
        onAction={onNavigateToTransactions}
      />
    );
  }

  const formatCurrency = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Top Banner & Period Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financial Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time balance, category spending, budget compliance & Scikit-learn forecast
          </p>
        </div>

        {/* Period Dropdown */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
          >
            <option value="This Month">This Month</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 3 Months">Last 3 Months</option>
            <option value="This Year">This Year</option>
            <option value="All Time">All Time</option>
          </select>
        </div>
      </div>

      {/* Active Budget Alerts */}
      {data.budget_alerts && data.budget_alerts.length > 0 && (
        <div className="space-y-2">
          {data.budget_alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-start justify-between rounded-2xl border p-4 transition ${
                alert.severity === 'danger'
                  ? 'border-rose-200 bg-rose-50/70 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200'
                  : 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {alert.severity === 'danger' ? (
                  <AlertCircle className="mt-0.5 h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {alert.severity === 'danger' ? 'Budget Exceeded Alert' : 'Budget Warning (80%+ Used)'}
                  </div>
                  <p className="mt-0.5 text-xs opacity-90">{alert.message}</p>
                </div>
              </div>
              <button
                onClick={onNavigateToBudgets}
                className="text-xs font-semibold underline underline-offset-2 hover:opacity-80 shrink-0"
              >
                View Budget
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Income"
          value={formatCurrency(data.total_income)}
          subtitle={period}
          icon={TrendingUp}
          variant="income"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(data.total_expenses)}
          subtitle={period}
          icon={TrendingDown}
          variant="expense"
        />
        <StatCard
          title="Net Balance"
          value={formatCurrency(data.net_balance)}
          subtitle="Cash flow delta"
          icon={Wallet}
          variant={data.net_balance >= 0 ? 'default' : 'expense'}
        />
        <StatCard
          title="Savings Rate"
          value={`${data.savings_rate.toFixed(1)}%`}
          subtitle="Of total income"
          icon={PiggyBank}
          variant="default"
          trend={{
            value: data.savings_rate >= 20 ? 'Optimal (>=20%)' : 'Needs attention',
            isPositive: data.savings_rate >= 20,
          }}
        />
        <StatCard
          title="Monthly Budget"
          value={data.monthly_budget > 0 ? formatCurrency(data.budget_remaining) : 'Not Set'}
          subtitle={data.monthly_budget > 0 ? `${data.budget_percentage_used}% used` : 'Set in Budgets'}
          icon={Target}
          variant={data.budget_percentage_used >= 100 ? 'expense' : data.budget_percentage_used >= 80 ? 'warning' : 'default'}
        />
        <StatCard
          title="AI Forecast"
          value={data.predicted_next_month_expense ? formatCurrency(data.predicted_next_month_expense) : 'Train Model'}
          subtitle="Next month expense"
          icon={BrainCircuit}
          variant="prediction"
        />
      </div>

      {/* Visual Analytics Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Income vs Expenses Bar Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Income vs. Expenses Trend
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Monthly cash inflow against outflows over time
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            {data.monthly_cash_flow && data.monthly_cash_flow.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly_cash_flow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No monthly data available
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Expense by Category
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Proportional distribution for {period}
            </p>
          </div>
          <div className="h-64 w-full">
            {data.category_breakdown && data.category_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.category_breakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {data.category_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No expense transactions in this period
              </div>
            )}
          </div>
          {/* Top 3 categories legend */}
          <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
            {data.category_breakdown.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                    ({item.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cash Flow Line/Area Chart & Recent Transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Net Savings Area Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Net Savings Trajectory
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Net surplus or deficit after all categorized expenditures
              </p>
            </div>
            <button
              onClick={onNavigateToPredictions}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              <span>Explore AI Model</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="h-60 w-full">
            {data.monthly_cash_flow && data.monthly_cash_flow.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthly_cash_flow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
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
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Net Savings']}
                  />
                  <Area type="monotone" dataKey="net_savings" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#savingsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No cash flow records yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Transactions
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Latest activity entries
                </p>
              </div>
              <button
                onClick={onNavigateToTransactions}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {data.recent_transactions && data.recent_transactions.length > 0 ? (
                data.recent_transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50/70 p-2.5 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {tx.description}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{tx.category}</span>
                        <span>•</span>
                        <span>{tx.transaction_date}</span>
                      </div>
                    </div>
                    <div
                      className={`text-xs font-bold ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No recent transactions recorded
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onNavigateToTransactions}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:text-indigo-400 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Manage Transactions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
