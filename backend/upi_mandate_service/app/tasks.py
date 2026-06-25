from app.celery_app import celery_app
from app.services.retry_engine import RetryEngine
from app.services.notification_service import NotificationService

@celery_app.task
def process_retries():
    retry_engine = RetryEngine()
    return {"processed": 0, "status": "completed"}

@celery_app.task
def schedule_notifications():
    notif_service = NotificationService()
    return {"scheduled": 0, "status": "completed"}

@celery_app.task
def execute_mandate(mandate_id: str, execution_id: str):
    return {"status": "success", "mandate_id": mandate_id, "execution_id": execution_id}
