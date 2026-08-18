"""
Test vector_store.py: luu chunk vao pgvector va tim kiem co phan lap theo class_id.

MOCK loi goi Gemini embedding (khong goi API that, khong ton phi) - chi kiem
tra phan luu/truy van SQLAlchemy + pgvector, vi day la phan code tu viet va
co the co bug; ban than API Gemini khong can test lai o day.

Yeu cau moi truong: DB dev that (Postgres + extension pgvector) da migrate + seed.
"""
import pytest
from langchain_core.documents import Document

from app.ai_chat.services import vector_store
from app.models import DocumentChunk

FAKE_VECTOR = [0.01] * 768


async def _fake_embed_texts_async(texts):
    return [FAKE_VECTOR for _ in texts]


@pytest.fixture
def patched_embeddings(monkeypatch):
    monkeypatch.setattr(vector_store, "embed_texts_async", _fake_embed_texts_async)


async def test_save_creates_document_chunk_with_correct_class_id(db_session, class1_id, patched_embeddings):
    await vector_store.save_documents_to_db_async(
        db=db_session,
        class_id=class1_id,
        source_type="test",
        source_id=999001,
        chunks=[Document(page_content="Noi dung rieng cua lop Python.", metadata={"Header 1": "Chuong 1"})],
    )
    try:
        saved = (
            db_session.query(DocumentChunk)
            .filter(DocumentChunk.source_id == 999001, DocumentChunk.source_type == "test")
            .all()
        )
        assert len(saved) == 1
        assert saved[0].class_id == class1_id
        assert saved[0].content == "Noi dung rieng cua lop Python."
        assert saved[0].metadata_json == {"Header 1": "Chuong 1"}
    finally:
        db_session.query(DocumentChunk).filter(DocumentChunk.source_id == 999001).delete()
        db_session.commit()


async def test_save_with_no_chunks_is_a_no_op(db_session, class1_id, patched_embeddings):
    # Khong duoc raise loi, va khong duoc tao ban ghi nao.
    await vector_store.save_documents_to_db_async(
        db=db_session, class_id=class1_id, source_type="test", source_id=999002, chunks=[],
    )
    saved = db_session.query(DocumentChunk).filter(DocumentChunk.source_id == 999002).all()
    assert saved == []


async def test_search_is_scoped_to_class_id_and_does_not_leak_across_classes(
    db_session, class1_id, class2_id, patched_embeddings
):
    """
    Quan trong: DocumentChunk cua lop nay khong duoc lo sang ket qua tim kiem
    cua lop khac - day chinh la co che phan lap du lieu duy nhat cho pgvector
    (khac voi cac bang khac, KHONG co endpoint nao check quyen o tang truy van
    vector, nen bug o day = ro ri du lieu giua cac lop).
    """
    await vector_store.save_documents_to_db_async(
        db=db_session,
        class_id=class1_id,
        source_type="test",
        source_id=999003,
        chunks=[Document(page_content="Bi mat chi danh cho lop Python.", metadata={})],
    )
    try:
        results_in_class1 = await vector_store.search_similar_chunks_async(
            db=db_session, class_id=class1_id, query="python", top_k=10,
        )
        results_in_class2 = await vector_store.search_similar_chunks_async(
            db=db_session, class_id=class2_id, query="python", top_k=10,
        )

        assert any(c.source_id == 999003 for c in results_in_class1)
        assert all(c.source_id != 999003 for c in results_in_class2)
    finally:
        db_session.query(DocumentChunk).filter(DocumentChunk.source_id == 999003).delete()
        db_session.commit()
