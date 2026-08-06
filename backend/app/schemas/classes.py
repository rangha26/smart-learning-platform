from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import ClassStatus


class ClassCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    subject: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=2000)
    join_code: Optional[str] = Field(default=None, min_length=4, max_length=20)

    @field_validator("title", "subject", "description", mode="before")
    @classmethod
    def strip_text(cls, value: Optional[str]) -> Optional[str]:
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @field_validator("join_code", mode="before")
    @classmethod
    def normalize_join_code(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = "".join(str(value).upper().split())
        return cleaned or None


class ClassJoinRequest(BaseModel):
    join_code: str = Field(..., min_length=4, max_length=20)

    @field_validator("join_code", mode="before")
    @classmethod
    def normalize_join_code(cls, value: str) -> str:
        return "".join(str(value).upper().split())


class UserSummaryResponse(BaseModel):
    id: int
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class ClassResponse(BaseModel):
    id: int
    title: str
    subject: Optional[str] = None
    description: Optional[str] = None
    join_code: str
    instructor_id: int
    instructor: UserSummaryResponse
    status: ClassStatus
    created_at: datetime
    student_count: int = 0

    model_config = ConfigDict(from_attributes=True)
