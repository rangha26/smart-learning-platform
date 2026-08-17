# Luồng hoạt động của Trợ lý AI (RAG System) 🤖

Module `ai_chat` là bộ não của Trợ lý ảo AI, được xây dựng theo kiến trúc **Retrieval-Augmented Generation (RAG)**. Nó hoạt động độc lập và bảo mật dữ liệu riêng biệt cho từng Lớp học (`class_id`).

## 1. Luồng Nhúng Tài liệu (Background Embedding Pipeline)

Khi Giáo viên đăng thông báo hoặc bài tập mới có kèm tài liệu (PDF, DOCX, XLSX, PPTX, v.v.), hệ thống sẽ thực hiện các bước sau một cách **âm thầm (Background Tasks)** để không làm chậm API tạo bài:

```mermaid
sequenceDiagram
    actor Teacher as Giáo viên
    participant API as FastAPI (Post Router)
    participant DB as PostgreSQL
    participant Background as FastAPI BackgroundTask
    participant Supabase as Supabase Storage
    participant Gemini as Gemini API (Embedding)
    
    Teacher->>API: 1. Tạo Post + Tải File đính kèm
    API->>Supabase: 2. Upload file
    Supabase-->>API: Trả về public URL
    API->>DB: 3. Lưu thông tin Post & Attachment
    API-->>Teacher: 4. Phản hồi "Tạo bài thành công"
    
    %% Background Task chạy song song
    API-)Background: 5. Kích hoạt embed_post_in_background
    Background->>Background: 6. Trích xuất Text & Chunking
    Background->>Gemini: 7. Gửi các chunks để sinh Vector
    Gemini-->>Background: Trả về Vectors (768 chiều)
    Background->>DB: 8. Lưu vào bảng document_chunks (pgvector)
```

## 2. Luồng Trò chuyện AI (RAG Chat Pipeline)

Khi Học sinh đặt câu hỏi, AI sẽ tìm kiếm các tài liệu liên quan nhất trong Lớp học đó để làm ngữ cảnh trả lời:

```mermaid
sequenceDiagram
    actor Student as Học sinh
    participant API as FastAPI (Chat Router)
    participant VectorDB as PostgreSQL (pgvector)
    participant Gemini as Gemini API (LLM)
    
    Student->>API: 1. Đặt câu hỏi (kèm model tùy chọn)
    API->>Gemini: 2. Nhúng câu hỏi thành Vector
    Gemini-->>API: Trả về Vector câu hỏi
    API->>VectorDB: 3. Tìm kiếm Vector tương đồng nhất (Cosine Distance)
    VectorDB-->>API: Trả về các Document Chunks liên quan
    API->>Gemini: 4. Gửi Prompt = Câu hỏi + Ngữ cảnh (Chunks)
    Gemini-->>API: Trả về câu trả lời tự nhiên
    API-->>Student: 5. Hiển thị câu trả lời
```
