import math
from typing import Dict, List
from app.models.models import FinancialProfile

class CreditScoreEngine:
    def __init__(self):
        self.max_score = 900
        self.min_score = 300
        self.weights = {
            "payment_history": 0.35,
            "credit_utilization": 0.30,
            "credit_history": 0.15,
            "credit_mix": 0.10,
            "new_credit": 0.10
        }

    def compute_score(self, profile: FinancialProfile) -> Dict:
        payment_history = self._calculate_payment_history(profile)
        credit_utilization = self._calculate_credit_utilization(profile)
        credit_history = self._calculate_credit_history(profile)
        credit_mix = self._calculate_credit_mix(profile)
        new_credit = self._calculate_new_credit(profile)

        composite = (
            payment_history * self.weights["payment_history"] +
            credit_utilization * self.weights["credit_utilization"] +
            credit_history * self.weights["credit_history"] +
            credit_mix * self.weights["credit_mix"] +
            new_credit * self.weights["new_credit"]
        )

        final_score = int(self.min_score + (composite / 100) * (self.max_score - self.min_score))
        final_score = max(self.min_score, min(self.max_score, final_score))

        rating = self._get_rating(final_score)

        return {
            "score": final_score,
            "rating": rating,
            "breakdown": {
                "payment_history": round(payment_history, 1),
                "credit_utilization": round(credit_utilization, 1),
                "credit_history": round(credit_history, 1),
                "credit_mix": round(credit_mix, 1),
                "new_credit": round(new_credit, 1)
            },
            "recommendations": self._generate_recommendations(
                payment_history, credit_utilization, credit_history, credit_mix, new_credit, profile
            ),
            "risk_factors": self._identify_risks(profile, final_score)
        }

    def _calculate_payment_history(self, profile: FinancialProfile) -> float:
        income = profile.monthly_income or 1
        expenses = profile.monthly_expenses or 0
        total_emi = sum(loan.get("emi", 0) for loan in (profile.existing_loans or []))
        dti_ratio = (total_emi + expenses) / income if income > 0 else 1

        if dti_ratio <= 0.2: return 95
        elif dti_ratio <= 0.3: return 85
        elif dti_ratio <= 0.4: return 70
        elif dti_ratio <= 0.5: return 55
        else: return max(20, 100 - int(dti_ratio * 100))

    def _calculate_credit_utilization(self, profile: FinancialProfile) -> float:
        cards = profile.credit_cards or []
        if not cards: return 70

        total_limit = sum(card.get("limit", 0) for card in cards)
        total_outstanding = sum(card.get("outstanding", 0) for card in cards)

        if total_limit == 0: return 70

        utilization = total_outstanding / total_limit
        if utilization <= 0.1: return 95
        elif utilization <= 0.3: return 85
        elif utilization <= 0.5: return 70
        elif utilization <= 0.7: return 50
        else: return max(20, 100 - int(utilization * 100))

    def _calculate_credit_history(self, profile: FinancialProfile) -> float:
        tenure = profile.employment_tenure_months or 0
        loans = profile.existing_loans or []
        employment_score = min(50, tenure / 6)
        loan_history = len(loans) * 10
        return min(100, employment_score + loan_history + 30)

    def _calculate_credit_mix(self, profile: FinancialProfile) -> float:
        loans = profile.existing_loans or []
        cards = profile.credit_cards or []
        types = set()
        for loan in loans:
            types.add(loan.get("type", "personal"))
        if cards: types.add("credit_card")

        if len(types) >= 3: return 95
        elif len(types) == 2: return 80
        elif len(types) == 1: return 60
        return 50

    def _calculate_new_credit(self, profile: FinancialProfile) -> float:
        loans = profile.existing_loans or []
        if len(loans) <= 1: return 90
        elif len(loans) <= 2: return 75
        elif len(loans) <= 3: return 60
        else: return max(30, 100 - len(loans) * 15)

    def _get_rating(self, score: int) -> str:
        if score >= 750: return "excellent"
        elif score >= 650: return "good"
        elif score >= 550: return "fair"
        elif score >= 400: return "poor"
        return "bad"

    def _generate_recommendations(self, ph, cu, ch, cm, nc, profile) -> List[str]:
        recs = []
        if ph < 70: recs.append("Reduce your debt-to-income ratio by paying off existing loans faster")
        if cu < 70: recs.append("Keep credit card utilization below 30% of your total limit")
        if ch < 60: recs.append("Maintain stable employment to build longer credit history")
        if cm < 70: recs.append("Diversify your credit mix with different types of loans")
        if nc < 70: recs.append("Limit new credit applications to avoid hard inquiries")
        if not recs: recs.append("Your credit profile is strong. Continue maintaining good financial habits")
        return recs

    def _identify_risks(self, profile: FinancialProfile, score: int) -> List[str]:
        risks = []
        income = profile.monthly_income or 1
        total_emi = sum(loan.get("emi", 0) for loan in (profile.existing_loans or []))
        if total_emi / income > 0.5: risks.append("High debt-to-income ratio")

        cards = profile.credit_cards or []
        total_limit = sum(c.get("limit", 0) for c in cards)
        total_outstanding = sum(c.get("outstanding", 0) for c in cards)
        if total_limit > 0 and total_outstanding / total_limit > 0.8:
            risks.append("High credit card utilization")

        if score < 500: risks.append("Overall low credit score indicates high default risk")
        return risks
