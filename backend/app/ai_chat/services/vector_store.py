"""
Module: vector_store.py
Mục đích: Khởi tạo mô hình Google Embeddings và cung cấp các hàm lưu/tìm kiếm Vector 
          trực tiếp trên CSDL PostgreSQL bằng SQLAlchemy (tối ưu bảo mật phân mảnh theo class_id).
"""

import os
from sqlalchemy.orm import Session
from sqlalchemy import select
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document

from app.models import DocumentChunk
from app.core.config import settings

def get_embeddings_model() -> GoogleGenerativeAIEmbeddings:
    """
    Khởi tạo mô hình sinh vector của Google Gemini.
    Sử dụng model models/embedding-001 theo yêu cầu, truyền trực tiếp API Key từ settings.
    """
    return GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=settings.GOOGLE_API_KEY
    )

def save_documents_to_db(
    db: Session,
    class_id: int,
    source_type: str,
    source_id: int,
    chunks: list[Document]
):
    """
    Lưu một danh sách các chunk vào Database.
    Hàm này gọi API để nhúng (embed) toàn bộ nội dung của các chunk, sau đó Insert vào PostgreSQL.
    """
    if not chunks:
        return
        
    embeddings_model = get_embeddings_model()
    
    # 1. Trích xuất text thô từ các chunk
    texts = [chunk.page_content for chunk in chunks]
    
    # 2. Gọi Google API để tạo Vector hàng loạt (batching)
    vectors = embeddings_model.embed_documents(texts)
    
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
        
    # 4. Lưu vào DB
    db.add_all(db_chunks)
    db.commit()

def search_similar_chunks(
    db: Session,
    class_id: int,
    query: str,
    top_k: int = 5
) -> list[DocumentChunk]:
    """
    Tìm kiếm các chunk liên quan nhất với câu hỏi (query) trong phạm vi của một lớp học cụ thể.
    """
    embeddings_model = get_embeddings_model()
    
    # Biến câu hỏi thành Vector
    query_vector = embeddings_model.embed_query(query)
    
    # Sử dụng toán tử khoảng cách cosine <=> của pgvector thông qua SQLAlchemy
    stmt = (
        select(DocumentChunk)
        .where(DocumentChunk.class_id == class_id)
        .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
        .limit(top_k)
    )
    
    results = db.scalars(stmt).all()
    return list(results)
