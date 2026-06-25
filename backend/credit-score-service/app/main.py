from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import score, report, financial_data

app = FastAPI(
    title="Credit Score Service",
    description="Financial data intake, score computation, and breakdown report",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(financial_data.router, prefix="/api/v1/credit/financial-data", tags=["Financial Data"])
app.include_router(score.router, prefix="/api/v1/credit/score", tags=["Credit Score"])
app.include_router(report.router, prefix="/api/v1/credit/report", tags=["Reports"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "credit-score-service"}
