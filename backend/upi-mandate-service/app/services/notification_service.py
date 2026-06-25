from datetime import datetime
from typing import Dict
from app.models.models import UPIMandate, PreDebitNotification

class NotificationService:
    def __init__(self):
        self.templates = {
            "sms": "UPI Mandate Alert: Rs.{amount} will be debited from your account {upi_id} on {date} for {merchant}.",
            "email": "Dear Customer,\n\nThis is a pre-debit notification for your UPI mandate.\n\nMandate Details:\n- Amount: Rs.{amount}\n- Debit Date: {date}\n- Merchant: {merchant}\n- UPI ID: {upi_id}\n- Mandate Type: {type}\n\nRegards,\nFinFlow Platform",
            "push": "Upcoming debit: Rs.{amount} on {date} for {merchant}",
            "whatsapp": "UPI Mandate Reminder\n\nAmount: Rs.{amount}\nDate: {date}\nMerchant: {merchant}\n\nPlease ensure sufficient balance."
        }

    def generate_notification_message(self, mandate: UPIMandate, debit_date: datetime, notification_type: str = "sms") -> str:
        template = self.templates.get(notification_type, self.templates["sms"])

        return template.format(
            amount=mandate.amount,
            date=debit_date.strftime("%d %b %Y"),
            merchant=mandate.merchant_name,
            upi_id=mandate.upi_id,
            type=mandate.mandate_type.replace("_", " ").title()
        )

    def send_notification(self, notification: PreDebitNotification) -> str:
        return "delivered"

    def get_notification_stats(self, notifications: list) -> Dict:
        total = len(notifications)
        delivered = sum(1 for n in notifications if n.delivery_status == "delivered")
        pending = sum(1 for n in notifications if n.status == "pending")
        acknowledged = sum(1 for n in notifications if n.user_acknowledged)

        return {
            "total": total,
            "delivered": delivered,
            "pending": pending,
            "acknowledged": acknowledged,
            "delivery_rate": round((delivered / total * 100), 2) if total > 0 else 0,
            "acknowledgment_rate": round((acknowledged / total * 100), 2) if total > 0 else 0
        }
