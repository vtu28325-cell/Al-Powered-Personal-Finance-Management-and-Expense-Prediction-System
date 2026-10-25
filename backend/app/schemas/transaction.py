from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator, ConfigDict


VALID_EXPENSE_CATEGORIES = [
    "Food", "Transportation", "Education", "Shopping", "Rent",
    "Utilities", "Healthcare", "Entertainment", "Travel", "Personal Care", "Other"
]

VALID_INCOME_CATEGORIES = [
    "Salary", "Allowance", "Freelancing", "Scholarship", "Business",
    "Investment Income", "Other"
]

PAYMENT_METHODS = ["Cash", "Credit Card", "Debit Card", "UPI", "Net Banking", "Other"]


class TransactionBase(BaseModel):
    type: Literal["income", "expense"]
    amount: float = Field(..., gt=0, description="Amount must be strictly greater than 0")
    category: str = Field(..., min_length=1, max_length=50)
    description: str = Field(..., min_length=1, max_length=255)
    transaction_date: date
    payment_method: Optional[str] = Field(default="Other", max_length=50)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        v_clean = v.strip()
        if not v_clean:
            raise ValueError("Category cannot be blank")
        return v_clean


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    type: Optional[Literal["income", "expense"]] = None
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    transaction_date: Optional[date] = None
    payment_method: Optional[str] = Field(None, max_length=50)


class TransactionOut(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedTransactions(BaseModel):
    items: list[TransactionOut]
    total: int
    page: int
    page_size: int
    total_pages: int
