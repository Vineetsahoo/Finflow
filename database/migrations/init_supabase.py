import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../backend"))

def init_database():
    from kyc_service.app.database import Base as KYCBase, engine as KYCEngine
    from kyc_service.app.models.models import KYCDocument, FaceVerification

    from credit_score_service.app.database import Base as CreditBase, engine as CreditEngine
    from credit_score_service.app.models.models import FinancialProfile, CreditScore, CreditReport

    from upi_mandate_service.app.database import Base as UPIBase, engine as UPIEngine
    from upi_mandate_service.app.models.models import UPIMandate, MandateExecution, PreDebitNotification, RetryQueue

    print("Creating KYC tables...")
    KYCBase.metadata.create_all(bind=KYCEngine)

    print("Creating Credit Score tables...")
    CreditBase.metadata.create_all(bind=CreditEngine)

    print("Creating UPI Mandate tables...")
    UPIBase.metadata.create_all(bind=UPIEngine)

    print("All tables created successfully in Supabase!")

if __name__ == "__main__":
    init_database()
