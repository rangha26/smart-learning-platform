from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from app.schemas.user import UserResponse

class ClassCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    subject: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None

class ClassResponse(BaseModel):
    id: int
    title: str
    subject: str
    description: Optional[str] 
    join_code: str
    instructor_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ClassJoin(BaseModel):
    join_code: str = Field(..., min_length=6, max_length=6)

class ClassMembersResponse(BaseModel):
    instructor_id: UserResponse
    students: List[UserResponse]
    total_students: int
    instructor_id: int

    class Config:
        from_attributes = True