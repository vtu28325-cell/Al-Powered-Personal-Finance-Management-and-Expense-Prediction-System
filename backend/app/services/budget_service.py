from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from fastapi import HTTPException, status
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetStatusOut,
    MonthlyBudgetSummary,
)
from app.schemas.analytics import BudgetAlertItem


class BudgetService:
    @staticmethod
    def set_or_update_budget(db: Session, user_id: int, budget_in: BudgetCreate) -> Budget:
        existing = (
            db.query(Budget)
            .filter(
                Budget.user_id == user_id,
                Budget.category == budget_in.category,
                Budget.month == budget_in.month,
                Budget.year == budget_in.year,
            )
            .first()
        )

        if existing:
            existing.amount = budget_in.amount
            db.commit()
            db.refresh(existing)
            return existing

        budget = Budget(
            user_id=user_id,
            category=budget_in.category,
            amount=budget_in.amount,
            month=budget_in.month,
            year=budget_in.year,
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return budget

    @staticmethod
    def delete_budget(db: Session, budget_id: int, user_id: int) -> bool:
        budget = (
            db.query(Budget)
            .filter(Budget.id == budget_id, Budget.user_id == user_id)
            .first()
        )
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Budget target not found"
            )
        db.delete(budget)
        db.commit()
        return True

    @staticmethod
    def get_monthly_summary(
        db: Session, user_id: int, year: int, month: int
    ) -> MonthlyBudgetSummary:
        # Fetch all budgets for this month
        budgets = (
            db.query(Budget)
            .filter(
                Budget.user_id == user_id,
                Budget.month == month,
                Budget.year == year,
            )
            .all()
        )

        # Calculate actual spending for this month by category
        tx_query = (
            db.query(
                Transaction.category,
                func.sum(Transaction.amount).label("category_spent"),
            )
            .filter(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                extract("year", Transaction.transaction_date) == year,
                extract("month", Transaction.transaction_date) == month,
            )
            .group_by(Transaction.category)
            .all()
        )
        spending_by_category = {row[0]: float(row[1] or 0.0) for row in tx_query}
        total_actual_spent = sum(spending_by_category.values())

        overall_budget_status: Optional[BudgetStatusOut] = None
        category_statuses: List[BudgetStatusOut] = []
        warning_count = 0
        exceeded_count = 0

        for b in budgets:
            if b.category.upper() == "OVERALL":
                spent = total_actual_spent
                remaining = b.amount - spent
                pct = (spent / b.amount * 100.0) if b.amount > 0 else 0.0
                status_str = "exceeded" if pct >= 100.0 else ("warning" if pct >= 80.0 else "normal")
                if status_str == "warning":
                    warning_count += 1
                elif status_str == "exceeded":
                    exceeded_count += 1

                overall_budget_status = BudgetStatusOut(
                    id=b.id,
                    user_id=b.user_id,
                    category=b.category,
                    amount=round(b.amount, 2),
                    month=b.month,
                    year=b.year,
                    created_at=b.created_at,
                    updated_at=b.updated_at,
                    spent=round(spent, 2),
                    remaining=round(remaining, 2),
                    percentage_used=round(pct, 1),
                    status=status_str,
                )
            else:
                spent = spending_by_category.get(b.category, 0.0)
                remaining = b.amount - spent
                pct = (spent / b.amount * 100.0) if b.amount > 0 else 0.0
                status_str = "exceeded" if pct >= 100.0 else ("warning" if pct >= 80.0 else "normal")
                if status_str == "warning":
                    warning_count += 1
                elif status_str == "exceeded":
                    exceeded_count += 1

                category_statuses.append(
                    BudgetStatusOut(
                        id=b.id,
                        user_id=b.user_id,
                        category=b.category,
                        amount=round(b.amount, 2),
                        month=b.month,
                        year=b.year,
                        created_at=b.created_at,
                        updated_at=b.updated_at,
                        spent=round(spent, 2),
                        remaining=round(remaining, 2),
                        percentage_used=round(pct, 1),
                        status=status_str,
                    )
                )

        # Sort category budgets by percentage used descending
        category_statuses.sort(key=lambda x: x.percentage_used, reverse=True)

        total_budgeted = (
            overall_budget_status.amount
            if overall_budget_status
            else sum(c.amount for c in category_statuses)
        )
        total_remaining = total_budgeted - total_actual_spent

        return MonthlyBudgetSummary(
            month=month,
            year=year,
            overall_budget=overall_budget_status,
            category_budgets=category_statuses,
            total_budgeted=round(total_budgeted, 2),
            total_spent=round(total_actual_spent, 2),
            total_remaining=round(total_remaining, 2),
            warning_count=warning_count,
            exceeded_count=exceeded_count,
        )

    @staticmethod
    def get_budget_alerts(db: Session, user_id: int) -> List[BudgetAlertItem]:
        today = date.today()
        summary = BudgetService.get_monthly_summary(db, user_id, today.year, today.month)
        alerts: List[BudgetAlertItem] = []

        all_items = []
        if summary.overall_budget:
            all_items.append(summary.overall_budget)
        all_items.extend(summary.category_budgets)

        for item in all_items:
            if item.status == "exceeded":
                alerts.append(
                    BudgetAlertItem(
                        category=item.category,
                        allocated=item.amount,
                        spent=item.spent,
                        remaining=item.remaining,
                        percentage=item.percentage_used,
                        severity="danger",
                        message=f"{item.category} budget of ${item.amount:,.2f} exceeded! You have spent ${item.spent:,.2f} ({item.percentage_used}%).",
                    )
                )
            elif item.status == "warning":
                alerts.append(
                    BudgetAlertItem(
                        category=item.category,
                        allocated=item.amount,
                        spent=item.spent,
                        remaining=item.remaining,
                        percentage=item.percentage_used,
                        severity="warning",
                        message=f"{item.category} has reached {item.percentage_used}% of its ${item.amount:,.2f} allocation. ${item.remaining:,.2f} left.",
                    )
                )

        return alerts
