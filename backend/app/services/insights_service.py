import calendar
from datetime import date, datetime
from typing import List, Dict, Optional
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import extract, func, desc
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.schemas.analytics import (
    FinancialInsightsResponse,
    AIInsightItem,
    OutlierTransactionItem,
)
from app.services.budget_service import BudgetService
from app.ml.predictor import ExpensePredictor


class InsightsService:
    @staticmethod
    def generate_insights(
        db: Session, user_id: int, year: Optional[int] = None, month: Optional[int] = None
    ) -> FinancialInsightsResponse:
        today = date.today()
        target_year = year or today.year
        target_month = month or today.month

        # Current month transactions
        current_tx = (
            db.query(Transaction)
            .filter(
                Transaction.user_id == user_id,
                extract("year", Transaction.transaction_date) == target_year,
                extract("month", Transaction.transaction_date) == target_month,
            )
            .all()
        )

        # Previous month calculation
        prev_month = 12 if target_month == 1 else target_month - 1
        prev_year = target_year - 1 if target_month == 1 else target_year

        prev_tx = (
            db.query(Transaction)
            .filter(
                Transaction.user_id == user_id,
                extract("year", Transaction.transaction_date) == prev_year,
                extract("month", Transaction.transaction_date) == prev_month,
            )
            .all()
        )

        # Totals
        cur_income = sum(t.amount for t in current_tx if t.type == "income")
        cur_expenses = sum(t.amount for t in current_tx if t.type == "expense")
        cur_savings = cur_income - cur_expenses
        cur_savings_rate = (cur_savings / cur_income * 100.0) if cur_income > 0 else 0.0

        prev_income = sum(t.amount for t in prev_tx if t.type == "income")
        prev_expenses = sum(t.amount for t in prev_tx if t.type == "expense")

        # Month-over-Month changes
        mom_expense_pct = None
        if prev_expenses > 0:
            mom_expense_pct = round(((cur_expenses - prev_expenses) / prev_expenses) * 100.0, 1)

        mom_income_pct = None
        if prev_income > 0:
            mom_income_pct = round(((cur_income - prev_income) / prev_income) * 100.0, 1)

        # Category spending breakdown for current month
        cat_spending: Dict[str, float] = {}
        for t in current_tx:
            if t.type == "expense":
                cat_spending[t.category] = cat_spending.get(t.category, 0.0) + t.amount

        # Top category
        top_cat = None
        top_amount = 0.0
        top_pct = 0.0
        if cat_spending and cur_expenses > 0:
            sorted_cats = sorted(cat_spending.items(), key=lambda x: x[1], reverse=True)
            top_cat, top_amount = sorted_cats[0]
            top_pct = round((top_amount / cur_expenses) * 100.0, 1)

        # Generate explainable insights
        insights: List[AIInsightItem] = []
        recommendations: List[str] = []

        # 1. Top Spending Category Insight
        if top_cat:
            insights.append(
                AIInsightItem(
                    id="top_spending_category",
                    title="Highest Spending Category",
                    description=f"{top_cat} constitutes the largest share ({top_pct}%) of your total expenses this month at ${top_amount:,.2f}.",
                    type="info",
                    category=top_cat,
                    metric_value=f"${top_amount:,.2f}",
                    icon="PieChart",
                )
            )

        # 2. Month-over-Month Spending Trajectory
        if mom_expense_pct is not None:
            if mom_expense_pct > 15:
                insights.append(
                    AIInsightItem(
                        id="mom_expense_surge",
                        title="Spending Surge Detected",
                        description=f"Your expenses rose by {mom_expense_pct}% compared to {calendar.month_name[prev_month]}. Review recent purchases to keep spending aligned.",
                        type="warning",
                        metric_value=f"+{mom_expense_pct}%",
                        icon="TrendingUp",
                    )
                )
                recommendations.append(
                    f"Spending increased {mom_expense_pct}% compared to last month. Consider auditing recurring subscriptions and discretionary expenses."
                )
            elif mom_expense_pct < -10:
                insights.append(
                    AIInsightItem(
                        id="mom_expense_drop",
                        title="Healthy Spending Reduction",
                        description=f"Great discipline! Your spending decreased by {abs(mom_expense_pct)}% relative to {calendar.month_name[prev_month]}.",
                        type="success",
                        metric_value=f"{mom_expense_pct}%",
                        icon="TrendingDown",
                    )
                )

        # 3. Savings Rate Evaluation (50/30/20 standard)
        savings_rating = "Moderate"
        if cur_savings_rate >= 30:
            savings_rating = "Excellent"
            insights.append(
                AIInsightItem(
                    id="savings_rate_healthy",
                    title="Superior Savings Rate",
                    description=f"You are saving {cur_savings_rate:.1f}% of your monthly income, exceeding the recommended 20% benchmark.",
                    type="success",
                    metric_value=f"{cur_savings_rate:.1f}%",
                    icon="ShieldCheck",
                )
            )
        elif cur_savings_rate >= 15:
            savings_rating = "Good"
        elif cur_savings_rate >= 0:
            savings_rating = "Low"
            recommendations.append(
                "Your savings rate is currently below 15%. Aim to build an emergency fund by setting aside 10-20% at the start of each month."
            )
        else:
            savings_rating = "Critical"
            insights.append(
                AIInsightItem(
                    id="savings_negative",
                    title="Deficit Spending Warning",
                    description=f"Expenses exceed income this month by ${abs(cur_savings):,.2f}. You are operating in a monthly cash deficit.",
                    type="warning",
                    metric_value=f"-${abs(cur_savings):,.2f}",
                    icon="AlertTriangle",
                )
            )
            recommendations.append(
                "Prioritize eliminating non-essential expenses this month to restore positive cash flow."
            )

        # 4. Budget Status Check
        budget_summary = BudgetService.get_monthly_summary(db, user_id, target_year, target_month)
        for cat_b in budget_summary.category_budgets:
            if cat_b.status == "exceeded":
                insights.append(
                    AIInsightItem(
                        id=f"budget_exceeded_{cat_b.category}",
                        title=f"{cat_b.category} Budget Exceeded",
                        description=f"You have used {cat_b.percentage_used}% of your {cat_b.category} allocation (${cat_b.spent:,.2f} spent of ${cat_b.amount:,.2f}).",
                        type="warning",
                        category=cat_b.category,
                        metric_value=f"{cat_b.percentage_used}%",
                        icon="AlertCircle",
                    )
                )
            elif cat_b.status == "warning":
                insights.append(
                    AIInsightItem(
                        id=f"budget_warning_{cat_b.category}",
                        title=f"{cat_b.category} Approaching Budget",
                        description=f"{cat_b.category} is at {cat_b.percentage_used}% capacity. Only ${cat_b.remaining:,.2f} remains available.",
                        type="warning",
                        category=cat_b.category,
                        metric_value=f"${cat_b.remaining:,.2f} left",
                        icon="Clock",
                    )
                )

        # 5. Outlier Detection (Z-Score / 2 Std Dev above category average)
        all_user_tx = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id, Transaction.type == "expense")
            .all()
        )
        outliers: List[OutlierTransactionItem] = []
        if len(all_user_tx) >= 10:
            cat_groups: Dict[str, List[float]] = {}
            for t in all_user_tx:
                cat_groups.setdefault(t.category, []).append(t.amount)

            cat_stats: Dict[str, Tuple[float, float]] = {}
            for c, vals in cat_groups.items():
                if len(vals) >= 3:
                    cat_stats[c] = (float(np.mean(vals)), float(np.std(vals)))

            for t in current_tx:
                if t.type == "expense" and t.category in cat_stats:
                    mean_val, std_val = cat_stats[t.category]
                    if std_val > 5.0 and t.amount > (mean_val + 2.0 * std_val):
                        factor = round(t.amount / mean_val, 1)
                        outliers.append(
                            OutlierTransactionItem(
                                id=t.id,
                                description=t.description,
                                amount=round(t.amount, 2),
                                category=t.category,
                                transaction_date=t.transaction_date.isoformat(),
                                category_average=round(mean_val, 2),
                                deviation_factor=factor,
                            )
                        )

            if outliers:
                recommendations.append(
                    f"Identified {len(outliers)} unusually high transaction(s) this month compared to your category averages."
                )

        # Default recommendation if none generated
        if not recommendations:
            recommendations.append(
                "Your spending is balanced across active categories. Continue monitoring monthly budget allocations."
            )
            recommendations.append(
                "Review category predictions on the AI Prediction page to forecast future cash reserves."
            )

        return FinancialInsightsResponse(
            month=target_month,
            year=target_year,
            top_spending_category=top_cat,
            top_category_amount=round(top_amount, 2),
            top_category_percentage=top_pct,
            mom_spending_change_pct=mom_expense_pct,
            mom_income_change_pct=mom_income_pct,
            savings_rate=round(cur_savings_rate, 1),
            savings_rating=savings_rating,
            insights=insights,
            outliers=outliers[:5],
            recommendations=recommendations,
        )
