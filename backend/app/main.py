from fastapi import FastAPI
from app.auth import auth_router
from app.core import (
    NotFoundException,
    register_exception_handlers,
    settings,
    setup_cors,
    setup_request_logging_middleware,
)

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="API cho Smart Learning Platform",
    debug=settings.DEBUG,
)

# 1. Kích hoạt Middleware CORS và Request Timing
setup_cors(app)
setup_request_logging_middleware(app)

# 2. Đăng ký Global Exception Handlers
register_exception_handlers(app)

# 3. Đăng ký Routers Auth
app.include_router(auth_router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Learning Platform API"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# Endpoint test Exception Handlers (chỉ dùng thử nghiệm)
@app.get("/test-error/{error_type}")
def test_error(error_type: str):
    if error_type == "not-found":
        raise NotFoundException("Không tìm thấy tài nguyên yêu cầu mẫu.")
    elif error_type == "unhandled":
        raise ValueError("Lỗi runtime cố tình bắn ra để kiểm tra exception handler 500.")
    return {"message": "No error raised"}
