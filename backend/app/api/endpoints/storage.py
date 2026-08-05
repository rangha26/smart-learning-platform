import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, HTTPException, Depends, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.all_models import Attachment, User
from app.api.deps import get_current_user
from app.schemas.response import ResponseSchema
from app.core.config import settings

router = APIRouter()

@router.post("/upload", response_model=ResponseSchema[dict])
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    upload_dir = settings.UPLOAD_DIRECTORY
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    file_path = os.path.join(upload_dir, unique_filename)

    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)

        attachment = Attachment(
            file_name=file.filename,
            file_url=f"/uploads/{unique_filename}",
            file_type=file.content_type,
            file_size=len(content)
        )
        db.add(attachment)
        db.commit()
        db.refresh(attachment)

        return {
            "success": True,
            "message": "File uploaded successfully.",
            "data": {
                "attachment_id": attachment.id,
                "file_url": attachment.file_url,
                "file_name": attachment.file_name
            }
        }
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

