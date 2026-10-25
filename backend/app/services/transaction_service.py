import csv
import io
from datetime import date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_
from fastapi import HTTPException, status
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionService:
    @staticmethod
    def get_by_id(db: Session, transaction_id: int, user_id: int) -> Optional[Transaction]:
        return (
            db.query(Transaction)
            .filter(Transaction.id == transaction_id, Transaction.user_id == user_id)
            .first()
        )

    @staticmethod
    def create(db: Session, user_id: int, tx_in: TransactionCreate) -> Transaction:
        tx = Transaction(
            user_id=user_id,
            type=tx_in.type,
            amount=tx_in.amount,
            category=tx_in.category,
            description=tx_in.description,
            transaction_date=tx_in.transaction_date,
            payment_method=tx_in.payment_method or "Other",
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def update(
        db: Session, transaction_id: int, user_id: int, tx_in: TransactionUpdate
    ) -> Transaction:
        tx = TransactionService.get_by_id(db, transaction_id, user_id)
        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
            )

        update_data = tx_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(tx, key, value)

        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def delete(db: Session, transaction_id: int, user_id: int) -> bool:
        tx = TransactionService.get_by_id(db, transaction_id, user_id)
        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
            )
        db.delete(tx)
        db.commit()
        return True

    @staticmethod
    def get_filtered(
        db: Session,
        user_id: int,
        tx_type: Optional[str] = None,
        category: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        search: Optional[str] = None,
        sort_by: str = "date",  # 'date' or 'amount'
        sort_order: str = "desc",  # 'asc' or 'desc'
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Transaction], int]:
        query = db.query(Transaction).filter(Transaction.user_id == user_id)

        if tx_type:
            query = query.filter(Transaction.type == tx_type.lower())
        if category and category.lower() != "all":
            query = query.filter(Transaction.category.ilike(category))
        if date_from:
            query = query.filter(Transaction.transaction_date >= date_from)
        if date_to:
            query = query.filter(Transaction.transaction_date <= date_to)
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Transaction.description.ilike(search_term),
                    Transaction.category.ilike(search_term),
                    Transaction.payment_method.ilike(search_term),
                )
            )

        total = query.count()

        # Sorting
        sort_col = Transaction.transaction_date if sort_by == "date" else Transaction.amount
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_col), asc(Transaction.id))
        else:
            query = query.order_by(desc(sort_col), desc(Transaction.id))

        # Pagination
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()

        return items, total

    @staticmethod
    def export_csv(
        db: Session,
        user_id: int,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> str:
        query = db.query(Transaction).filter(Transaction.user_id == user_id)
        if date_from:
            query = query.filter(Transaction.transaction_date >= date_from)
        if date_to:
            query = query.filter(Transaction.transaction_date <= date_to)

        transactions = query.order_by(desc(Transaction.transaction_date)).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            ["ID", "Date", "Type", "Category", "Description", "Amount", "Payment Method"]
        )

        for tx in transactions:
            writer.writerow(
                [
                    tx.id,
                    tx.transaction_date.isoformat(),
                    tx.type.capitalize(),
                    tx.category,
                    tx.description,
                    f"{tx.amount:.2f}",
                    tx.payment_method or "Other",
                ]
            )

        return output.getvalue()
