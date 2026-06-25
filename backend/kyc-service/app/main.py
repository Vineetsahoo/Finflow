from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import documents, verification, face_match

app = FastAPI(
    title="KYC Service",
    description="Document upload, OCR extraction, and face verification",
    version="1.0.0"
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
