from fastapi import FastAPI
from app.auth import auth_router
from app.classes import classes_router
from app.dashboard import dashboard_router
from app.posts import posts_router
from app.core import (
    NotFoundException,
    register_exception_handlers,
    settings,
    setup_cors,
    setup_request_logging_middleware,
)
from app.assignments.router import router as assignments_router
from app.admin.router import router as admin_router

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="API cho Smart Learning Platform",
    debug=settings.DEBUG,
)

# 1. Kich hoat Middleware CORS va Request Timing
setup_cors(app)
setup_request_logging_middleware(app)

# 2. Dang ky Global Exception Handlers
register_exception_handlers(app)

# 3. Dang ky Routers Auth
app.include_router(auth_router, prefix="/api/v1")
app.include_router(classes_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(posts_router, prefix="/api/v1")
app.include_router(assignments_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Learning Platform API"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# Endpoint test Exception Handlers (chi dung thu nghiem)
@app.get("/test-error/{error_type}")
def test_error(error_type: str):
    if error_type == "not-found":
        raise NotFoundException("Khong tim thay tai nguyen yeu cau mau.")
    elif error_type == "unhandled":
        raise ValueError("Loi runtime co tinh ban ra de kiem tra exception handler 500.")
    return {"message": "No error raised"}