"""
Module Middleware Ứng dụng (App Middleware Module)

Module này quản lý các Middleware cho FastAPI:
1. CORS Middleware (`setup_cors`): Cấu hình quyền truy cập cross-origin cho Frontend từ danh sách settings.CORS_ORIGINS.
2. Request Timing Middleware (`setup_request_logging_middleware`): Tự động đo thời gian phản hồi API và gắn header `X-Process-Time` vào response.
"""

import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


def setup_cors(app: FastAPI) -> None:
    """Cấu hình Middleware CORS cho ứng dụng FastAPI"""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],  # Cho phép tất cả các HTTP methods (GET, POST, PUT, DELETE, OPTIONS,...)
        allow_headers=["*"],  # Cho phép tất cả các HTTP headers (Authorization, Content-Type,...)
    )


def setup_request_logging_middleware(app: FastAPI) -> None:
    """Middleware tự động đo thời gian phản hồi (X-Process-Time) cho mỗi request"""
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        return response
