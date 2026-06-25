from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import shutil
import os
from app.database import get_db
from app.models.models import KYCDocument
from app.services.ocr_service import OCRService
from app.services.storage_service import LocalStorageService

router = APIRouter()
ocr_service = OCRService()
storage_service = LocalStorageService()

@router.post("/upload")
async def upload_document(
    user_id: str = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_id = str(uuid.uuid4())
    file_extension = file.filename.split(".")[-1]
    relative_path = f"kyc-documents/{user_id}/{document_type}/{file_id}.{file_extension}"

    temp_path = f"/tmp/{file_id}.{file_extension}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_path = storage_service.upload_file(temp_path, relative_path)
    os.remove(temp_path)

    doc = KYCDocument(
        user_id=user_id,
        document_type=document_type,
        file_path=file_path,
        file_name=file.filename,
        verification_status="uploaded"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "success": True,
        "document_id": doc.id,
        "file_path": file_path,
        "message": "Document uploaded successfully"
    }

@router.post("/{document_id}/ocr")
async def extract_ocr(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(KYCDocument).filter(KYCDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    temp_path = f"/tmp/ocr_{document_id}.png"
    storage_service.download_file(doc.file_path, temp_path)

    ocr_result = ocr_service.extract_text(temp_path, doc.document_type)

    doc.ocr_extracted_data = ocr_result["extracted_data"]
    doc.ocr_confidence = ocr_result["confidence"]
    doc.document_number = ocr_result["extracted_data"].get("document_number")
    doc.verification_status = "ocr_completed"
    db.commit()

    if os.path.exists(temp_path):
        os.remove(temp_path)

    return {
        "success": True,
        "document_id": document_id,
        "ocr_data": ocr_result["extracted_data"],
        "confidence": ocr_result["confidence"]
    }

@router.get("/user/{user_id}")
async def get_user_documents(user_id: str, db: Session = Depends(get_db)):
    docs = db.query(KYCDocument).filter(KYCDocument.user_id == user_id).all()
    return {"documents": [{"id": d.id, "type": d.document_type, "status": d.verification_status, "file": d.file_name} for d in docs]}

@router.get("/{document_id}")
async def get_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(KYCDocument).filter(KYCDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": doc.id,
        "user_id": doc.user_id,
        "document_type": doc.document_type,
        "document_number": doc.document_number,
        "file_name": doc.file_name,
        "verification_status": doc.verification_status,
        "ocr_data": doc.ocr_extracted_data,
        "created_at": doc.created_at
    }
