from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import mandates, retry, notifications

app = FastAPI(
    title="UPI Mandate Service",
    description="Mandate creation, retry engine, and pre-debit notifications",
    version="1.0.0"
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
