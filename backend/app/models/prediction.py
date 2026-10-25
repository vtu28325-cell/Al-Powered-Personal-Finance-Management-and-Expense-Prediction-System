from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.session import Base


class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_month = Column(Integer, nullable=False)
    target_year = Column(Integer, nullable=False)
    predicted_amount = Column(Float, nullable=False)
    model_used = Column(String(100), nullable=False)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    training_samples = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=True)
    category_predictions_json = Column(Text, nullable=True)  # JSON-encoded dictionary of category predictions
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="predictions")
