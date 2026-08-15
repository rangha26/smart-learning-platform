# AI Chat (RAG Module)

Module này chịu trách nhiệm cho tính năng Chatbot hỏi đáp (RAG - Retrieval-Augmented Generation) dựa trên dữ liệu văn bản được lưu trữ của nền tảng.

## Cấu trúc thư mục

- `router.py`: Định nghĩa các API endpoints như `/api/v1/chat`, `/api/v1/sync-documents`.
- `schemas.py`: Các Pydantic models dành riêng cho Chatbot (Request/Response).
- `dependencies.py`: Chứa các dependency tiêm vào FastAPI (ví dụ: khởi tạo connection tới Vector DB).
- `services/`:
  - `document_loader.py`: Đảm nhiệm tải file (PDF, TXT, DOCX) từ Supabase Storage và trích xuất thành text thô.
  - `text_splitter.py`: Nhận text thô và chia (chunk) thành các khối văn bản nhỏ hơn (VD: 1000 ký tự) để gửi cho AI.
  - `vector_store.py`: Sử dụng Langchain và `langchain-postgres` để tạo embeddings (từ Google Gemini) và lưu các chunk vào `pgvector` trong PostgreSQL.
  - `llm_service.py`: Nhận câu hỏi từ người dùng, tìm kiếm vector tương đồng từ Database để lấy ngữ cảnh (context) và đưa vào Prompt gửi cho Google Gemini (Google AI Studio) trả lời.

## Yêu cầu cài đặt & Môi trường

Để module này hoạt động, bạn cần cấu hình các bước sau:

### 1. Kích hoạt `pgvector` trong Docker DB
Vì bạn sử dụng Docker DB cho Backend, bạn cần đảm bảo image PostgreSQL đang chạy có hỗ trợ extension `pgvector`.
- Khuyến nghị sử dụng image Docker: `pgvector/pgvector:pg16` thay vì `postgres:16` thông thường.
- Trong Docker (hoặc khi init DB), cần chạy lệnh SQL:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

### 2. Thiết lập API Key của Google AI Studio (Gemini)
Vào Google AI Studio, tạo một API Key và thêm vào file `.env`:
```env
GOOGLE_API_KEY=AIzaSy...
```

### 3. Cài đặt các thư viện cần thiết
Sẽ cần update `requirements.txt` với các thư viện sau:
```text
langchain
langchain-google-genai
langchain-postgres
psycopg[binary]
pdfplumber
```
Chạy `pip install -r requirements.txt` để cài đặt.

### 4. Luồng hoạt động dự kiến
1. **Sync**: Admin hoặc hệ thống gọi API sync -> `document_loader` lấy file -> `text_splitter` chia khối -> `vector_store` đẩy vào PostgreSQL (được vectorize bằng Google Embeddings).
2. **Chat**: User gọi API `/chat` -> `vector_store` query các chunk liên quan -> `llm_service` gửi context + câu hỏi cho Gemini trả về đáp án cuối cùng.
