"""
Module: background_tasks.py
Mục đích: Chứa các tác vụ chạy ngầm liên quan đến AI Chat (RAG)
"""

import logging
import asyncio
from app.db import SessionLocal
from app.ai_chat.services.document_loader import load_document_text
from app.ai_chat.services.text_splitter import split_text_into_chunks
from app.ai_chat.services.vector_store import save_documents_to_db_async

logger = logging.getLogger(__name__)

async def embed_post_in_background(class_id: int, post_id: int, content: str, file_urls: list[str], file_names: list[str]):
    """
    Task chạy ngầm để nhúng nội dung bài viết và file đính kèm vào pgvector.
    
    Lưu ý: Không nhận 'db: Session' từ tham số request vì session đó sẽ bị đóng 
    khi request trả về. Thay vào đó, ta tạo một SessionLocal mới độc lập.
    """
    db = SessionLocal()
    try:
        chunks_to_save = []
        
        # 1. Nhúng nội dung văn bản của Post
        if content and content.strip():
            text_to_embed = f"## Thông báo / Bài đăng\n{content.strip()}"
            post_chunks = split_text_into_chunks(text_to_embed, chunk_size=1000, chunk_overlap=200)
            chunks_to_save.extend(post_chunks)
            
        # 2. Nhúng nội dung các file đính kèm
        for url, fname in zip(file_urls, file_names):
            try:
                # Tự động tải từ Supabase URL và trích xuất chữ (Truyền fname để nhận dạng đuôi file)
                # Chạy trên thread riêng để tránh block event loop do gọi mạng đồng bộ
                file_text = await asyncio.to_thread(load_document_text, url, file_extension=fname)
                if file_text:
                    file_chunks = split_text_into_chunks(file_text, chunk_size=1000, chunk_overlap=200)
                    chunks_to_save.extend(file_chunks)
            except Exception as e:
                # Bỏ qua file bị lỗi (ví dụ file ảnh, zip...), tiếp tục với file khác
                logger.error(f"Lỗi khi trích xuất text từ file {fname} (Post ID {post_id}): {str(e)}")
                
        # 3. Lưu toàn bộ vào Database (Bất đồng bộ)
        if chunks_to_save:
            await save_documents_to_db_async(
                db=db,
                class_id=class_id,
                source_type="post",
                source_id=post_id,
                chunks=chunks_to_save
            )
            logger.info(f"Background Task: Đã học xong bài đăng {post_id} ({len(chunks_to_save)} chunks).")
    except Exception as e:
        logger.error(f"Background Task: Lỗi toàn cục khi xử lý embed bài đăng {post_id}: {str(e)}")
    finally:
        db.close()
