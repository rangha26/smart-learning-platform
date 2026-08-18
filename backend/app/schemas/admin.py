from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.models import UserRole, UserStatus

class UserAdminResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserStatusUpdateRequest(BaseModel):
    status: UserStatus

class UserListAdminResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[UserAdminResponse]

class ClassAdminResponse(BaseModel):
    id: int
    title: str
    subject: str
    join_code: str
    instructor_name: str
    student_count: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AdminClassListResponse(BaseModel):
    total: int
    items: List[ClassAdminResponse]

