"""
Module: router.py
Mục đích: Định nghĩa các API Endpoints cho tính năng AI Chat (RAG).
"""

import logging

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.classes.router import _ensure_can_view_class, _get_class_or_404
from app.db import get_db
from app.models import User
from app.posts.router import _ensure_can_post
from app.core.supabase import upload_file_to_supabase
from app.ai_chat.services.document_loader import load_document_text
from app.ai_chat.services.text_splitter import split_text_into_chunks
from app.ai_chat.services.vector_store import save_documents_to_db_async
from app.ai_chat.services.llm_service import generate_rag_response_async
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/classes", tags=["AI Chat"])

from typing import Optional
from enum import Enum

class LLMModelEnum(str, Enum):
    gemini_3_6_flash = "Gemini 3.6 Flash"
    gemini_3_5_flash_lite = "Gemini 3.5 Flash Lite"
    gemini_2_5_flash_lite = "Gemini 2.5 Flash Lite"
    gemini_3_1_flash_lite = "Gemini 3.1 Flash Lite"
    gemini_3_5_flash = "Gemini 3.5 Flash"
    gemini_3_7_flash = "Gemini 3.7 Flash"

class ChatMessageRequest(BaseModel):
    message: str
    model: Optional[LLMModelEnum] = LLMModelEnum.gemini_3_5_flash_lite

@router.post("/{class_id}/ai-chat/documents")
async def upload_document_for_ai(
    class_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    API để tải giáo trình/tài liệu lên cho AI học.
    1. Upload file lên Supabase Storage.
    2. Trích xuất text từ URL của Supabase.
    3. Cắt (Chunking) văn bản.
    4. Nhúng (Embed) và lưu vào Vector Database.

    Chỉ giảng viên phụ trách lớp (hoặc admin) mới được nạp tài liệu vào
    knowledge base chung của lớp - cùng quy tắc với việc đăng bài.
    """
    class_ = _get_class_or_404(db, class_id)
    _ensure_can_view_class(db, class_, current_user)
    _ensure_can_post(class_, current_user)

    try:
        # 1. Upload file lên Supabase để lấy public URL
        file_url = await upload_file_to_supabase(file, folder="ai_documents")

        # 2. Tải file từ Supabase về temp local để đọc Text
        # load_document_text tự động nhận diện URL và tải về, sau đó trích xuất chữ (chạy trong thread)
        raw_text = await asyncio.to_thread(load_document_text, file_url, file_extension=file.filename)

        if not raw_text:
            raise HTTPException(status_code=400, detail="Không thể trích xuất chữ từ file này.")

        # 3. Cắt nhỏ văn bản (Chunking)
        chunks = split_text_into_chunks(raw_text, chunk_size=1000, chunk_overlap=200)

        # 4. Sinh Embeddings và Lưu vào pgvector (Bất đồng bộ)
        await save_documents_to_db_async(
            db=db,
            class_id=class_id,
            source_type="supabase_url",
            source_id=0,
            chunks=chunks
        )

        return {
            "message": "Tài liệu đã được AI học thành công!",
            "file_url": file_url,
            "chunks_processed": len(chunks)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Loi khi nap tai lieu AI cho lop {class_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Không thể xử lý tài liệu. Vui lòng thử lại.")


@router.post("/{class_id}/ai-chat/message")
async def chat_with_ai(
    class_id: int,
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    API để trò chuyện với AI của lớp học.
    AI sẽ tìm kiếm ngữ cảnh dựa vào class_id và trả lời câu hỏi.

    Bất kỳ ai xem được lớp (giảng viên, học viên đã tham gia, admin) đều
    được chat - cùng quy tắc với việc xem bảng tin của lớp.
    """
    class_ = _get_class_or_404(db, class_id)
    _ensure_can_view_class(db, class_, current_user)

    try:
        answer = await generate_rag_response_async(
            db=db,
            class_id=class_id,
            user_query=request.message,
            model_name=request.model
        )
        return {
            "answer": answer
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Loi khi chat AI cho lop {class_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Không thể trả lời lúc này. Vui lòng thử lại.")
