from datetime import date
from typing import Optional, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.analytics import FinancialInsightsResponse
from app.services.insights_service import InsightsService

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("", response_model=FinancialInsightsResponse)
def get_financial_insights(
    month: Optional[int] = Query(None, ge=1, le=12, description="Target analysis month"),
    year: Optional[int] = Query(None, ge=2000, le=2100, description="Target analysis year"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Generate explainable AI financial insights from user data.
    Analyzes category surges, MoM delta, savings rate, budget warnings, and transaction outliers.
    """
    return InsightsService.generate_insights(
        db=db, user_id=current_user.id, year=year, month=month
    )
