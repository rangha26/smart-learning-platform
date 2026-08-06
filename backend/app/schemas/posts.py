from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import UserRole
from app.schemas.classes import UserSummaryResponse


class PostCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

    @field_validator("content", mode="before")
    @classmethod
    def strip_content(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value


class CommentCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_id: Optional[int] = Field(default=None, description="ID bình luận cha nếu đây là một trả lời")

    @field_validator("content", mode="before")
    @classmethod
    def strip_content(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value


class CommentResponse(BaseModel):
    id: int
    post_id: int
    parent_id: Optional[int] = None
    content: str
    created_at: datetime
    author: UserSummaryResponse
    author_role: UserRole
    replies: list["CommentResponse"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


CommentResponse.model_rebuild()


class PostResponse(BaseModel):
    id: int
    class_id: int
    content: str
    created_at: datetime
    author: UserSummaryResponse
    author_role: UserRole
    comments: list[CommentResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
