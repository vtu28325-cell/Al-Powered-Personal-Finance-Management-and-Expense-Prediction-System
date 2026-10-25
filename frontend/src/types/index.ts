export interface User {
  id: number;
  email: string;
  full_name: string;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  user_id: number;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  transaction_date: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TransactionFormData {
  type: TransactionType;
  amount: number | '';
  category: string;
  description: string;
  transaction_date: string;
  payment_method?: string;
}

export type BudgetStatusType = 'normal' | 'warning' | 'exceeded';

export interface BudgetStatus {
  id: number;
  user_id: number;
  category: string;
  amount: number;
  month: number;
  year: number;
  spent: number;
  remaining: number;
  percentage_used: number;
  status: BudgetStatusType;
  created_at: string;
}

export interface MonthlyBudgetSummary {
  month: number;
  year: number;
  overall_budget?: BudgetStatus;
  category_budgets: BudgetStatus[];
  total_budgeted: number;
  total_spent: number;
  total_remaining: number;
  warning_count: number;
  exceeded_count: number;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
  transaction_count: number;
  color?: string;
}

export interface MonthlyCashFlowItem {
  month_name: string;
  period: string;
  income: number;
  expense: number;
  net_savings: number;
  savings_rate: number;
}

export interface BudgetAlertItem {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
  severity: 'warning' | 'danger';
  message: string;
}

export interface DashboardSummary {
  period_label: string;
  total_income: number;
  total_expenses: number;
  net_balance: number;
  savings_rate: number;
  monthly_budget: number;
  budget_spent: number;
  budget_remaining: number;
  budget_percentage_used: number;
  predicted_next_month_expense?: number;
  category_breakdown: CategoryBreakdownItem[];
  monthly_cash_flow: MonthlyCashFlowItem[];
  recent_transactions: Transaction[];
  budget_alerts: BudgetAlertItem[];
}

export interface CategoryPredictionItem {
  category: string;
  predicted_amount: number;
  percentage_of_total: number;
  historical_avg: number;
  trend_direction: 'increasing' | 'stable' | 'decreasing';
}

export interface HistoricalComparisonPoint {
  period: string;
  actual: number;
  predicted?: number;
}

export interface PredictionResponse {
  target_month: number;
  target_year: number;
  target_period: string;
  predicted_total_expense: number;
  lower_bound: number;
  upper_bound: number;
  model_name: string;
  baseline_model_name: string;
  baseline_predicted_amount: number;
  training_months_count: number;
  is_preliminary: boolean;
  data_quality_notice?: string;
  mae?: number;
  rmse?: number;
  r2_score?: number;
  explanation: string;
  feature_importance_note?: string;
  category_predictions: CategoryPredictionItem[];
  history_points: HistoricalComparisonPoint[];
}

export interface PredictionHistoryItem {
  id: number;
  target_month: number;
  target_year: number;
  predicted_amount: number;
  model_used: string;
  mae?: number;
  rmse?: number;
  training_samples: number;
  explanation?: string;
  created_at: string;
}

export interface AIInsightItem {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'recommendation';
  category?: string;
  metric_value?: string;
  icon?: string;
}

export interface OutlierTransactionItem {
  id: number;
  description: string;
  amount: number;
  category: string;
  transaction_date: string;
  category_average: number;
  deviation_factor: number;
}

export interface FinancialInsightsResponse {
  month: number;
  year: number;
  top_spending_category?: string;
  top_category_amount: number;
  top_category_percentage: number;
  mom_spending_change_pct?: number;
  mom_income_change_pct?: number;
  savings_rate: number;
  savings_rating: string;
  insights: AIInsightItem[];
  outliers: OutlierTransactionItem[];
  recommendations: string[];
}
