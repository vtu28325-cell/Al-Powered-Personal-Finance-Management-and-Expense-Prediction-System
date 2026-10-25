import calendar
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc, asc
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.schemas.analytics import (
    DashboardSummary,
    CategoryBreakdownItem,
    MonthlyCashFlowItem,
    BudgetAlertItem,
)
from app.schemas.transaction import TransactionOut
from app.services.budget_service import BudgetService
from app.ml.predictor import ExpensePredictor


CATEGORY_COLORS: Dict[str, str] = {
    "Food": "#f59e0b",           # Amber
    "Transportation": "#3b82f6",   # Blue
    "Education": "#8b5cf6",        # Purple
    "Shopping": "#ec4899",         # Pink
    "Rent": "#ef4444",             # Red
    "Utilities": "#14b8a6",        # Teal
    "Healthcare": "#06b6d4",       # Cyan
    "Entertainment": "#a855f7",    # Violet
    "Travel": "#6366f1",           # Indigo
    "Personal Care": "#f43f5e",    # Rose
    "Other": "#6b7280",            # Gray
}


class AnalyticsService:
    @staticmethod
    def get_dashboard_summary(
        db: Session,
        user_id: int,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        period_label: str = "This Month",
    ) -> DashboardSummary:
        today = date.today()

        # If no dates passed, default to current month
        if not date_from and not date_to:
            date_from = date(today.year, today.month, 1)
            last_day = calendar.monthrange(today.year, today.month)[1]
            date_to = date(today.year, today.month, last_day)

        # Base query for selected period
        period_tx = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .filter(Transaction.transaction_date >= date_from)
            .filter(Transaction.transaction_date <= date_to)
            .all()
        )

        total_income = sum(t.amount for t in period_tx if t.type == "income")
        total_expenses = sum(t.amount for t in period_tx if t.type == "expense")
        net_balance = total_income - total_expenses
        savings_rate = (
            (net_balance / total_income * 100.0) if total_income > 0 else (0.0 if net_balance >= 0 else -100.0)
        )

        # Current Month Budget
        budget_summary = BudgetService.get_monthly_summary(
            db, user_id, today.year, today.month
        )
        monthly_budget = budget_summary.total_budgeted
        budget_spent = budget_summary.total_spent
        budget_remaining = budget_summary.total_remaining
        budget_pct = (
            (budget_spent / monthly_budget * 100.0) if monthly_budget > 0 else 0.0
        )

        # Category Breakdown for expenses in period
        cat_map: Dict[str, Dict[str, Any]] = {}
        for t in period_tx:
            if t.type == "expense":
                if t.category not in cat_map:
                    cat_map[t.category] = {"amount": 0.0, "count": 0}
                cat_map[t.category]["amount"] += t.amount
                cat_map[t.category]["count"] += 1

        category_breakdown: List[CategoryBreakdownItem] = []
        for cat, data in sorted(cat_map.items(), key=lambda x: x[1]["amount"], reverse=True):
            pct = (data["amount"] / total_expenses * 100.0) if total_expenses > 0 else 0.0
            category_breakdown.append(
                CategoryBreakdownItem(
                    category=cat,
                    amount=round(data["amount"], 2),
                    percentage=round(pct, 1),
                    transaction_count=data["count"],
                    color=CATEGORY_COLORS.get(cat, "#6b7280"),
                )
            )

        # Monthly Cash Flow (Historical 6-12 months)
        all_user_tx = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .order_by(asc(Transaction.transaction_date))
            .all()
        )

        monthly_cash_flow = AnalyticsService._calculate_monthly_cash_flow(all_user_tx)

        # Recent Transactions (Last 5)
        recent_tx_models = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .order_by(desc(Transaction.transaction_date), desc(Transaction.id))
            .limit(5)
            .all()
        )
        recent_transactions = [
            TransactionOut.model_validate(tx) for tx in recent_tx_models
        ]

        # Active Budget Alerts
        budget_alerts = BudgetService.get_budget_alerts(db, user_id)

        # ML Forecast for Next Month
        predicted_next_month = None
        if all_user_tx:
            try:
                predictor = ExpensePredictor(all_user_tx)
                pred_result = predictor.predict_next_month()
                predicted_next_month = pred_result.predicted_total_expense
            except Exception:
                predicted_next_month = None

        return DashboardSummary(
            period_label=period_label,
            total_income=round(total_income, 2),
            total_expenses=round(total_expenses, 2),
            net_balance=round(net_balance, 2),
            savings_rate=round(savings_rate, 1),
            monthly_budget=round(monthly_budget, 2),
            budget_spent=round(budget_spent, 2),
            budget_remaining=round(budget_remaining, 2),
            budget_percentage_used=round(budget_pct, 1),
            predicted_next_month_expense=predicted_next_month,
            category_breakdown=category_breakdown,
            monthly_cash_flow=monthly_cash_flow,
            recent_transactions=recent_transactions,
            budget_alerts=budget_alerts,
        )

    @staticmethod
    def _calculate_monthly_cash_flow(transactions: List[Transaction]) -> List[MonthlyCashFlowItem]:
        if not transactions:
            return []

        # Group by YYYY-MM
        periods: Dict[str, Dict[str, float]] = {}
        for t in transactions:
            period_key = f"{t.transaction_date.year}-{t.transaction_date.month:02d}"
            if period_key not in periods:
                periods[period_key] = {"income": 0.0, "expense": 0.0}
            if t.type == "income":
                periods[period_key]["income"] += t.amount
            elif t.type == "expense":
                periods[period_key]["expense"] += t.amount

        # Sort chronologically and take up to the last 12 months
        sorted_keys = sorted(periods.keys())
        last_keys = sorted_keys[-12:] if len(sorted_keys) > 12 else sorted_keys

        result = []
        for pk in last_keys:
            yr, mo = int(pk.split("-")[0]), int(pk.split("-")[1])
            inc = periods[pk]["income"]
            exp = periods[pk]["expense"]
            net = inc - exp
            rate = (net / inc * 100.0) if inc > 0 else 0.0
            month_label = f"{calendar.month_abbr[mo]} {yr}"
            result.append(
                MonthlyCashFlowItem(
                    month_name=month_label,
                    period=pk,
                    income=round(inc, 2),
                    expense=round(exp, 2),
                    net_savings=round(net, 2),
                    savings_rate=round(rate, 1),
                )
            )

        return result
