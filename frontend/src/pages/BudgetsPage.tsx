import React, { useState, useEffect } from 'react';
import { budgetService } from '../services/budgets';
import { MonthlyBudgetSummary, BudgetStatus } from '../types';
import { Modal } from '../components/Modal';
import { LoadingSpinner, EmptyState } from '../components/EmptyState';
import {
  Target,
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
} from 'lucide-react';

const BUDGET_CATEGORIES = [
  'OVERALL',
  'Food',
  'Transportation',
  'Education',
  'Shopping',
  'Rent',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Travel',
  'Personal Care',
  'Other',
];

interface BudgetsPageProps {
  onBudgetChange?: () => void;
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({ onBudgetChange }) => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [summary, setSummary] = useState<MonthlyBudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<string>('OVERALL');
  const [amount, setAmount] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const res = await budgetService.getSummary(selectedMonth, selectedYear);
      setSummary(res);
    } catch (err) {
      console.error('Failed to load budget summary', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth, selectedYear]);

  const handleOpenSetBudget = (initialCategory?: string, initialAmount?: number) => {
    setCategory(initialCategory || 'OVERALL');
    setAmount(initialAmount || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError('Budget amount must be strictly greater than 0.');
      return;
    }

    try {
      await budgetService.setBudget({
        category,
        amount: amt,
        month: selectedMonth,
        year: selectedYear,
      });
      setIsModalOpen(false);
      fetchSummary();
      if (onBudgetChange) onBudgetChange();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save budget target.');
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (!window.confirm('Delete this budget target?')) return;
    try {
      await budgetService.deleteBudget(id);
      fetchSummary();
      if (onBudgetChange) onBudgetChange();
    } catch (err) {
      console.error('Delete budget failed', err);
      alert('Failed to delete budget.');
    }
  };

  const formatCurrency = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Budget Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set spending targets and receive live 80% warnings and 100% capacity alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month & Year Selectors */}
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

          <button
            onClick={() => handleOpenSetBudget()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Calculating active budget compliance..." />
      ) : summary ? (
        <div className="space-y-6">
          {/* Overall Monthly Budget Hero Card */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50">
                  <Target className="h-3.5 w-3.5 text-indigo-600" />
                  Overall Monthly Spending Cap
                </span>
                <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                  {summary.overall_budget
                    ? formatCurrency(summary.overall_budget.amount)
                    : 'No Cap Configured'}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Total spent: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(summary.total_spent)}</span> •{' '}
                  Remaining:{' '}
                  <span
                    className={`font-semibold ${
                      summary.total_remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatCurrency(summary.total_remaining)}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                {summary.overall_budget ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenSetBudget('OVERALL', summary.overall_budget?.amount)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Edit2 className="inline h-3.5 w-3.5 mr-1" />
                      Adjust Cap
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(summary.overall_budget!.id)}
                      className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-400"
                      title="Remove Overall Cap"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenSetBudget('OVERALL')}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                  >
                    Set Monthly Cap
                  </button>
                )}
              </div>
            </div>

            {/* Overall Progress Bar */}
            {summary.overall_budget && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">
                    {summary.overall_budget.percentage_used}% utilized
                  </span>
                  <span
                    className={
                      summary.overall_budget.status === 'exceeded'
                        ? 'text-rose-600 font-bold'
                        : summary.overall_budget.status === 'warning'
                        ? 'text-amber-600 font-bold'
                        : 'text-emerald-600'
                    }
                  >
                    {summary.overall_budget.status === 'exceeded'
                      ? 'EXCEEDED'
                      : summary.overall_budget.status === 'warning'
                      ? 'WARNING (>80%)'
                      : 'NORMAL'}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      summary.overall_budget.status === 'exceeded'
                        ? 'bg-rose-600'
                        : summary.overall_budget.status === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, summary.overall_budget.percentage_used)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category Budgets Grid */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Category Budgets
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Individual category allocations and live progress
                </p>
              </div>
              <button
                onClick={() => handleOpenSetBudget('Food')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                + Add Category Allocation
              </button>
            </div>

            {summary.category_budgets && summary.category_budgets.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {summary.category_budgets.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {b.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenSetBudget(b.category, b.amount)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(b.id)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {formatCurrency(b.spent)}{' '}
                          <span className="text-xs font-normal text-slate-400">/ {formatCurrency(b.amount)}</span>
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            b.status === 'exceeded'
                              ? 'text-rose-600'
                              : b.status === 'warning'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {b.percentage_used}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            b.status === 'exceeded'
                              ? 'bg-rose-600'
                              : b.status === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, b.percentage_used)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <span>Remaining:</span>
                      <span
                        className={`font-semibold ${
                          b.remaining >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-600'
                        }`}
                      >
                        {formatCurrency(b.remaining)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="No category budgets configured"
                description="Set specific limits for Food, Transportation, Shopping, and other categories to track your spending habits."
                actionLabel="Set First Category Budget"
                onAction={() => handleOpenSetBudget('Food')}
              />
            )}
          </div>
        </div>
      ) : null}

      {/* Set/Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configure Budget Allocation"
        maxWidth="sm"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            >
              {BUDGET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'OVERALL' ? 'OVERALL (Monthly Cap)' : c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Budget Target Amount ($)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              required
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
              }
              placeholder="500"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              Save Budget
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
