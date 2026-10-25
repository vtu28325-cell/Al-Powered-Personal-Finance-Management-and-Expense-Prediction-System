from datetime import date
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.budget import (
    BudgetCreate,
    BudgetOut,
    MonthlyBudgetSummary,
)
from app.schemas.analytics import BudgetAlertItem
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("/summary", response_model=MonthlyBudgetSummary)
def get_monthly_budget_summary(
    month: Optional[int] = Query(None, ge=1, le=12, description="Month (1-12)"),
    year: Optional[int] = Query(None, ge=2000, le=2100, description="Year (e.g. 2026)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get overall and category budget statuses for a specific month and year."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year
    return BudgetService.get_monthly_summary(
        db=db, user_id=current_user.id, year=target_year, month=target_month
    )


@router.post("", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def set_or_update_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Set or update a budget allocation for overall spending or a specific category."""
    budget = BudgetService.set_or_update_budget(
        db=db, user_id=current_user.id, budget_in=budget_in
    )
    return BudgetOut.model_validate(budget)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a budget target."""
    BudgetService.delete_budget(db=db, budget_id=budget_id, user_id=current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/alerts", response_model=List[BudgetAlertItem])
def get_budget_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get active budget warnings (>=80%) and exceeded alerts (>=100%) for current month."""
    return BudgetService.get_budget_alerts(db=db, user_id=current_user.id)
