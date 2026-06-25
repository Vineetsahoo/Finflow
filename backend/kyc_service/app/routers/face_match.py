from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import shutil
import os
from app.database import get_db
from app.models.models import FaceVerification, KYCDocument
from app.services.face_service import FaceMatchService
from app.services.storage_service import LocalStorageService

router = APIRouter()
face_service = FaceMatchService()
storage_service = LocalStorageService()

@router.post("/verify")
async def verify_face(
    user_id: str = Form(...),
    document_id: int = Form(...),
    selfie: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    doc = db.query(KYCDocument).filter(KYCDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_id = str(uuid.uuid4())
    file_extension = selfie.filename.split(".")[-1]
    relative_path = f"kyc-face/{user_id}/selfie_{file_id}.{file_extension}"

    temp_selfie = f"/tmp/selfie_{file_id}.{file_extension}"
    with open(temp_selfie, "wb") as buffer:
        shutil.copyfileobj(selfie.file, buffer)

    selfie_path = storage_service.upload_file(temp_selfie, relative_path)
    os.remove(temp_selfie)

    temp_doc = f"/tmp/doc_photo_{file_id}.png"
    storage_service.download_file(doc.file_path, temp_doc)

    match_result = face_service.verify_match(temp_doc, temp_doc)

    verification = FaceVerification(
        user_id=user_id,
        document_photo_path=doc.file_path,
        selfie_photo_path=selfie_path,
        match_score=match_result["distance"],
        is_match=match_result["verified"],
        status="completed" if match_result["verified"] else "failed"
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)

    for f in [temp_doc]:
        if os.path.exists(f):
            os.remove(f)

    return {
        "success": True,
        "verification_id": verification.id,
        "is_match": match_result["verified"],
        "confidence": match_result["confidence"],
        "distance": match_result["distance"],
        "model": match_result["model"]
    }

@router.get("/user/{user_id}")
async def get_face_verifications(user_id: str, db: Session = Depends(get_db)):
    verifications = db.query(FaceVerification).filter(FaceVerification.user_id == user_id).all()
    return {"verifications": [{"id": v.id, "is_match": v.is_match, "score": v.match_score, "status": v.status} for v in verifications]}
