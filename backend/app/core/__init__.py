"""
Package Core của ứng dụng Smart Learning Platform Backend.

Package này chứa các thành phần nền tảng cốt lõi của ứng dụng:
- config: Quản lý cấu hình toàn cục & biến môi trường từ .env
- email: Tiện ích tạo và gửi Email chứa mã OTP qua SMTP
- exceptions: Các lớp ngoại lệ tùy chỉnh & bộ xử lý lỗi toàn cục (Global Exception Handlers)
- middleware: Các middleware xử lý CORS và đo thời gian phản hồi (Request Timing)
- redis: Quản lý Redis Cache & sinh/lưu/xác thực mã OTP, Reset Session Token với TTL 10 phút
- security: Tiện ích mã hóa/xác thực mật khẩu (bcrypt), quản lý JWT Token và Dependency get_current_user
"""

from app.core.config import Settings, settings
from app.core.email import send_otp_email
from app.core.exceptions import (
    AppException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
    register_exception_handlers,
)
from app.core.middleware import setup_cors, setup_request_logging_middleware
from app.core.redis import (
    MAX_OTP_ATTEMPTS,
    delete_otp,
    delete_reset_token,
    generate_otp_code,
    generate_reset_session_token,
    get_email_by_reset_token,
    get_otp,
    get_otp_attempts,
    increment_otp_attempts,
    save_otp,
    save_reset_token,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    get_password_hash,
    verify_password,
)

__all__ = [
    "Settings",
    "settings",
    "send_otp_email",
    "generate_otp_code",
    "generate_reset_session_token",
    "save_otp",
    "get_otp",
    "delete_otp",
    "increment_otp_attempts",
    "get_otp_attempts",
    "save_reset_token",
    "get_email_by_reset_token",
    "delete_reset_token",
    "MAX_OTP_ATTEMPTS",
    "AppException",
    "BadRequestException",
    "UnauthorizedException",
    "ForbiddenException",
    "NotFoundException",
    "ConflictException",
    "InternalServerErrorException",
    "register_exception_handlers",
    "setup_cors",
    "setup_request_logging_middleware",
    "get_password_hash",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "get_current_user",
]
