from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base


class UPIMandate(Base):
    __tablename__ = "upi_mandates"

    id = Column(Integer, primary_key=True, index=True)
    mandate_id = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    mandate_type = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    frequency = Column(String(20), default="monthly")
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    upi_id = Column(String(100), nullable=False)
    merchant_vpa = Column(String(100), nullable=False)
    merchant_name = Column(String(200))
    status = Column(String(20), default="pending")
    total_executions = Column(Integer, default=0)
    successful_executions = Column(Integer, default=0)
    failed_executions = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    retry_count = Column(Integer, default=0)
    purpose = Column(Text)
    rules = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class MandateExecution(Base):
    __tablename__ = "mandate_executions"

    id = Column(Integer, primary_key=True, index=True)
    mandate_id = Column(String(100), nullable=False, index=True)
    execution_id = Column(String(100), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending")
    transaction_id = Column(String(100))
    retry_attempt = Column(Integer, default=0)
    next_retry_at = Column(DateTime(timezone=True))
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    executed_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    failure_reason = Column(Text)
    error_code = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PreDebitNotification(Base):
    __tablename__ = "pre_debit_notifications"

    id = Column(Integer, primary_key=True, index=True)
    mandate_id = Column(String(100), nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    notification_type = Column(String(50), default="sms")
    message = Column(Text)
    scheduled_debit_date = Column(DateTime(timezone=True), nullable=False)
    sent_at = Column(DateTime(timezone=True))
    status = Column(String(20), default="pending")
    delivery_status = Column(String(50))
    user_acknowledged = Column(Boolean, default=False)
    user_response = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RetryQueue(Base):
    __tablename__ = "retry_queue"

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(String(100), nullable=False, index=True)
    mandate_id = Column(String(100), nullable=False, index=True)
    attempt_number = Column(Integer, default=1)
    max_attempts = Column(Integer, default=3)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    executed_at = Column(DateTime(timezone=True))
    status = Column(String(20), default="queued")
    result = Column(Text)
    backoff_minutes = Column(Integer, default=30)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
