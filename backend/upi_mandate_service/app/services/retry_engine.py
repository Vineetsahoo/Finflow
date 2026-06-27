import random
from datetime import datetime, timedelta, timezone
from typing import Dict
from app.models.models import MandateExecution, UPIMandate, RetryQueue


def _utcnow() -> datetime:
    """Timezone-aware UTC now — prevents naive/aware comparison errors."""
    return datetime.now(timezone.utc)

class RetryEngine:
    def __init__(self):
        self.backoff_multipliers = [1, 2, 4]
        self.max_backoff_minutes = 120

    def execute_retry(self, execution: MandateExecution, mandate: UPIMandate) -> Dict:
        success = self._simulate_upi_transaction(execution, mandate)

        if success:
            return {
                "status": "success",
                "message": "Transaction completed successfully",
                "transaction_id": f"TXN{random.randint(1000000000, 9999999999)}",
                "npci_txn_id": f"NPCI{random.randint(1000000000, 9999999999)}"
            }
        else:
            attempt = execution.retry_attempt + 1
            if attempt < len(self.backoff_multipliers):
                backoff = 30 * self.backoff_multipliers[attempt]
            else:
                backoff = self.max_backoff_minutes

            next_retry = _utcnow() + timedelta(minutes=backoff)

            return {
                "status": "failed",
                "message": f"Transaction failed. Will retry at {next_retry.isoformat()}",
                "next_retry_at": next_retry,
                "error_code": "UPI_001",
                "failure_reason": "Insufficient funds or network timeout"
            }

    def _simulate_upi_transaction(self, execution: MandateExecution, mandate: UPIMandate) -> bool:
        return random.random() < 0.8

    def create_retry_entry(self, execution: MandateExecution, mandate: UPIMandate) -> Dict:
        attempt = execution.retry_attempt + 1

        if attempt >= mandate.max_retries:
            return {"created": False, "reason": "Max retries reached"}

        if attempt < len(self.backoff_multipliers):
            backoff = 30 * self.backoff_multipliers[attempt]
        else:
            backoff = self.max_backoff_minutes

        scheduled_at = _utcnow() + timedelta(minutes=backoff)

        return {
            "created": True,
            "attempt_number": attempt,
            "scheduled_at": scheduled_at,
            "backoff_minutes": backoff
        }

    def get_retry_config(self, mandate: UPIMandate) -> Dict:
        return {
            "max_retries": mandate.max_retries,
            "current_retries": mandate.retry_count,
            "backoff_strategy": "exponential",
            "backoff_intervals": [30, 60, 120],
            "retry_window_hours": 24
        }
