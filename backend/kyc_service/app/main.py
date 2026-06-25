from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import documents, verification, face_match

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
    title="KYC Service",
    description="Document upload, OCR extraction, and face verification",
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

app.include_router(documents.router, prefix="/api/v1/kyc/documents", tags=["Documents"])
app.include_router(verification.router, prefix="/api/v1/kyc/verification", tags=["Verification"])
app.include_router(face_match.router, prefix="/api/v1/kyc/face-match", tags=["Face Match"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "kyc-service"}
