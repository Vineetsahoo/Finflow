from typing import Dict, Optional
from app.models.models import CreditScore, FinancialProfile

class ReportGenerator:
    def generate_report(self, score: CreditScore, profile: Optional[FinancialProfile]) -> Dict:
        report = {
            "summary": {
                "score": score.score,
                "rating": score.rating,
                "max_score": score.max_score,
                "computed_on": score.computation_date.isoformat() if score.computation_date else None,
                "percentile": self._calculate_percentile(score.score)
            },
            "breakdown": {
                "payment_history": {"score": score.payment_history_score, "weight": "35%", "description": "Your track record of paying bills on time"},
                "credit_utilization": {"score": score.credit_utilization_score, "weight": "30%", "description": "How much of your available credit you're using"},
                "credit_history": {"score": score.credit_history_score, "weight": "15%", "description": "Length of your credit history"},
                "credit_mix": {"score": score.credit_mix_score, "weight": "10%", "description": "Variety of credit types you have"},
                "new_credit": {"score": score.new_credit_score, "weight": "10%", "description": "Recent credit inquiries and new accounts"}
            },
            "recommendations": score.recommendations or [],
            "risk_factors": score.risk_factors or [],
            "financial_snapshot": self._get_financial_snapshot(profile) if profile else None
        }
        return report

    def _calculate_percentile(self, score: int) -> int:
        if score >= 800: return 95
        elif score >= 750: return 85
        elif score >= 700: return 70
        elif score >= 650: return 55
        elif score >= 600: return 40
        elif score >= 500: return 25
        return 10

    def _get_financial_snapshot(self, profile: FinancialProfile) -> Dict:
        return {
            "monthly_income": profile.monthly_income,
            "monthly_expenses": profile.monthly_expenses,
            "net_monthly": (profile.monthly_income or 0) - (profile.monthly_expenses or 0),
            "total_loans": len(profile.existing_loans or []),
            "total_credit_cards": len(profile.credit_cards or []),
            "total_assets": profile.total_assets,
            "total_liabilities": profile.total_liabilities,
            "net_worth": (profile.total_assets or 0) - (profile.total_liabilities or 0),
            "employment_type": profile.employment_type,
            "employment_tenure_months": profile.employment_tenure_months
        }
