import uuid
from typing import Optional

from fastapi import UploadFile
from supabase import Client, create_client

from app.core.config import settings
from app.core.exceptions import InternalServerErrorException

def get_supabase_client() -> Optional[Client]:
    """Khởi tạo Supabase client từ cấu hình."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None
    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception:
        return None


# Singleton instance
supabase_client = get_supabase_client()


async def upload_file_to_supabase(file: UploadFile, folder: str = "general") -> str:
    """
    Tải file lên Supabase Storage và trả về Public URL.
    
    :param file: UploadFile từ FastAPI request.
    :param folder: Tên thư mục con trên bucket (ví dụ: 'assignments', 'submissions', 'posts').
    :return: Public URL của file đã upload.
    """
    if not supabase_client:
        raise InternalServerErrorException("Chưa cấu hình Supabase (thiếu URL hoặc KEY).")
        
    try:
        # Lấy đuôi mở rộng của file
        filename = file.filename or "file"
        file_extension = filename.split(".")[-1] if "." in filename else ""
        
        # Tạo tên file duy nhất tránh trùng lặp
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        
        # Đường dẫn lưu trên Supabase bucket
        # Nếu folder rỗng thì đẩy thẳng vào root
        file_path_in_bucket = f"{folder}/{unique_filename}" if folder else unique_filename
        
        # Đọc nội dung file dạng byte
        file_bytes = await file.read()
        
        # Reset con trỏ file trong trường hợp cần đọc lại
        await file.seek(0)
        
        # Upload file lên bucket
        # Sử dụng storage API của supabase-py
        res = supabase_client.storage.from_(settings.SUPABASE_BUCKET).upload(
            path=file_path_in_bucket,
            file=file_bytes,
            file_options={"content-type": file.content_type or "application/octet-stream"}
        )
        
        # Lấy public URL
        public_url = supabase_client.storage.from_(settings.SUPABASE_BUCKET).get_public_url(file_path_in_bucket)
        
        return public_url
        
    except Exception as e:
        raise InternalServerErrorException(f"Lỗi khi upload file lên Supabase: {str(e)}")
