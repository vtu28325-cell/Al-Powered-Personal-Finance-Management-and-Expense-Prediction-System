from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


class BudgetBase(BaseModel):
    category: str = Field(default="OVERALL", max_length=50, description="'OVERALL' or specific expense category")
    amount: float = Field(..., gt=0, description="Budget target must be strictly positive")
    month: int = Field(..., ge=1, le=12, description="Month of year (1-12)")
    year: int = Field(..., ge=2000, le=2100, description="Year (e.g. 2026)")


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: float = Field(..., gt=0)


class BudgetOut(BudgetBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BudgetStatusOut(BudgetOut):
    spent: float
    remaining: float
    percentage_used: float
    status: Literal["normal", "warning", "exceeded"]  # normal (<80%), warning (80-99%), exceeded (>=100%)


class MonthlyBudgetSummary(BaseModel):
    month: int
    year: int
    overall_budget: Optional[BudgetStatusOut] = None
    category_budgets: list[BudgetStatusOut] = []
    total_budgeted: float
    total_spent: float
    total_remaining: float
    warning_count: int
    exceeded_count: int
