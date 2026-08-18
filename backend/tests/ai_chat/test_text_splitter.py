"""Test thuần logic cho text_splitter.py — không cần DB, không cần API key."""
from app.ai_chat.services.text_splitter import split_text_into_chunks


def test_splits_by_markdown_headers_and_keeps_header_metadata():
    text = "# Chuong 1\nNoi dung chuong 1.\n## Trang 1\nChi tiet trang 1."
    chunks = split_text_into_chunks(text, chunk_size=1000, chunk_overlap=0)

    assert len(chunks) >= 1
    assert any("Header 1" in c.metadata for c in chunks)


def test_falls_back_to_single_chunk_without_headers():
    text = "Khong co the header nao o day, chi la mot doan van ban binh thuong."
    chunks = split_text_into_chunks(text, chunk_size=1000, chunk_overlap=0)

    assert len(chunks) == 1
    assert chunks[0].page_content.strip() == text


def test_respects_chunk_size_for_long_text():
    long_text = "# Bai hoc\n" + ("Cau van dai lap lai nhieu lan de vuot qua gioi han chunk. " * 100)
    chunks = split_text_into_chunks(long_text, chunk_size=300, chunk_overlap=30)

    assert len(chunks) > 1
    # cho phep sai so nho vi splitter uu tien cat o ranh gioi cau/tu thay vi cat cung
    assert all(len(c.page_content) <= 300 + 60 for c in chunks)


def test_empty_text_does_not_crash():
    chunks = split_text_into_chunks("", chunk_size=500, chunk_overlap=50)
    assert isinstance(chunks, list)
