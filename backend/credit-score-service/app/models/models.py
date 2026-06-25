from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Text
from sqlalchemy.sql import func
from app.database import Base

class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True, unique=True)
    monthly_income = Column(Float, default=0)
    monthly_expenses = Column(Float, default=0)
    existing_loans = Column(JSON, default=list)
    credit_cards = Column(JSON, default=list)
    employment_type = Column(String(50))
    employment_tenure_months = Column(Integer, default=0)
    total_assets = Column(Float, default=0)
    total_liabilities = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class CreditScore(Base):
    __tablename__ = "credit_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    score = Column(Integer, nullable=False)
    rating = Column(String(20), nullable=False)
    max_score = Column(Integer, default=900)
    computation_date = Column(DateTime(timezone=True), server_default=func.now())
    payment_history_score = Column(Integer, default=0)
    credit_utilization_score = Column(Integer, default=0)
    credit_history_score = Column(Integer, default=0)
    credit_mix_score = Column(Integer, default=0)
    new_credit_score = Column(Integer, default=0)
    breakdown = Column(JSON)
    recommendations = Column(JSON, default=list)
    risk_factors = Column(JSON, default=list)

class CreditReport(Base):
    __tablename__ = "credit_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    report_type = Column(String(50), default="full")
    report_data = Column(JSON)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    report_path = Column(Text)
