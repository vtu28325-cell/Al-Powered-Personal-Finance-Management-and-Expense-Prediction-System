import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/auth';
import {
  Wallet,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Database,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onRefreshData }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleSeedDemo = async () => {
    if (!window.confirm('Populate 12 months of realistic transactions and budget allocations for demo? This will reset existing sample data.')) {
      return;
    }
    try {
      setIsSeeding(true);
      await authService.seedDemoData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to seed demo data', err);
      alert('Failed to seed demo data. Please check backend connection.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-md shadow-indigo-500/20">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
              <span>SpendPulse</span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                AI
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              AI Finance & Expense Forecast
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Seed Demo Data Button */}
        <button
          onClick={handleSeedDemo}
          disabled={isSeeding}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 focus:outline-none dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
          title="Load 12 months of realistic test transactions for demo evaluation"
        >
          <Database className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isSeeding ? 'Seeding Data...' : seedSuccess ? 'Data Loaded!' : 'Load Demo Data'}
          </span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none dark:text-slate-300 dark:hover:bg-slate-800 transition"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Profile Pill */}
        {user && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3 dark:border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                {user.full_name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {user.currency || 'USD'}
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 focus:outline-none dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
