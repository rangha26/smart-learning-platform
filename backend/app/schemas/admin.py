from pydantic import BaseModel, ConfigDict
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
