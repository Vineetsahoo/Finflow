from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import FinancialProfile, CreditScore
from app.services.score_engine import CreditScoreEngine

router = APIRouter()
score_engine = CreditScoreEngine()

@router.post("/compute/{user_id}")
async def compute_credit_score(user_id: str, db: Session = Depends(get_db)):
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Financial profile not found")

    result = score_engine.compute_score(profile)

    score = CreditScore(
        user_id=user_id,
        score=result["score"],
        rating=result["rating"],
        payment_history_score=result["breakdown"]["payment_history"],
        credit_utilization_score=result["breakdown"]["credit_utilization"],
        credit_history_score=result["breakdown"]["credit_history"],
        credit_mix_score=result["breakdown"]["credit_mix"],
        new_credit_score=result["breakdown"]["new_credit"],
        breakdown=result["breakdown"],
        recommendations=result["recommendations"],
        risk_factors=result["risk_factors"]
    )
    db.add(score)
    db.commit()
    db.refresh(score)

    return {
        "success": True,
        "score_id": score.id,
        "score": result["score"],
        "rating": result["rating"],
        "max_score": 900,
        "breakdown": result["breakdown"],
        "recommendations": result["recommendations"],
        "risk_factors": result["risk_factors"]
    }

@router.get("/user/{user_id}")
async def get_latest_score(user_id: str, db: Session = Depends(get_db)):
    score = db.query(CreditScore).filter(CreditScore.user_id == user_id).order_by(CreditScore.computation_date.desc()).first()
    if not score:
        raise HTTPException(status_code=404, detail="No credit score found")
    return {
        "score": score.score,
        "rating": score.rating,
        "breakdown": {
            "payment_history": score.payment_history_score,
            "credit_utilization": score.credit_utilization_score,
            "credit_history": score.credit_history_score,
            "credit_mix": score.credit_mix_score,
            "new_credit": score.new_credit_score
        },
        "recommendations": score.recommendations,
        "risk_factors": score.risk_factors,
        "computed_at": score.computation_date
    }

@router.get("/user/{user_id}/history")
async def get_score_history(user_id: str, db: Session = Depends(get_db)):
    scores = db.query(CreditScore).filter(CreditScore.user_id == user_id).order_by(CreditScore.computation_date.desc()).all()
    return {"scores": [{"id": s.id, "score": s.score, "rating": s.rating, "date": s.computation_date} for s in scores]}
