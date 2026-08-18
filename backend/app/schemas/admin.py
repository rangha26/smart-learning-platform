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

