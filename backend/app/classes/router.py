import random
import string

from fastapi import APIRouter, Depends, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.core import BadRequestException, ConflictException, ForbiddenException, NotFoundException
from app.db import get_db
from app.models import Class, ClassEnrollment, ClassStatus, User, UserRole
from app.schemas import ClassCreateRequest, ClassJoinRequest, ClassResponse, UserSummaryResponse


router = APIRouter(prefix="/classes", tags=["Classes"])


def _student_count(db: Session, class_id: int) -> int:
    return (
        db.query(func.count(ClassEnrollment.id))
        .filter(ClassEnrollment.class_id == class_id)
        .scalar()
        or 0
    )


def _class_response(db: Session, class_: Class) -> ClassResponse:
    return ClassResponse(
        id=class_.id,
        title=class_.title,
        subject=class_.subject,
        description=class_.description,
        join_code=class_.join_code,
        instructor_id=class_.instructor_id,
        instructor=UserSummaryResponse.model_validate(class_.instructor),
        status=class_.status,
        created_at=class_.created_at,
        student_count=_student_count(db, class_.id),
    )


def _generate_join_code(db: Session) -> str:
    alphabet = string.ascii_uppercase.replace("O", "").replace("I", "") + "23456789"
    for _ in range(20):
        code = "".join(random.choice(alphabet) for _ in range(6))
        exists = db.query(Class.id).filter(Class.join_code == code).first()
        if not exists:
            return code
    raise ConflictException("Could not generate a unique class code. Please try again.")


def _get_class_or_404(db: Session, class_id: int) -> Class:
    class_ = db.query(Class).filter(Class.id == class_id).first()
    if not class_:
        raise NotFoundException("Class not found.")
    return class_


def _ensure_can_view_class(db: Session, class_: Class, user: User) -> None:
    if user.role == UserRole.ADMIN:
        return
    if user.role == UserRole.INSTRUCTOR and class_.instructor_id == user.id:
        return
    if user.role == UserRole.STUDENT:
        is_enrolled = (
            db.query(ClassEnrollment.id)
            .filter(
                ClassEnrollment.class_id == class_.id,
                ClassEnrollment.student_id == user.id,
            )
            .first()
        )
        if is_enrolled:
            return
    raise ForbiddenException("You do not have access to this class.")


@router.post(
    "",
    response_model=ClassResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_class(
    payload: ClassCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INSTRUCTOR)),
):
    join_code = payload.join_code or _generate_join_code(db)
    join_code = join_code.upper()

    existing = db.query(Class.id).filter(Class.join_code == join_code).first()
    if existing:
        raise ConflictException("This class code is already in use.")

    new_class = Class(
        title=payload.title,
        subject=payload.subject,
        description=payload.description,
        join_code=join_code,
        instructor_id=current_user.id,
        status=ClassStatus.ACTIVE,
    )
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return _class_response(db, new_class)


@router.post("/join", response_model=ClassResponse)
def join_class(
    payload: ClassJoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
):
    class_ = db.query(Class).filter(Class.join_code == payload.join_code).first()
    if not class_:
        raise NotFoundException("Class code does not exist.")

    if class_.status != ClassStatus.ACTIVE:
        raise BadRequestException("This class is not active.")

    existing_enrollment = (
        db.query(ClassEnrollment)
        .filter(
            ClassEnrollment.class_id == class_.id,
            ClassEnrollment.student_id == current_user.id,
        )
        .first()
    )
    if existing_enrollment:
        return _class_response(db, class_)

    enrollment = ClassEnrollment(class_id=class_.id, student_id=current_user.id)
    db.add(enrollment)
    db.commit()
    return _class_response(db, class_)


@router.get("/my-classes", response_model=list[ClassResponse])
def get_my_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.ADMIN:
        classes = db.query(Class).order_by(Class.created_at.desc()).all()
    elif current_user.role == UserRole.INSTRUCTOR:
        classes = (
            db.query(Class)
            .filter(Class.instructor_id == current_user.id)
            .order_by(Class.created_at.desc())
            .all()
        )
    else:
        classes = (
            db.query(Class)
            .join(ClassEnrollment, ClassEnrollment.class_id == Class.id)
            .filter(ClassEnrollment.student_id == current_user.id)
            .order_by(Class.created_at.desc())
            .all()
        )

    return [_class_response(db, class_) for class_ in classes]


@router.get("/{class_id}", response_model=ClassResponse)
def get_class_detail(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    class_ = _get_class_or_404(db, class_id)
    _ensure_can_view_class(db, class_, current_user)
    return _class_response(db, class_)
