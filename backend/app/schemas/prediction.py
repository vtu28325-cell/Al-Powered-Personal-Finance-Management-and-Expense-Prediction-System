from datetime import datetime
from typing import Optional, Dict, List
from pydantic import BaseModel, ConfigDict


class CategoryPredictionItem(BaseModel):
    category: str
    predicted_amount: float
    percentage_of_total: float
    historical_avg: float
    trend_direction: str  # 'increasing', 'stable', 'decreasing'


class HistoricalComparisonPoint(BaseModel):
    period: str  # 'YYYY-MM'
    actual: float
    predicted: Optional[float] = None


class PredictionResponse(BaseModel):
    target_month: int
    target_year: int
    target_period: str  # 'YYYY-MM'
    predicted_total_expense: float
    lower_bound: float
    upper_bound: float
    
    # Model Metadata
    model_name: str
    baseline_model_name: str
    baseline_predicted_amount: float
    training_months_count: int
    is_preliminary: bool
    data_quality_notice: Optional[str] = None
    
    # Evaluation Metrics (calculated chronologically without data leakage)
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2_score: Optional[float] = None
    
    # Explainability & Insights
    explanation: str
    feature_importance_note: Optional[str] = None
    
    # Category level breakdown
    category_predictions: List[CategoryPredictionItem] = []
    
    # Historical vs predicted points for charting
    history_points: List[HistoricalComparisonPoint] = []


class PredictionHistoryOut(BaseModel):
    id: int
    target_month: int
    target_year: int
    predicted_amount: float
    model_used: str
    mae: Optional[float]
    rmse: Optional[float]
    training_samples: int
    explanation: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
