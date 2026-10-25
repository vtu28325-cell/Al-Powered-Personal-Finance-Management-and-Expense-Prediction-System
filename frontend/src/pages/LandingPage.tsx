import React from 'react';
import {
  Wallet,
  BrainCircuit,
  TrendingUp,
  Target,
  Sparkles,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onDemoLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
  onDemoLogin,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-md shadow-indigo-500/20">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">SpendPulse AI</span>
              <span className="ml-2 hidden rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 sm:inline-block border border-indigo-200/50">
                Minor Project
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onDemoLogin}
              className="hidden rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 sm:block transition"
            >
              Demo Preview
            </button>
            <button
              onClick={onLogin}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700 transition"
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 lg:pt-24 lg:pb-28">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3.5 py-1 text-xs font-medium text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 mb-6">
            <BrainCircuit className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>B.Tech CSE (AI & ML) Minor Project Demonstration</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            AI-Powered Personal Finance &{' '}
            <span className="text-indigo-600 dark:text-indigo-400">Expense Prediction</span> System
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            A comprehensive financial management platform featuring real machine-learning time series
            forecasting using Scikit-Learn, intelligent budget alerts, explainable AI insights, and cash-flow analytics.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onDemoLogin}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <Database className="h-4 w-4 text-indigo-600" />
              <span>Explore Demo Account</span>
            </button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure JWT Auth & Isolation
            </span>
            <span className="flex items-center gap-1.5">
              <BrainCircuit className="h-4 w-4 text-indigo-600" /> Scikit-Learn Ridge Regression
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-violet-600" /> Recharts Interactive Visuals
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-amber-600" /> SQLite / PostgreSQL ORM
            </span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="border-t border-slate-200/80 bg-white py-16 dark:border-slate-800 dark:bg-slate-900 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
              Engineered for Minor Project Evaluation
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              End-to-end architecture adhering to real software engineering and ML design principles.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                Scikit-Learn ML Forecasting
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                L2 Ridge regression with chronological lag features (lag-1, lag-2), rolling 3-month momentum,
                and cyclical sine/cosine seasonality. Includes MAE, RMSE metrics and baseline comparison.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                Dynamic Budget Tracking
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Set monthly limits overall and per-category. Live calculations trigger warnings at 80% usage
                and alert banners at 100% exceeded capacity.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                Explainable AI Insights
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Rule-based explainable reasoning that flags spending surges, calculates 50/30/20 savings
                rates, and detects outlier transactions using 2-sigma deviation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                Interactive Recharts Analytics
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Responsive visual components for category donut charts, income vs expense bar comparisons,
                multi-month cash flow lines, and prediction vs actual comparisons.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                User Isolation & Security
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Bcrypt password hashing and JWT token authentication. Multi-tenant database design ensures
                strict isolation so users can only view their own financial records.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                CSV Export & Seed Engine
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                One-click data export to CSV format, plus an intelligent 12-month synthetic transaction
                generator allowing professors and evaluators to test all features instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-100 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <p>© 2026 SpendPulse AI. Built for B.Tech CSE (AI & ML) Minor Project.</p>
        <p className="mt-1">FastAPI • Scikit-Learn • React • TypeScript • Tailwind CSS • Recharts</p>
      </footer>
    </div>
  );
};
