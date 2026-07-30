"""
Package Core của ứng dụng Smart Learning Platform Backend.

Package này chứa các thành phần nền tảng cốt lõi của ứng dụng:
- config: Quản lý cấu hình toàn cục & biến môi trường từ .env
- exceptions: Các lớp ngoại lệ tùy chỉnh & bộ xử lý lỗi toàn cục (Global Exception Handlers)
- middleware: Các middleware xử lý CORS và đo thời gian phản hồi (Request Timing)
- security: Tiện ích mã hóa/xác thực mật khẩu (bcrypt) và quản lý JWT Token
"""

from app.core.config import Settings, settings
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
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)

__all__ = [
    "Settings",
    "settings",
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
]
