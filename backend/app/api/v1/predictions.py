import json
from typing import Optional, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.prediction import PredictionHistory
from app.schemas.prediction import (
    PredictionResponse,
    PredictionHistoryOut,
)
from app.ml.predictor import ExpensePredictor

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.get("", response_model=PredictionResponse)
def get_expense_prediction(
    target_year: Optional[int] = Query(None, description="Target forecast year"),
    target_month: Optional[int] = Query(None, description="Target forecast month (1-12)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Generate Machine Learning expense prediction for next month.
    Evaluates historical transactions using Ridge Regression with time-lag features,
    cyclical month seasonality, and baseline comparison.
    """
    user_tx = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.transaction_date.asc())
        .all()
    )

    predictor = ExpensePredictor(user_tx)
    response = predictor.predict_next_month(
        target_year=target_year, target_month=target_month
    )

    # Automatically record snapshot in PredictionHistory if we have a valid prediction
    if response.predicted_total_expense > 0 and not response.is_preliminary:
        cat_json = json.dumps([item.model_dump() for item in response.category_predictions])
        history_record = PredictionHistory(
            user_id=current_user.id,
            target_month=response.target_month,
            target_year=response.target_year,
            predicted_amount=response.predicted_total_expense,
            model_used=response.model_name,
            mae=response.mae,
            rmse=response.rmse,
            training_samples=response.training_months_count,
            explanation=response.explanation,
            category_predictions_json=cat_json,
        )
        db.add(history_record)
        db.commit()

    return response


@router.get("/history", response_model=List[PredictionHistoryOut])
def get_prediction_history(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Fetch log of previously generated predictions and historical model evaluation scores."""
    records = (
        db.query(PredictionHistory)
        .filter(PredictionHistory.user_id == current_user.id)
        .order_by(desc(PredictionHistory.created_at))
        .limit(limit)
        .all()
    )
    return [PredictionHistoryOut.model_validate(r) for r in records]
