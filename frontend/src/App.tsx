import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { InsightsPage } from './pages/InsightsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoadingSpinner } from './components/EmptyState';

type PublicView = 'landing' | 'login' | 'register';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const [publicView, setPublicView] = useState<PublicView>('landing');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerGlobalRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleDemoLogin = async () => {
    const demoEmail = 'evaluator@college.edu';
    const demoPassword = 'Password123!';
    try {
      await login(demoEmail, demoPassword);
    } catch {
      try {
        await register({
          email: demoEmail,
          full_name: 'Evaluator / Demo User',
          password: demoPassword,
          currency: 'USD',
        });
      } catch (err) {
        console.error('Demo registration failed', err);
        setPublicView('login');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner message="Initializing SpendPulse Finance Platform..." />
      </div>
    );
  }

  // Unauthenticated user views
  if (!isAuthenticated) {
    if (publicView === 'login') {
      return (
        <LoginPage
          onNavigateToRegister={() => setPublicView('register')}
          onNavigateToLanding={() => setPublicView('landing')}
        />
      );
    }
    if (publicView === 'register') {
      return (
        <RegisterPage
          onNavigateToLogin={() => setPublicView('login')}
          onNavigateToLanding={() => setPublicView('landing')}
        />
      );
    }
    return (
      <LandingPage
        onGetStarted={() => setPublicView('register')}
        onLogin={() => setPublicView('login')}
        onDemoLogin={handleDemoLogin}
      />
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sticky Header */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onRefreshData={triggerGlobalRefresh}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {currentTab === 'dashboard' && (
              <DashboardPage
                onNavigateToTransactions={() => setCurrentTab('transactions')}
                onNavigateToBudgets={() => setCurrentTab('budgets')}
                onNavigateToPredictions={() => setCurrentTab('predictions')}
                refreshTrigger={refreshKey}
              />
            )}
            {currentTab === 'transactions' && (
              <TransactionsPage onTransactionChange={triggerGlobalRefresh} />
            )}
            {currentTab === 'budgets' && (
              <BudgetsPage onBudgetChange={triggerGlobalRefresh} />
            )}
            {currentTab === 'predictions' && (
              <PredictionsPage onRefreshData={triggerGlobalRefresh} />
            )}
            {currentTab === 'insights' && (
              <InsightsPage
                onNavigateToTransactions={() => setCurrentTab('transactions')}
                onNavigateToBudgets={() => setCurrentTab('budgets')}
              />
            )}
            {currentTab === 'reports' && <AnalyticsPage />}
            {currentTab === 'profile' && (
              <ProfilePage onDataReset={triggerGlobalRefresh} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
