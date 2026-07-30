"""
Module Quản lý Ngoại lệ & Lỗi Toàn cục (Global Exception Handling Module)

Module này cung cấp:
1. Các lớp Custom Exception kế thừa từ AppException (BadRequestException, UnauthorizedException, NotFoundException,...)
2. Định dạng phản hồi lỗi chuẩn hóa dưới dạng JSON (Standard Error Response Format).
3. Đăng ký Global Exception Handlers cho FastAPI (xử lý AppException, Pydantic RequestValidationError, StarletteHTTPException, Unhandled Exception 500).
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("app.exceptions")


# ==========================================
# 1. CUSTOM EXCEPTION CLASSES
# ==========================================

class AppException(Exception):
    """Base Exception cho toàn bộ ứng dụng"""
    def __init__(
        self,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error_code: str = "BAD_REQUEST",
        message: str = "Đã xảy ra lỗi.",
        details: Optional[Any] = None,
    ):
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.details = details
        super().__init__(message)


class BadRequestException(AppException):
    """Ngoại lệ dành cho yêu cầu không hợp lệ (HTTP 400 Bad Request)"""
    def __init__(self, message: str = "Yêu cầu không hợp lệ", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="BAD_REQUEST",
            message=message,
            details=details,
        )


class UnauthorizedException(AppException):
    """Ngoại lệ dành cho lỗi chưa xác thực hoặc Token không hợp lệ (HTTP 401 Unauthorized)"""
    def __init__(self, message: str = "Chưa xác thực hoặc Token không hợp lệ", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
            message=message,
            details=details,
        )


class ForbiddenException(AppException):
    """Ngoại lệ dành cho lỗi từ chối truy cập do không có quyền (HTTP 403 Forbidden)"""
    def __init__(self, message: str = "Bạn không có quyền thực hiện thao tác này", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN",
            message=message,
            details=details,
        )


class NotFoundException(AppException):
    """Ngoại lệ dành cho tài nguyên không tìm thấy (HTTP 404 Not Found)"""
    def __init__(self, message: str = "Không tìm thấy tài nguyên yêu cầu", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            message=message,
            details=details,
        )


class ConflictException(AppException):
    """Ngoại lệ dành cho xung đột dữ liệu/trùng lặp (HTTP 409 Conflict)"""
    def __init__(self, message: str = "Dữ liệu bị trùng lặp hoặc xung đột", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            error_code="CONFLICT",
            message=message,
            details=details,
        )


class InternalServerErrorException(AppException):
    """Ngoại lệ dành cho lỗi hệ thống máy chủ (HTTP 500 Internal Server Error)"""
    def __init__(self, message: str = "Lỗi hệ thống nội bộ", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="INTERNAL_SERVER_ERROR",
            message=message,
            details=details,
        )


# ==========================================
# 2. HELPER MAKE ERROR RESPONSE
# ==========================================

def create_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: Optional[Any] = None
) -> JSONResponse:
    """Tạo đối tượng JSONResponse chứa định dạng cấu trúc lỗi chuẩn hóa"""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": error_code,
                "message": message,
                "details": details,
            }
        }
    )


# ==========================================
# 3. GLOBAL EXCEPTION HANDLERS REGISTRATION
# ==========================================

def register_exception_handlers(app: FastAPI) -> None:
    """Đăng ký tất cả global exception handlers cho ứng dụng FastAPI"""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        """Xử lý các ngoại lệ ứng dụng tùy chỉnh (AppException)"""
        logger.warning(f"AppException [{exc.error_code}] tại {request.method} {request.url.path}: {exc.message}")
        return create_error_response(
            status_code=exc.status_code,
            error_code=exc.error_code,
            message=exc.message,
            details=exc.details,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Xử lý lỗi validation dữ liệu đầu vào (HTTP 422 từ Pydantic / FastAPI)"""
        errors: List[Dict[str, str]] = []
        for error in exc.errors():
            loc = " -> ".join([str(x) for x in error.get("loc", []) if x != "body"])
            errors.append({
                "field": loc if loc else "body",
                "message": error.get("msg", "Dữ liệu không hợp lệ")
            })

        logger.warning(f"ValidationError tại {request.method} {request.url.path}: {errors}")
        return create_error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            message="Dữ liệu đầu vào không hợp lệ.",
            details=errors,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        """Xử lý lỗi HTTP mặc định của FastAPI / Starlette"""
        error_code_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "CONFLICT",
            429: "TOO_MANY_REQUESTS",
        }
        error_code = error_code_map.get(exc.status_code, "HTTP_ERROR")
        logger.warning(f"HTTPException [{exc.status_code}] tại {request.method} {request.url.path}: {exc.detail}")

        return create_error_response(
            status_code=exc.status_code,
            error_code=error_code,
            message=str(exc.detail),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        """Xử lý tất cả các lỗi không được bắt trước đó (HTTP 500 Unhandled Exceptions)"""
        logger.error(f"Unhandled Exception tại {request.method} {request.url.path}: {str(exc)}", exc_info=True)
        return create_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="INTERNAL_SERVER_ERROR",
            message="Đã xảy ra lỗi không xác định từ phía máy chủ.",
            details=str(exc) if app.debug else None
        )
