from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from app.schemas.user import UserResponse

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    post_id: int
    content: str
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True

class PostCreate(BaseModel):
    content: str
    attachment_ids: Optional[List[int]] = []

class AttachmentResponse(BaseModel):
    id: int
    file_name: str
    file_url: str
    file_type: Optional[str]
    file_size: Optional[int]

    class Config:
        from_attributes = True

class PostResponse(BaseModel):
    id: int
    class_id: int
    content: str
    post_type: str
    created_at: datetime
    author: UserResponse
    comment_count: int = 0
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True

class PostDetailResponse(BaseModel):
    post: PostResponse
    comments: List[CommentResponse]

    class Config:
        from_attributes = True

