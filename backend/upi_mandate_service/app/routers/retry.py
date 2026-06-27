from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.models.models import MandateExecution, RetryQueue, UPIMandate
from app.services.retry_engine import RetryEngine

router = APIRouter()
retry_engine = RetryEngine()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

@router.get("/queue")
async def get_retry_queue(db: Session = Depends(get_db)):
    retries = db.query(RetryQueue).filter(RetryQueue.status == "queued").all()
    return {"retries": [{"id": r.id, "execution_id": r.execution_id, "attempt": r.attempt_number, "scheduled": r.scheduled_at} for r in retries]}

@router.post("/execute/{execution_id}")
async def execute_retry(execution_id: str, db: Session = Depends(get_db)):
    execution = db.query(MandateExecution).filter(MandateExecution.execution_id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    if execution.status != "failed":
        raise HTTPException(status_code=400, detail="Only failed executions can be retried")

    mandate = db.query(UPIMandate).filter(UPIMandate.mandate_id == execution.mandate_id).first()
    if execution.retry_attempt >= mandate.max_retries:
        raise HTTPException(status_code=400, detail="Maximum retry attempts reached")

    result = retry_engine.execute_retry(execution, mandate)

    execution.retry_attempt += 1
    execution.status = result["status"]
    if result["status"] == "success":
        execution.completed_at = _utcnow()
        mandate.successful_executions += 1
    else:
        execution.next_retry_at = result.get("next_retry_at")
        mandate.failed_executions += 1

    db.commit()

    return {
        "success": result["status"] == "success",
        "execution_id": execution_id,
        "attempt": execution.retry_attempt,
        "status": result["status"],
        "message": result["message"]
    }

@router.get("/stats")
async def get_retry_stats(db: Session = Depends(get_db)):
    total_retries = db.query(RetryQueue).count()
    successful_retries = db.query(RetryQueue).filter(RetryQueue.status == "completed").count()
    failed_retries = db.query(RetryQueue).filter(RetryQueue.status == "failed").count()
    pending_retries = db.query(RetryQueue).filter(RetryQueue.status == "queued").count()

    return {
        "total_retries": total_retries,
        "successful_retries": successful_retries,
        "failed_retries": failed_retries,
        "pending_retries": pending_retries,
        "success_rate": round((successful_retries / total_retries * 100), 2) if total_retries > 0 else 0
    }

@router.post("/process-queue")
async def process_retry_queue(db: Session = Depends(get_db)):
    pending = db.query(RetryQueue).filter(
        RetryQueue.status == "queued",
        RetryQueue.scheduled_at <= _utcnow()
    ).all()

    processed = 0
    for retry in pending:
        execution = db.query(MandateExecution).filter(
            MandateExecution.execution_id == retry.execution_id
        ).first()

        if execution:
            mandate = db.query(UPIMandate).filter(
                UPIMandate.mandate_id == retry.mandate_id
            ).first()

            result = retry_engine.execute_retry(execution, mandate)

            retry.status = "completed" if result["status"] == "success" else "failed"
            retry.result = result["message"]
            retry.executed_at = _utcnow()

            execution.status = result["status"]
            if result["status"] == "success":
                execution.completed_at = _utcnow()

            processed += 1

    db.commit()

    return {"success": True, "processed": processed, "message": f"Processed {processed} retries"}
