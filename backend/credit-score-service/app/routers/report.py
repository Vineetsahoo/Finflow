from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import CreditScore, CreditReport, FinancialProfile
from app.services.report_generator import ReportGenerator
import json
import os

router = APIRouter()
report_generator = ReportGenerator()

@router.get("/user/{user_id}")
async def get_credit_report(user_id: str, db: Session = Depends(get_db)):
    score = db.query(CreditScore).filter(CreditScore.user_id == user_id).order_by(CreditScore.computation_date.desc()).first()
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user_id).first()

    if not score:
        raise HTTPException(status_code=404, detail="No credit score found")

    report_data = report_generator.generate_report(score, profile)
    return {"success": True, "user_id": user_id, "report": report_data}

@router.post("/generate/{user_id}")
async def generate_report_file(user_id: str, db: Session = Depends(get_db)):
    score = db.query(CreditScore).filter(CreditScore.user_id == user_id).order_by(CreditScore.computation_date.desc()).first()
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user_id).first()

    if not score:
        raise HTTPException(status_code=404, detail="No credit score found")

    report_data = report_generator.generate_report(score, profile)

    reports_dir = "/app/reports"
    os.makedirs(reports_dir, exist_ok=True)
    file_path = f"{reports_dir}/credit_report_{user_id}_{score.id}.json"

    with open(file_path, "w") as f:
        json.dump(report_data, f, indent=2, default=str)

    report = CreditReport(
        user_id=user_id,
        report_type="full",
        report_data=report_data,
        report_path=file_path
    )
    db.add(report)
    db.commit()

    return {"success": True, "report_path": file_path, "report_id": report.id}
