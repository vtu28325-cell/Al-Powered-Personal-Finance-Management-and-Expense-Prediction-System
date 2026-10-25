from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import relationship
from app.database.session import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(20), nullable=False, index=True)  # 'income' or 'expense'
    amount = Column(Float, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    transaction_date = Column(Date, nullable=False, index=True)
    payment_method = Column(String(50), nullable=True)  # 'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="transactions")

    __table_args__ = (
        Index("idx_user_date", "user_id", "transaction_date"),
        Index("idx_user_type_category", "user_id", "type", "category"),
    )
