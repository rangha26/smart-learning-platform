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

app.add_exception_handler(StarletteHTTPException, global_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

@app.get("/", tags=["Health Check"])
async def health_check():
    return {"success": True, "message": "Backend API is running smoothly!"}

if not os.path.exists(settings.UPLOAD_DIRECTORY):
    os.makedirs(settings.UPLOAD_DIRECTORY)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIRECTORY), name="uploads")