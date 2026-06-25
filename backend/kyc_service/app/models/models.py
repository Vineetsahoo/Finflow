from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float, JSON
from sqlalchemy.sql import func
from app.database import Base

class KYCDocument(Base):
    __tablename__ = "kyc_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    document_type = Column(String(50), nullable=False)
    document_number = Column(String(100))
    file_path = Column(Text, nullable=False)
    file_name = Column(String(255))
    ocr_extracted_data = Column(JSON)
    ocr_confidence = Column(Float)
    verification_status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class FaceVerification(Base):
    __tablename__ = "face_verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    document_photo_path = Column(Text, nullable=False)
    selfie_photo_path = Column(Text, nullable=False)
    match_score = Column(Float)
    is_match = Column(Boolean, default=False)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
