from typing import List, Optional
from pydantic import BaseModel
from app.schemas.transaction import TransactionOut


class CategoryBreakdownItem(BaseModel):
    category: str
    amount: float
    percentage: float
    transaction_count: int
    color: Optional[str] = None


class MonthlyCashFlowItem(BaseModel):
    month_name: str  # e.g., 'Jan 2026'
    period: str      # e.g., '2026-01'
    income: float
    expense: float
    net_savings: float
    savings_rate: float


class DailySpendingItem(BaseModel):
    date: str
    amount: float


class BudgetAlertItem(BaseModel):
    category: str
    allocated: float
    spent: float
    remaining: float
    percentage: float
    severity: str  # 'warning' (>80%) or 'danger' (>=100%)
    message: str


class DashboardSummary(BaseModel):
    period_label: str
    total_income: float
    total_expenses: float
    net_balance: float
    savings_rate: float
    
    # Current month budget status
    monthly_budget: float
    budget_spent: float
    budget_remaining: float
    budget_percentage_used: float
    
    # AI forecast headline
    predicted_next_month_expense: Optional[float] = None
    
    # Breakdowns & Charts
    category_breakdown: List[CategoryBreakdownItem] = []
    monthly_cash_flow: List[MonthlyCashFlowItem] = []
    recent_transactions: List[TransactionOut] = []
    budget_alerts: List[BudgetAlertItem] = []


class AIInsightItem(BaseModel):
    id: str
    title: str
    description: str
    type: str  # 'info', 'warning', 'success', 'recommendation'
    category: Optional[str] = None
    metric_value: Optional[str] = None
    icon: Optional[str] = None


class OutlierTransactionItem(BaseModel):
    id: int
    description: str
    amount: float
    category: str
    transaction_date: str
    category_average: float
    deviation_factor: float


class FinancialInsightsResponse(BaseModel):
    month: int
    year: int
    top_spending_category: Optional[str] = None
    top_category_amount: float = 0.0
    top_category_percentage: float = 0.0
    mom_spending_change_pct: Optional[float] = None  # Month-over-month % change
    mom_income_change_pct: Optional[float] = None
    savings_rate: float = 0.0
    savings_rating: str = "Moderate"  # 'Excellent', 'Good', 'Moderate', 'Low', 'Critical'
    insights: List[AIInsightItem] = []
    outliers: List[OutlierTransactionItem] = []
    recommendations: List[str] = []
