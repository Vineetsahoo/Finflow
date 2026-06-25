from fastapi import APIRouter, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_db
from app.models.models import PreDebitNotification, UPIMandate, MandateExecution
from app.services.notification_service import NotificationService

router = APIRouter()
notif_service = NotificationService()

@router.post("/send")
async def send_notification(
    mandate_id: str = Form(...),
    user_id: str = Form(...),
    notification_type: str = Form("sms"),
    scheduled_debit_date: str = Form(...),
    message: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    mandate = db.query(UPIMandate).filter(UPIMandate.mandate_id == mandate_id).first()
    if not mandate:
        raise HTTPException(status_code=404, detail="Mandate not found")

    try:
        debit_date = datetime.fromisoformat(scheduled_debit_date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    if not message:
        message = notif_service.generate_notification_message(mandate, debit_date)

    notification = PreDebitNotification(
        mandate_id=mandate_id,
        user_id=user_id,
        notification_type=notification_type,
        message=message,
        scheduled_debit_date=debit_date,
        status="sent",
        sent_at=datetime.utcnow(),
        delivery_status="delivered"
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "success": True,
        "notification_id": notification.id,
        "delivery_status": "delivered",
        "message": "Notification recorded successfully (no external service configured)"
    }

@router.get("/user/{user_id}")
async def get_user_notifications(user_id: str, db: Session = Depends(get_db)):
    notifications = db.query(PreDebitNotification).filter(
        PreDebitNotification.user_id == user_id
    ).order_by(PreDebitNotification.created_at.desc()).all()

    return {"notifications": [{"id": n.id, "mandate": n.mandate_id, "type": n.notification_type, "status": n.status, "message": n.message} for n in notifications]}

@router.post("/{notification_id}/acknowledge")
async def acknowledge_notification(
    notification_id: int,
    response: str = Form(...),
    db: Session = Depends(get_db)
):
    notification = db.query(PreDebitNotification).filter(
        PreDebitNotification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.user_acknowledged = True
    notification.user_response = response
    db.commit()

    if response == "declined":
        mandate = db.query(UPIMandate).filter(
            UPIMandate.mandate_id == notification.mandate_id
        ).first()
        if mandate:
            mandate.status = "paused"
            db.commit()

    return {"success": True, "message": f"Notification acknowledged with response: {response}"}

@router.post("/schedule-auto")
async def schedule_auto_notifications(db: Session = Depends(get_db)):
    upcoming = db.query(MandateExecution).filter(
        MandateExecution.scheduled_at <= datetime.utcnow() + timedelta(hours=48),
        MandateExecution.scheduled_at > datetime.utcnow(),
        MandateExecution.status == "scheduled"
    ).all()

    scheduled_count = 0
    for execution in upcoming:
        existing = db.query(PreDebitNotification).filter(
            PreDebitNotification.mandate_id == execution.mandate_id,
            PreDebitNotification.scheduled_debit_date == execution.scheduled_at
        ).first()

        if not existing:
            mandate = db.query(UPIMandate).filter(
                UPIMandate.mandate_id == execution.mandate_id
            ).first()

            if mandate and mandate.status == "active":
                notification = PreDebitNotification(
                    mandate_id=execution.mandate_id,
                    user_id=mandate.user_id,
                    notification_type="sms",
                    message=notif_service.generate_notification_message(mandate, execution.scheduled_at),
                    scheduled_debit_date=execution.scheduled_at,
                    status="pending"
                )
                db.add(notification)
                scheduled_count += 1

    db.commit()

    return {"success": True, "scheduled": scheduled_count, "message": f"Scheduled {scheduled_count} auto-notifications"}
