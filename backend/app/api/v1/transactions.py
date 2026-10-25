from datetime import date
from typing import Optional, Any
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionOut,
    PaginatedTransactions,
)
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("", response_model=PaginatedTransactions)
def list_transactions(
    tx_type: Optional[str] = Query(None, description="'income' or 'expense'"),
    category: Optional[str] = Query(None, description="Category name"),
    date_from: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Search description or category"),
    sort_by: str = Query("date", description="'date' or 'amount'"),
    sort_order: str = Query("desc", description="'asc' or 'desc'"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(15, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve filtered, sorted, paginated transactions belonging to authenticated user."""
    items, total = TransactionService.get_filtered(
        db=db,
        user_id=current_user.id,
        tx_type=tx_type,
        category=category,
        date_from=date_from,
        date_to=date_to,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedTransactions(
        items=[TransactionOut.model_validate(tx) for tx in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new income or expense transaction."""
    tx = TransactionService.create(db=db, user_id=current_user.id, tx_in=tx_in)
    return TransactionOut.model_validate(tx)


@router.get("/export/csv")
def export_csv(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Export transactions to downloadable CSV file."""
    csv_content = TransactionService.export_csv(
        db=db, user_id=current_user.id, date_from=date_from, date_to=date_to
    )
    filename = f"transactions_{date.today().isoformat()}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get single transaction by ID."""
    tx = TransactionService.get_by_id(db=db, transaction_id=transaction_id, user_id=current_user.id)
    if not tx:
        return Response(status_code=status.HTTP_404_NOT_FOUND)
    return TransactionOut.model_validate(tx)


@router.put("/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    transaction_id: int,
    tx_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update an existing transaction."""
    tx = TransactionService.update(
        db=db, transaction_id=transaction_id, user_id=current_user.id, tx_in=tx_in
    )
    return TransactionOut.model_validate(tx)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a transaction."""
    TransactionService.delete(db=db, transaction_id=transaction_id, user_id=current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
