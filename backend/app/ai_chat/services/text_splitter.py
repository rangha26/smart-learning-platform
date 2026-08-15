"""
Module: text_splitter.py
Mục đích: Chia nhỏ (chunking) văn bản thô thành các mẩu dữ liệu nhỏ gọn để đưa vào Vector Database.
Sử dụng chiến lược cắt 2 bước của LangChain:
1. MarkdownHeaderTextSplitter: Nhận diện cấu trúc văn bản (trang, slide, chương) qua thẻ '#'
2. RecursiveCharacterTextSplitter: Cắt nhỏ các đoạn văn bản quá dài theo giới hạn ký tự.
"""

from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_core.documents import Document

def split_text_into_chunks(
    text: str, 
    chunk_size: int = 1000, 
    chunk_overlap: int = 200
) -> list[Document]:
    """
    Nhận chuỗi văn bản (đã được định dạng Markdown từ document_loader) và cắt thành các chunk.
    Trả về danh sách các object Document của LangChain.
    """
    # 1. Cắt theo thẻ Markdown (Tiêu đề, Trang, Slide)
    # Lắng nghe các cấp độ Header từ h1 đến h3
    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ]
    markdown_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on, 
        strip_headers=False # Giữ lại header trong nội dung chunk
    )
    
    # Bước này tạo ra các chunk lớn theo cấu trúc (VD: mỗi chunk là 1 trang hoặc 1 mục)
    # Cấu trúc metadata sẽ tự động có thêm: {"Header 1": "...", "Header 2": "Trang 5"}
    md_header_splits = markdown_splitter.split_text(text)
    
    # Nếu văn bản không có bất kỳ thẻ # nào, md_header_splits sẽ trả về 1 chunk duy nhất.
    if not md_header_splits:
        md_header_splits = [Document(page_content=text)]

    # 2. Cắt theo giới hạn ký tự (Trường hợp 1 trang hoặc 1 mục quá dài)
    # Nó sẽ cố gắng cắt ở các dấu ngắt câu, xuống dòng, dấu cách...
    recursive_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ".", "?", "!", " ", ""]
    )
    
    # Cắt nhỏ các chunk lớn từ bước 1
    final_chunks = recursive_splitter.split_documents(md_header_splits)
    
    return final_chunks

# ==========================================
# KHU VỰC TEST (Chỉ chạy khi gọi trực tiếp file này)
# ==========================================
if __name__ == "__main__":
    sample_text = """# Giới thiệu
Đây là khóa học Phát triển Hệ thống Thương mại Điện tử.
## Trang 1
Nội dung của trang số 1 rất dài... """ * 50 + """
## Trang 2
Và đây là nội dung trang số 2.
"""
    
    print("--- Test Text Splitter ---")
    chunks = split_text_into_chunks(sample_text, chunk_size=500, chunk_overlap=50)
    
    print(f"Tổng số chunk tạo ra: {len(chunks)}")
    for i, chunk in enumerate(chunks[:3]):
        print(f"\n[Chunk {i+1}] Metadata: {chunk.metadata}")
        print(f"Độ dài: {len(chunk.page_content)} ký tự")
        print(f"Preview: {chunk.page_content[:150]}...")
