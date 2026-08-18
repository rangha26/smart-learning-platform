from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.db import get_db
from app.models import User, UserRole, UserStatus, Class, ClassEnrollment
from app.auth.dependencies import require_roles
from app.core import NotFoundException, BadRequestException, revoke_all_user_tokens
from app.schemas import UserAdminResponse, UserStatusUpdateRequest, UserListAdminResponse, AdminClassListResponse, ClassAdminResponse
from app.schemas.auth import MessageResponse
from typing import List, Optional

router = APIRouter(
    prefix="/admin/users",
    tags=["Admin User Management"]
)

@router.get("", response_model=UserListAdminResponse, summary="Lấy danh sách người dùng với phân trang và lọc")

def list_users(search: Optional[str] = Query(None, description="Từ khóa tìm kiếm (email hoặc tên đầy đủ)"), role: Optional[UserRole] = None, page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100), db: Session = Depends(get_db), current_admin: User = Depends(require_roles(UserRole.ADMIN))):
    """
    Lấy danh sách người dùng với phân trang và lọc.
    Chỉ admin mới có quyền truy cập.
    """
    query = db.query(User)

    if search:
        query = query.filter(or_(User.email.ilike(f"%{search}%"), User.full_name.ilike(f"%{search}%")))

    if role:
        query = query.filter(User.role == role)

    total_count = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "items": users
    }

@router.patch("/{user_id}/status", response_model=UserAdminResponse, summary="Cập nhật trạng thái người dùng")
def update_user_status(user_id: int, status_update: UserStatusUpdateRequest, db: Session = Depends(get_db), current_admin: User = Depends(require_roles(UserRole.ADMIN))):
    """
    Cập nhật trạng thái của người dùng.
    Chỉ admin mới có quyền truy cập.
    """
    if user_id == current_admin.id:
        raise BadRequestException(message="Admin không thể thay đổi trạng thái của chính mình.")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise NotFoundException(message="Người dùng không tồn tại.")

    user.status = status_update.status

    if status_update.status == UserStatus.INACTIVE:
        revoke_all_user_tokens(user.id)
    
    db.commit()
    db.refresh(user)

    return user

@router.get("/classes", response_model=AdminClassListResponse, summary="Admin xem danh sách lớp học")
def admin_list_classes(db: Session = Depends(get_db), current_admin: User = Depends(require_roles(UserRole.ADMIN))):
    """
    Lấy danh sách lớp học.
    Chỉ admin mới có quyền truy cập.
    """
    query = db.query(Class).all()

    result = []
    for c in query:
        student_count = db.query(func.count(ClassEnrollment.id)).filter(ClassEnrollment.class_id == c.id).scalar()

        result.append(ClassAdminResponse(
            id=c.id,
            title=c.title,
            subject=c.subject,
            join_code=c.join_code,
            instructor_name=c.instructor.full_name if c.instructor else None,
            student_count=student_count,
            status=c.status.value,
            created_at=c.created_at
        ))
    return {
        "total": len(result),
        "items": result
    }

@router.delete("/classes/{class_id}", response_model=MessageResponse, summary="Admin xóa lớp học")
def delete_class(class_id: int, db: Session = Depends(get_db), current_admin: User = Depends(require_roles(UserRole.ADMIN))):
    """
    Xóa một lớp học.
    Chỉ admin mới có quyền truy cập.
    """
    class_to_delete = db.query(Class).filter(Class.id == class_id).first()

    if not class_to_delete:
        raise NotFoundException(message="Lớp học không tồn tại.")

    db.delete(class_to_delete)
    db.commit()

    return MessageResponse(message="Lớp học đã được xóa thành công.")