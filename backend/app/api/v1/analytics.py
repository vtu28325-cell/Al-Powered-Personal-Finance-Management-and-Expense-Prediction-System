from datetime import date
from typing import Optional, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.analytics import (
    DashboardSummary,
    MonthlyCashFlowItem,
    CategoryBreakdownItem,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard(
    date_from: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    period: str = Query("This Month", description="Period label for display"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Fetch complete dashboard metrics, charts data, recent transactions, and active budget alerts."""
    return AnalyticsService.get_dashboard_summary(
        db=db,
        user_id=current_user.id,
        date_from=date_from,
        date_to=date_to,
        period_label=period,
    )


@router.get("/cash-flow", response_model=List[MonthlyCashFlowItem])
def get_cash_flow(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Fetch multi-month income, expense, and savings trajectory."""
    from app.models.transaction import Transaction
    from sqlalchemy import asc

    all_tx = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(asc(Transaction.transaction_date))
        .all()
    )
    return AnalyticsService._calculate_monthly_cash_flow(all_tx)
