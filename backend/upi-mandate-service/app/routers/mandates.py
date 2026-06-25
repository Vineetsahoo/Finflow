from fastapi import APIRouter, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
import uuid
from app.database import get_db
from app.models.models import UPIMandate, MandateExecution
from app.services.mandate_engine import MandateEngine

router = APIRouter()
mandate_engine = MandateEngine()

@router.post("/create")
async def create_mandate(
    user_id: str = Form(...),
    mandate_type: str = Form(...),
    amount: float = Form(...),
    upi_id: str = Form(...),
    merchant_vpa: str = Form(...),
    merchant_name: str = Form(...),
    frequency: str = Form("monthly"),
    start_date: str = Form(...),
    end_date: str = Form(...),
    purpose: Optional[str] = Form(None),
    max_retries: int = Form(3),
    db: Session = Depends(get_db)
):
    mandate_id = f"MND-{uuid.uuid4().hex[:12].upper()}"

    try:
        start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO 8601 format")

    mandate = UPIMandate(
        mandate_id=mandate_id,
        user_id=user_id,
        mandate_type=mandate_type,
        amount=amount,
        frequency=frequency,
        start_date=start,
        end_date=end,
        upi_id=upi_id,
        merchant_vpa=merchant_vpa,
        merchant_name=merchant_name,
        status="active",
        purpose=purpose,
        max_retries=max_retries
    )

    db.add(mandate)
    db.commit()
    db.refresh(mandate)

    executions = mandate_engine.generate_execution_schedule(mandate)
    for exec_data in executions:
        execution = MandateExecution(
            mandate_id=mandate_id,
            execution_id=f"EXE-{uuid.uuid4().hex[:12].upper()}",
            amount=exec_data["amount"],
            scheduled_at=exec_data["scheduled_at"],
            status="scheduled"
        )
        db.add(execution)

    db.commit()

    return {
        "success": True,
        "mandate_id": mandate_id,
        "status": "active",
        "message": "Mandate created successfully",
        "executions_scheduled": len(executions)
    }

@router.get("/user/{user_id}")
async def get_user_mandates(user_id: str, db: Session = Depends(get_db)):
    mandates = db.query(UPIMandate).filter(UPIMandate.user_id == user_id).all()
    return {"mandates": [{"id": m.mandate_id, "type": m.mandate_type, "amount": m.amount, "status": m.status, "merchant": m.merchant_name} for m in mandates]}

@router.get("/{mandate_id}")
async def get_mandate(mandate_id: str, db: Session = Depends(get_db)):
    mandate = db.query(UPIMandate).filter(UPIMandate.mandate_id == mandate_id).first()
    if not mandate:
        raise HTTPException(status_code=404, detail="Mandate not found")

    executions = db.query(MandateExecution).filter(MandateExecution.mandate_id == mandate_id).all()

    return {
        "mandate": {
            "id": mandate.mandate_id,
            "type": mandate.mandate_type,
            "amount": mandate.amount,
            "status": mandate.status,
            "merchant": mandate.merchant_name,
            "frequency": mandate.frequency,
            "start": mandate.start_date,
            "end": mandate.end_date
        },
        "executions": [{"id": e.execution_id, "status": e.status, "scheduled": e.scheduled_at} for e in executions]
    }

@router.post("/{mandate_id}/pause")
async def pause_mandate(mandate_id: str, db: Session = Depends(get_db)):
    mandate = db.query(UPIMandate).filter(UPIMandate.mandate_id == mandate_id).first()
    if not mandate:
        raise HTTPException(status_code=404, detail="Mandate not found")
    if mandate.status != "active":
        raise HTTPException(status_code=400, detail=f"Cannot pause mandate with status: {mandate.status}")
    mandate.status = "paused"
    db.commit()
    return {"success": True, "message": "Mandate paused successfully"}

@router.post("/{mandate_id}/resume")
async def resume_mandate(mandate_id: str, db: Session = Depends(get_db)):
    mandate = db.query(UPIMandate).filter(UPIMandate.mandate_id == mandate_id).first()
    if not mandate:
        raise HTTPException(status_code=404, detail="Mandate not found")
    if mandate.status != "paused":
        raise HTTPException(status_code=400, detail=f"Cannot resume mandate with status: {mandate.status}")
    mandate.status = "active"
    db.commit()
    return {"success": True, "message": "Mandate resumed successfully"}

@router.post("/{mandate_id}/revoke")
async def revoke_mandate(mandate_id: str, reason: Optional[str] = Form(None), db: Session = Depends(get_db)):
    mandate = db.query(UPIMandate).filter(UPIMandate.mandate_id == mandate_id).first()
    if not mandate:
        raise HTTPException(status_code=404, detail="Mandate not found")
    mandate.status = "revoked"
    db.commit()
    return {"success": True, "message": f"Mandate revoked. Reason: {reason or 'Not specified'}"}
