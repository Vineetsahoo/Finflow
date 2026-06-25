from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import KYCDocument, FaceVerification

router = APIRouter()

@router.get("/status/{user_id}")
async def get_verification_status(user_id: str, db: Session = Depends(get_db)):
    documents = db.query(KYCDocument).filter(KYCDocument.user_id == user_id).all()
    face_verifications = db.query(FaceVerification).filter(FaceVerification.user_id == user_id).all()

    doc_status = "not_started"
    if documents:
        doc_status = "in_progress"
        if all(d.verification_status in ["verified", "ocr_completed"] for d in documents):
            doc_status = "completed"

    face_status = "not_started"
    if face_verifications:
        face_status = "completed" if any(v.is_match for v in face_verifications) else "failed"

    overall_status = "pending"
    if doc_status == "completed" and face_status == "completed":
        overall_status = "verified"
    elif face_status == "failed":
        overall_status = "rejected"

    return {
        "user_id": user_id,
        "overall_status": overall_status,
        "document_status": doc_status,
        "face_status": face_status,
        "documents_count": len(documents),
        "face_verifications_count": len(face_verifications),
        "details": {
            "documents": [{"id": d.id, "type": d.document_type, "status": d.verification_status} for d in documents],
            "face_matches": [{"id": v.id, "is_match": v.is_match, "score": v.match_score} for v in face_verifications]
        }
    }

@router.post("/approve/{document_id}")
async def approve_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(KYCDocument).filter(KYCDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.verification_status = "verified"
    db.commit()
    return {"success": True, "message": "Document approved"}

@router.post("/reject/{document_id}")
async def reject_document(document_id: int, reason: str, db: Session = Depends(get_db)):
    doc = db.query(KYCDocument).filter(KYCDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.verification_status = "failed"
    db.commit()
    return {"success": True, "message": f"Document rejected: {reason}"}
