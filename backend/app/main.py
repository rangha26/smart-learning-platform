<<<<<<< HEAD
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.endpoints import auth, classroom, post, storage
from app.core.config import settings
from app.core.exceptions import global_exception_handler
from starlette.exceptions import HTTPException as StarletteHTTPException

app = FastAPI(title="Smart Learning Platform API")

origins = settings.ALLOWED_HOSTS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(classroom.router, prefix="/api/v1/classes", tags=["Class Management"])
app.include_router(post.router, prefix="/api/v1/stream", tags=["Stream"])
app.include_router(storage.router, prefix="/api/v1/storage", tags=["Storage"])
=======
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

>>>>>>> develop

app.add_exception_handler(StarletteHTTPException, global_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

@app.get("/", tags=["Health Check"])
async def health_check():
    return {"success": True, "message": "Backend API is running smoothly!"}

<<<<<<< HEAD
if not os.path.exists(settings.UPLOAD_DIRECTORY):
    os.makedirs(settings.UPLOAD_DIRECTORY)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIRECTORY), name="uploads")
=======
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
>>>>>>> develop
