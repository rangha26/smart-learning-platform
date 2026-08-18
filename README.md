# Smart Learning Platform 🎓

Hệ thống Quản lý Học tập Trực tuyến (Smart Learning Platform) tích hợp Trợ lý ảo AI (RAG) giúp học sinh tra cứu bài giảng và tương tác thông minh.

## 🛠️ Công nghệ sử dụng

- **Frontend**: React + Vite.
- **Backend**: FastAPI (Python) + Background Tasks.
- **Database**: PostgreSQL 16 (tích hợp extension `pgvector` để lưu trữ Vector).
- **Cache**: Redis.
- **Trợ lý AI**: Google Gemini (`google-genai` SDK) với model `gemini-embedding-2`.
- **Lưu trữ Tệp**: Supabase Storage.
- **Containerization**: Docker & Docker Compose.

---

## 🚀 Hướng dẫn Khởi chạy Toàn bộ Dự án

Dự án được cấu hình sẵn để khởi chạy cực kỳ đơn giản thông qua `npm` và `docker-compose`.

### Bước 1: Thiết lập biến môi trường
Tạo file `.env` từ `.env.example` tại thư mục gốc:
```bash
cp .env.example .env
```
👉 *Lưu ý: Bạn cần điền đầy đủ `GOOGLE_API_KEY` và thông tin `SUPABASE` vào file `.env` để tính năng AI và Upload File hoạt động.*

### Bước 2: Khởi chạy dự án (1-Click)
Tại thư mục gốc, dự án đã được cài sẵn các lệnh trong `package.json`. Hãy chạy:
```bash
npm run start
```
Lệnh này sẽ tự động:
1. Tải và build các Docker Image (`db`, `redis`, `backend`, `frontend`).
2. Khởi chạy Database PostgreSQL với `pgvector/pgvector:pg16`.
3. Tự động chạy Alembic Migration tạo bảng và nạp dữ liệu mẫu (Seed).
4. Mở Backend API tại `http://localhost:8000`.
5. Mở Website Frontend tại `http://localhost:5173`.

### Các lệnh quản lý tiện ích khác (`npm run`)

- `npm run start`: Build và khởi động toàn bộ dự án bằng Docker.
- `npm run stop`: Dừng và tắt toàn bộ các container.
- `npm run logs`: Xem màn hình log thời gian thực của toàn bộ hệ thống.
- `npm run dev:frontend`: Chạy độc lập Frontend ở chế độ Dev (nếu bạn muốn code Frontend bên ngoài Docker).

---

## 🤖 Luồng Hoạt động Trợ lý AI (RAG System)
> Xem chi tiết tài liệu kỹ thuật AI tại: [backend/app/ai_chat/README.md](backend/app/ai_chat/README.md)

Hệ thống sử dụng **Google Gemini** và **pgvector** để âm thầm cắt (chunk) tài liệu ngay khi giáo viên đăng bài, lưu các mảng vector vào database, sau đó cho phép học sinh đặt câu hỏi trực tiếp trên từng bài đăng/tài liệu bằng AI một cách siêu tốc.

---

## 🗄️ Cấu trúc Cơ sở Dữ liệu & Kiến trúc Backend
> Xem chi tiết Database Schema (ERD) và cách chạy Migration tại: [backend/README.md](backend/README.md)

Hệ thống bao gồm các bảng cốt lõi: `users`, `classes`, `posts`, `assignments`, `submissions`, `comments`, `attachments` và đặc biệt là `document_chunks` (lưu trữ vector 768 chiều phục vụ AI).
