from datetime import datetime, timedelta
from typing import List, Dict
from app.models.models import UPIMandate

class MandateEngine:
    def generate_execution_schedule(self, mandate: UPIMandate) -> List[Dict]:
        executions = []
        current_date = mandate.start_date

        while current_date <= mandate.end_date:
            executions.append({
                "amount": mandate.amount,
                "scheduled_at": current_date,
                "status": "scheduled"
            })

            if mandate.frequency == "daily":
                current_date += timedelta(days=1)
            elif mandate.frequency == "weekly":
                current_date += timedelta(weeks=1)
            elif mandate.frequency == "monthly":
                current_date = self._add_months(current_date, 1)
            elif mandate.frequency == "quarterly":
                current_date = self._add_months(current_date, 3)
            elif mandate.frequency == "yearly":
                current_date = self._add_months(current_date, 12)
            else:
                current_date += timedelta(days=30)

        return executions

    def _add_months(self, date: datetime, months: int) -> datetime:
        month = date.month - 1 + months
        year = date.year + month // 12
        month = month % 12 + 1
        day = min(date.day, [31, 29 if year % 4 == 0 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
        return datetime(year, month, day, date.hour, date.minute, date.second)

    def validate_mandate(self, mandate: UPIMandate) -> Dict:
        errors = []
        warnings = []

        if mandate.amount <= 0:
            errors.append("Amount must be greater than 0")
        elif mandate.amount > 100000:
            warnings.append("High value mandate - additional verification recommended")

        if mandate.end_date <= mandate.start_date:
            errors.append("End date must be after start date")

        if mandate.start_date < datetime.utcnow() - timedelta(days=1):
            errors.append("Start date cannot be in the past")

        if "@" not in mandate.upi_id:
            errors.append("Invalid UPI ID format")

        if "@" not in mandate.merchant_vpa:
            errors.append("Invalid merchant VPA format")

        return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}

    def calculate_mandate_stats(self, mandate: UPIMandate) -> Dict:
        total_expected = self._calculate_total_executions(mandate)

        return {
            "total_expected_executions": total_expected,
            "completed_executions": mandate.successful_executions,
            "failed_executions": mandate.failed_executions,
            "success_rate": round((mandate.successful_executions / total_expected * 100), 2) if total_expected > 0 else 0,
            "total_amount_processed": mandate.successful_executions * mandate.amount,
            "total_amount_expected": total_expected * mandate.amount,
            "remaining_amount": (total_expected - mandate.successful_executions) * mandate.amount
        }

    def _calculate_total_executions(self, mandate: UPIMandate) -> int:
        delta = mandate.end_date - mandate.start_date

        if mandate.frequency == "daily": return delta.days + 1
        elif mandate.frequency == "weekly": return delta.days // 7 + 1
        elif mandate.frequency == "monthly": return (delta.days // 30) + 1
        elif mandate.frequency == "quarterly": return (delta.days // 90) + 1
        elif mandate.frequency == "yearly": return (delta.days // 365) + 1
        return 0
