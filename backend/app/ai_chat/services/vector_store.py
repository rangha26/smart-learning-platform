"""
Module: vector_store.py
Mục đích: Khởi tạo mô hình Google Embeddings và cung cấp các hàm lưu/tìm kiếm Vector 
          trực tiếp trên CSDL PostgreSQL bằng SQLAlchemy (tối ưu bảo mật phân mảnh theo class_id).
"""

from sqlalchemy.orm import Session
from sqlalchemy import select
from langchain_core.documents import Document

import asyncio
from google import genai
from app.models import DocumentChunk
from app.core.config import settings

def get_genai_client() -> genai.Client:
    """
    Khởi tạo client native của google-genai SDK.
    """
    return genai.Client(api_key=settings.GOOGLE_API_KEY)

from google.genai import types

async def embed_texts_async(texts: list[str]) -> list[list[float]]:
    """
    Gọi API để biến danh sách văn bản thành danh sách Vector (Async).
    Sử dụng model gemini-embedding-2.
    """
    client = get_genai_client()
    
    # Giới hạn số lượng request đồng thời để tránh rate limit
    semaphore = asyncio.Semaphore(10)
    
    async def embed_single(text: str):
        async with semaphore:
            response = await client.aio.models.embed_content(
                model="gemini-embedding-2",
                contents=text,
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            return response.embeddings[0].values

    vectors = await asyncio.gather(*(embed_single(text) for text in texts))
    return list(vectors)

async def save_documents_to_db_async(
    db: Session,
    class_id: int,
    source_type: str,
    source_id: int,
    chunks: list[Document]
):
    """
    Lưu một danh sách các chunk vào Database.
    Hàm này gọi API để nhúng (embed) toàn bộ nội dung của các chunk (Async), sau đó Insert vào PostgreSQL.
    """
    if not chunks:
        return
        
    # 1. Trích xuất text thô từ các chunk
    texts = [chunk.page_content for chunk in chunks]
    
    # 2. Gọi Google API để tạo Vector hàng loạt (batching) bất đồng bộ
    vectors = await embed_texts_async(texts)
    
    # 3. Tạo list các SQLAlchemy objects
    db_chunks = []
    for chunk, vector in zip(chunks, vectors):
        db_chunks.append(
            DocumentChunk(
                class_id=class_id,
                source_type=source_type,
                source_id=source_id,
                content=chunk.page_content,
                embedding=vector,
                metadata_json=chunk.metadata
            )
        )
        
    # 4. Lưu vào DB thông qua thread pool để không block event loop
    def _save_to_db():
        db.add_all(db_chunks)
        db.commit()
        
    await asyncio.to_thread(_save_to_db)

async def search_similar_chunks_async(
    db: Session,
    class_id: int,
    query: str,
    top_k: int = 5
) -> list[DocumentChunk]:
    """
    Tìm kiếm các chunk liên quan nhất với câu hỏi (query) trong phạm vi của một lớp học cụ thể (Async).
    """
    # Biến câu hỏi thành Vector bất đồng bộ
    query_vector = (await embed_texts_async([query]))[0]
    
    def _search_db():
        # Sử dụng toán tử khoảng cách cosine <=> của pgvector thông qua SQLAlchemy
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.class_id == class_id)
            .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
            .limit(top_k)
        )
        return list(db.scalars(stmt).all())
        
    return await asyncio.to_thread(_search_db)
