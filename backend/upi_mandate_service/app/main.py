from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import mandates, retry, notifications

import logging

from contextlib import asynccontextmanager
from app.database import Base, engine
import app.models.models

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.warning(f"Could not initialize database tables (will retry on first request): {e}")
    yield

app = FastAPI(
    title="UPI Mandate Service",
    description="Mandate creation, retry engine, and pre-debit notifications",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mandates.router, prefix="/api/v1/upi/mandates", tags=["Mandates"])
app.include_router(retry.router, prefix="/api/v1/upi/retry", tags=["Retry Engine"])
app.include_router(notifications.router, prefix="/api/v1/upi/notifications", tags=["Notifications"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "upi-mandate-service"}
