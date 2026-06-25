from celery import Celery
import os

celery_app = Celery(
    "upi_mandate",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
    include=["app.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "process-retry-queue": {
            "task": "app.tasks.process_retries",
            "schedule": 300.0,
        },
        "schedule-notifications": {
            "task": "app.tasks.schedule_notifications",
            "schedule": 3600.0,
        },
    }
)
