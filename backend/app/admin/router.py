from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db import get_db
from app.models import User, UserRole, UserStatus
from app.auth.dependencies import require_roles
from app.core import NotFoundException, BadRequestException
from app.schemas.admin import UserAdminResponse, UserStatusUpdateRequest
from typing import List, Optional

router = APIRouter(
    prefix="/admin/users",
    tags=["Admin User Management"]
)

@router.get("", response_model=List[UserAdminResponse], summary="Lấy danh sách người dùng với phân trang và lọc")

def list_users(search: Optional[str] = Query(None, description="Từ khóa tìm kiếm (email hoặc tên đầy đủ)"), role: Optional[UserRole] = None, db: Session = Depends(get_db), current_admin: User = Depends(require_roles(UserRole.ADMIN))):
    """
    Lấy danh sách người dùng với phân trang và lọc.
    Chỉ admin mới có quyền truy cập.
    """
    query = db.query(User)

    if search:
        query = query.filter(or_(User.email.ilike(f"%{search}%"), User.full_name.ilike(f"%{search}%")))

    if role:
        query = query.filter(User.role == role)

    users = query.order_by(User.created_at.desc()).all()

    return users

@router.patch("/{user_id}/status", response_model=UserAdminResponse, summary="Cập nhật trạng thái người dùng")
def update_user_status(user_id: int, status_update: UserStatusUpdateRequest, db: Session = Depends(get_db), current_admin: User = Depends(require_roles(UserRole.ADMIN))):
    """
    Cập nhật trạng thái của người dùng.
    Chỉ admin mới có quyền truy cập.
    """
    if user_id == current_admin.id:
        raise BadRequestException(detail="Admin không thể thay đổi trạng thái của chính mình.")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise NotFoundException(detail="Người dùng không tồn tại.")

    user.status = status_update.status
    db.commit()
    db.refresh(user)

    return user