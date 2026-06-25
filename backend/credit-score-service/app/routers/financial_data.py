from fastapi import APIRouter, Form, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from app.database import get_db
from app.models.models import FinancialProfile

router = APIRouter()

@router.post("/submit")
async def submit_financial_data(
    user_id: str = Form(...),
    monthly_income: float = Form(...),
    monthly_expenses: float = Form(...),
    employment_type: str = Form(...),
    employment_tenure_months: int = Form(0),
    total_assets: float = Form(0),
    total_liabilities: float = Form(0),
    existing_loans: str = Form("[]"),
    credit_cards: str = Form("[]"),
    db: Session = Depends(get_db)
):
    try:
        loans = json.loads(existing_loans)
        cards = json.loads(credit_cards)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format for loans or credit cards")

    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user_id).first()

    if profile:
        profile.monthly_income = monthly_income
        profile.monthly_expenses = monthly_expenses
        profile.employment_type = employment_type
        profile.employment_tenure_months = employment_tenure_months
        profile.total_assets = total_assets
        profile.total_liabilities = total_liabilities
        profile.existing_loans = loans
        profile.credit_cards = cards
    else:
        profile = FinancialProfile(
            user_id=user_id,
            monthly_income=monthly_income,
            monthly_expenses=monthly_expenses,
            employment_type=employment_type,
            employment_tenure_months=employment_tenure_months,
            total_assets=total_assets,
            total_liabilities=total_liabilities,
            existing_loans=loans,
            credit_cards=cards
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)

    return {"success": True, "profile_id": profile.id, "user_id": user_id, "message": "Financial data submitted successfully"}

@router.get("/user/{user_id}")
async def get_financial_profile(user_id: str, db: Session = Depends(get_db)):
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Financial profile not found")
    return {
        "user_id": profile.user_id,
        "monthly_income": profile.monthly_income,
        "monthly_expenses": profile.monthly_expenses,
        "employment_type": profile.employment_type,
        "employment_tenure_months": profile.employment_tenure_months,
        "total_assets": profile.total_assets,
        "total_liabilities": profile.total_liabilities,
        "existing_loans": profile.existing_loans,
        "credit_cards": profile.credit_cards
    }
